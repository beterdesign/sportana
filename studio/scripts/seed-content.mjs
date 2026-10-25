// Loads first content into Sanity from content/seed.json (written from the client brief).
// Safe to re-run: documents use fixed _id values and are replaced.
//
//   cd studio && npm run seed
//
// seed.json is an array of Sanity documents, with two shortcuts:
//   - any image field can be {"_upload": "brief/inputs/photo.jpg" or "https://…", "alt": "…"}
//   - rich text fields (brief, body) can be a list of {"style": "normal"|"h2"|"h3"|"blockquote", "text": "…"}
//     or {"listItem": "bullet", "text": "…"} items, instead of full Portable Text
import {getCliClient} from 'sanity/cli'
import {randomUUID} from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2025-02-19'})
const root = path.resolve('..')
const docs = JSON.parse(fs.readFileSync(path.join(root, 'content/seed.json'), 'utf8'))
const key = () => randomUUID().replace(/-/g, '').slice(0, 12)
// uploaded images are remembered in content/uploads.json, so a re-run never uploads the same file twice
const cacheFile = path.join(root, 'content/uploads.json')
const uploads = new Map(fs.existsSync(cacheFile) ? Object.entries(JSON.parse(fs.readFileSync(cacheFile, 'utf8'))) : [])
const saveCache = () => fs.writeFileSync(cacheFile, JSON.stringify(Object.fromEntries(uploads), null, 1))

async function upload(src) {
  if (uploads.has(src)) return uploads.get(src)
  const buffer = /^https?:\/\//.test(src) ? Buffer.from(await (await fetch(src)).arrayBuffer()) : fs.readFileSync(path.join(root, src))
  const asset = await client.assets.upload('image', buffer, {filename: path.basename(src.split('?')[0])})
  uploads.set(src, asset._id)
  return asset._id
}

const isSimpleBlock = (v) => v && typeof v === 'object' && typeof v.text === 'string' && !v._type

async function convert(value) {
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) {
      if (isSimpleBlock(item)) {
        out.push({
          _type: 'block',
          _key: key(),
          style: item.style || 'normal',
          ...(item.listItem ? {listItem: item.listItem, level: 1} : {}),
          markDefs: [],
          children: [{_type: 'span', _key: key(), text: item.text, marks: []}],
        })
      } else {
        const converted = await convert(item)
        out.push(converted && typeof converted === 'object' && !converted._key ? {_key: key(), ...converted} : converted)
      }
    }
    return out
  }
  if (value && typeof value === 'object') {
    if (value._upload) {
      const ref = await upload(value._upload)
      const {_upload, ...rest} = value
      return {_type: 'image', ...rest, asset: {_type: 'reference', _ref: ref}}
    }
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = await convert(v)
    return out
  }
  return value
}

// --only <type> seeds one document type; documents go up 6 at a time
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null
const queue = docs.filter((d) => !only || d._type === only)
for (const doc of queue) if (!doc._id || !doc._type) throw new Error(`every seed document needs _id and _type: ${JSON.stringify(doc).slice(0, 80)}`)
let done = 0
async function worker() {
  while (queue.length) {
    const doc = queue.shift()
    await client.createOrReplace(await convert(doc))
    if (++done % 25 === 0) saveCache()
    console.log(`${doc._type.padEnd(8)} ${doc._id}`)
  }
}
await Promise.all(Array.from({length: 6}, worker))
saveCache()
console.log(`done: ${docs.length} documents, ${uploads.size} images`)
