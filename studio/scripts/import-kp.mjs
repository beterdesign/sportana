// Turns the client's KupujemProdajem listings (brief/inputs/kp-products.json) into content/seed.json:
// categories, brands, products and the settings document. Run from studio/: node scripts/import-kp.mjs
// Re-runnable: ids are fixed (product-<kpId>, category-<slug>, brand-<slug>).
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('..')
const raw = Object.values(JSON.parse(fs.readFileSync(path.join(root, 'brief/inputs/kp-products.json'), 'utf8')))

const fold = (s = '') =>
  s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'dj')
    .replace(/к/g, 'k')
    .replace(/м/g, 'm')
const slugify = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80).replace(/-$/, '')

/* ---------- categories ---------- */
export const categories = [
  ['kardio', 'Kardio', 'Trake, bicikli, vesla', 'Trake za trčanje, sobni i spin bicikli, krostrenažeri i vesla za trening kod kuće i u sali.', 'kardio.jpg', 'Trkači na asfaltu, detalj patika',
    ['Trake za trčanje', 'Sobni bicikli', 'Spin bicikli', 'Krostrenažeri', 'Vesla', 'Steperi']],
  ['snaga', 'Snaga i teretana', 'Tegovi, klupe, sprave', 'Tegovi, bučice, šipke, klupe i kombinovane sprave, plus nastavci i stalci za ozbiljnu kućnu teretanu.', 'snaga.jpg', 'Vežbač radi biceps pregib sa bučicom u teretani',
    ['Tegovi i bučice', 'Šipke i hvatovi', 'Klupe', 'Kombinovane sprave', 'Stalci', 'Nastavci za sajlu', 'Vratila i zidni setovi', 'Sprave i dodaci']],
  ['funkcionalni', 'Funkcionalni trening', 'Trake, strunjače, krosfit', 'Elastične trake, strunjače, bosu lopte, kutije za naskakanje i sve za krosfit i trening celim telom.', 'funkcionalni.jpg', 'Dvoje vežbača u planku sa bučicama na strunjači',
    ['Trake i gume', 'Strunjače i podloge', 'Balans i pilates', 'Krosfit oprema', 'Trbušnjaci i sklekovi', 'Brzina i kondicija']],
  ['borilacki-sportovi', 'Borilački sportovi', 'Boks, kik boks, karate', 'Rukavice, džakovi, kruške, fokuseri, kimona i zaštita za boks, kik boks, MMA, karate i džudo.', 'borilacki.jpg', 'Bokser u rukavicama u polumračnoj sali',
    ['Rukavice', 'Džakovi i kruške', 'Fokuseri', 'Zaštita', 'Kimona i odeća', 'Nosači']],
  ['lopte-i-timski-sportovi', 'Lopte i timski sportovi', 'Košarka, fudbal, odbojka', 'Lopte, koševi, golovi, mreže i oprema za trenere za košarku, fudbal, odbojku, rukomet i tenis.', 'lopte.jpg', 'Fudbalska lopta pod kopačkom na terenu',
    ['Košarka', 'Fudbal', 'Odbojka', 'Rukomet', 'Tenis', 'Oprema za trenere']],
  ['stoni-tenis-i-igre', 'Stoni tenis i igre', 'Stolovi, pikado, stoni fudbal', 'Stolovi za stoni tenis za dvorište i sobu, stoni fudbal, pikado i bilijar za igru u društvu.', 'igre.jpg', 'Igrač stonog tenisa za plavim stolom u dvorištu',
    ['Stoni tenis', 'Stoni fudbal', 'Pikado', 'Bilijar i multi igre']],
  ['zastita-i-oporavak', 'Zaštita i oporavak', 'Steznici, pojasevi, masaža', 'Steznici, štitnici, rukavice za fitnes, pojasevi i sve za masažu i oporavak posle treninga.', 'oporavak.jpg', 'Žena u meditaciji na podu svetle sobe',
    ['Steznici i štitnici', 'Rukavice za fitnes', 'Pojasevi', 'Masaža', 'Gurtne i dodaci']],
  ['deca', 'Deca', 'Autići, bicikli, skejtovi', 'Autići i kvadovi na akumulator, balans bicikli, trotineti, tricikli, skejtovi i trambolina.', 'deca.jpg', 'Deca sa biciklima u parku',
    ['Vozila na akumulator', 'Vozila na pedale', 'Balans bicikli i trotineti', 'Tricikli', 'Skejtbordovi', 'Igra na otvorenom']],
  ['plivanje-i-outdoor', 'Plivanje i outdoor', 'Plivanje, bicikli, kamp', 'Oprema za plivanje, bicikli i dodaci, roleri, rančevi i oprema za kampovanje.', 'outdoor.jpg', 'Plivačke staze u bazenu iz ptičje perspektive',
    ['Plivanje', 'Bicikli i oprema', 'Roleri', 'Kamp i odmor', 'Rančevi', 'Odeća i obuća']],
]

/* ---------- classification: first matching rule wins (tested on the folded name) ---------- */
const R = (re, cat, type) => [re, cat, type]
const rules = [
  R(/akumulator|baterij|elektricni auto|kvad|motor na/, 'deca', 'Vozila na akumulator'),
  R(/pedale/, 'deca', 'Vozila na pedale'),
  R(/balans bicikl|balans biciklo|trotinet|gur-gur/, 'deca', 'Balans bicikli i trotineti'),
  R(/tricikl/, 'deca', 'Tricikli'),
  R(/skejt/, 'deca', 'Skejtbordovi'),
  R(/trambolin|ljuljas|bazen|hvatovi za stenu|bumerang/, 'deca', 'Igra na otvorenom'),
  R(/stoni tenis/, 'stoni-tenis-i-igre', 'Stoni tenis'),
  R(/stoni fudbal/, 'stoni-tenis-i-igre', 'Stoni fudbal'),
  R(/pikado/, 'stoni-tenis-i-igre', 'Pikado'),
  R(/bilijar|sto za igru/, 'stoni-tenis-i-igre', 'Bilijar i multi igre'),
  R(/traka za t|motorna traka/, 'kardio', 'Trake za trčanje'),
  R(/krostrenaz/, 'kardio', 'Krostrenažeri'),
  R(/spin|spining/, 'kardio', 'Spin bicikli'),
  R(/sobni|sobno biciklo|ergometar|elektromagnetni/, 'kardio', 'Sobni bicikli'),
  R(/veslo|veslanje/, 'kardio', 'Vesla'),
  R(/steper/, 'kardio', 'Steperi'),
  // martial arts
  R(/(nosac|drzac) za/, 'borilacki-sportovi', 'Nosači'),
  R(/(boks|bokser|dzak|karate|mma|kik).*rukavic|rukavic.*(boks|bokser|dzak|karate|mma|kik)|bokserske rukavice/, 'borilacki-sportovi', 'Rukavice'),
  R(/fokuser/, 'borilacki-sportovi', 'Fokuseri'),
  R(/dzak|krusk|vreca za boks|lutka za udaranje|lopta za udaranje|aperkat/, 'borilacki-sportovi', 'Džakovi i kruške'),
  R(/kimon|kbk sorc|rush guard|borilacki pojas/, 'borilacki-sportovi', 'Kimona i odeća'),
  R(/kaciga|suspenzor|guma za zube|bandazer|kbk stitnik|karate stitnic|potkolenic/, 'borilacki-sportovi', 'Zaštita'),
  // balls and team sports
  R(/kosark|kos sa|zidni kos|obruc|spalding|mrezica za kos/, 'lopte-i-timski-sportovi', 'Košarka'),
  R(/odbojk/, 'lopte-i-timski-sportovi', 'Odbojka'),
  R(/rukomet/, 'lopte-i-timski-sportovi', 'Rukomet'),
  R(/tenis|padel/, 'lopte-i-timski-sportovi', 'Tenis'),
  R(/tabla za trenere|magnetna tabla|kolica za lopte|torba za lopte|kapice za obelez|markeri majice|mreze za rukometni/, 'lopte-i-timski-sportovi', 'Oprema za trenere'),
  R(/fudbal|golman|stucne|gol sa|zivi zid/, 'lopte-i-timski-sportovi', 'Fudbal'),
  // swimming and outdoor
  R(/plivanj|kupac/, 'plivanje-i-outdoor', 'Plivanje'),
  R(/bicikl|pumpa|torbica za ram/, 'plivanje-i-outdoor', 'Bicikli i oprema'),
  R(/roleri/, 'plivanje-i-outdoor', 'Roleri'),
  R(/kampovanj|lazy bag/, 'plivanje-i-outdoor', 'Kamp i odmor'),
  R(/ranac/, 'plivanje-i-outdoor', 'Rančevi'),
  R(/patike|asics|sorc/, 'plivanje-i-outdoor', 'Odeća i obuća'),
  // strength (before recovery: "pojas za biceps", "klupa za trbusnjake")
  R(/bench press sipka/, 'snaga', 'Šipke i hvatovi'),
  R(/set teg/, 'snaga', 'Tegovi i bučice'),
  R(/arm blaster|kapa za jacanje|ziroskop|gravitacione cizme|hip thrust|excentric|exentric|peg board|katapult|timer/, 'snaga', 'Sprave i dodaci'),
  R(/kombinovan|gladijator|multy gym/, 'snaga', 'Kombinovane sprave'),
  R(/klupa|klupe|bench/, 'snaga', 'Klupe'),
  R(/vratilo|zgibov/, 'snaga', 'Vratila i zidni setovi'),
  R(/stalak|propadanj/, 'snaga', 'Stalci'),
  R(/nastavak|kanap za triceps|triceps kanap|kanap za triceps|jednorucni kanap|donju vucu|dodatak za sajlu|v bar|dvostruki kanap/, 'snaga', 'Nastavci za sajlu'),
  R(/hvataljke/, 'zastita-i-oporavak', 'Rukavice za fitnes'),
  R(/sipk|hvat|grip|osigurac/, 'snaga', 'Šipke i hvatovi'),
  R(/teg|bucic|ketlbel|body pump|disk|zvona|otezivac/, 'snaga', 'Tegovi i bučice'),
  // recovery and support
  R(/steznik|steznic|stitnik|stitnici|zastita za dlan/, 'zastita-i-oporavak', 'Steznici i štitnici'),
  R(/rukavic/, 'zastita-i-oporavak', 'Rukavice za fitnes'),
  R(/pojas|kais/, 'zastita-i-oporavak', 'Pojasevi'),
  R(/masaz|kiropraktik/, 'zastita-i-oporavak', 'Masaža'),
  R(/gurtne|grtne|znojnic|magnezijum/, 'zastita-i-oporavak', 'Gurtne i dodaci'),
  // functional
  R(/strunjac|podloga|joga blok/, 'funkcionalni', 'Strunjače i podloge'),
  R(/bosu|balans board|air pad|pilates/, 'funkcionalni', 'Balans i pilates'),
  R(/tocak|tockovi|ab roler|ab mat|sklek|trbusnjak/, 'funkcionalni', 'Trbušnjaci i sklekovi'),
  R(/merdevine|prepone|cunjev|padobran|stoperica|vijac/, 'funkcionalni', 'Brzina i kondicija'),
  R(/trak|gum[ae]|mini band|trx|kinezi/, 'funkcionalni', 'Trake i gume'),
  R(/medicinka|slam ball|kutije|battle rope|bugarske|wall ball|prsluk|konopac|karike|slajder|platforme|turtle/, 'funkcionalni', 'Krosfit oprema'),
]

const brands = [
  [/kettler/, 'Kettler'], [/everlast/, 'Everlast'], [/lotto fitness/, 'Lotto Fitness'], [/orion/, 'Orion'],
  [/nordictrack|\bnt (commercial|gx)/, 'NordicTrack'], [/gymost/, 'Gymost'], [/sporter boxing/, 'Sporter Boxing'],
  [/\btls\b/, 'TLS'], [/\bbma\b/, 'BMA'], [/thema sport/, 'Thema Sport'], [/spalding/, 'Spalding'],
  [/capriolo/, 'Capriolo'], [/nabaiji/, 'Nabaiji'], [/\bpuma\b/, 'Puma'], [/asics/, 'Asics'],
  [/body sculpture/, 'Body Sculpture'], [/laura star|lara star/, 'Laura Star'], [/gim ?fit/, 'Gim Fit'],
  [/\boma\b/, 'OMA'], [/tigar/, 'Tigar'], [/\bhf\b/, 'HF'],
]

/* ---------- name clean-up: typos and truncated KP titles ---------- */
const fixes = [
  [/Šrioki/g, 'Široki'], [/olimpisjka/g, 'olimpijska'], [/Egronomski/g, 'Ergonomski'], [/Multi Multi/g, 'Multi'], [/kozne/g, 'kožne'], [/Eektronska/g, 'Elektronska'], [/Okrugl /g, 'Okrugli '], [/trbuđnjake/g, 'trbušnjake'],
  [/tčanje/g, 'trčanje'], [/trcanje/g, 'trčanje'], [/Podećavajuće/g, 'Podesive'], [/Grtne/g, 'Gurtne'],
  [/Autiž/g, 'Autić'], [/Mercrdes/g, 'Mercedes'], [/Porche/g, 'Porsche'], [/baterija /g, 'baterije '],
  [/Dečiji/g, 'Dečji'], [/dečiji/g, 'dečji'], [/Dečija/g, 'Dečja'], [/dečija/g, 'dečja'], [/Dečije/g, 'Dečje'],
  [/trbusnjake/g, 'trbušnjake'], [/podkolenicu/g, 'potkolenicu'], [/Olimpijska2\.2m/g, 'olimpijska 2,2 m'],
  [/ км\//g, ' km/'], [/\s+-\s*$/g, ''], [/\s{2,}/g, ' '], [/- /g, ' – '], [/ \.Klupa/g, '. Klupa'],
]
function cleanName(n) {
  let s = n.trim()
  for (const [re, to] of fixes) s = s.replace(re, to)
  s = s.replace(/\s+(Motorna|Motorna tra|Motorna trak)$/i, '') // KP cuts long titles
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ---------- description → Portable Text blocks + specs ---------- */
const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
// lines that only make sense on KP (contact, "see my other ads", stock talk) are dropped
const kpOnly = /kupujemprodajem|ostale oglase|pogledajte (i )?ostal|pozovite|poziv|viber|whats|telefon|06\d[\s/-]?\d|kontaktirajte|poruk|lično preuzimanje|licno preuzimanje|post ?express|šaljemo|saljemo|slanje|dostava|pouzeć|pouzec|cena je fiksna|nije moguć|zamena|https?:\/\//i
function describe(html = '') {
  const lines = decode(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h\d)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && !kpOnly.test(l))
  const blocks = []
  const specs = []
  for (const l of lines) {
    const bullet = /^[•\-–*✔✅►▪●·]\s*/.test(l)
    const text = l.replace(/^[•\-–*✔✅►▪●·]\s*/, '')
    const kv = text.match(/^([^:]{2,38}):\s*(.{1,60})$/)
    if (kv && !/[.!?]$/.test(kv[2]) && specs.length < 14) specs.push({ _key: `s${specs.length}`, label: kv[1].trim(), value: kv[2].trim() })
    else if (bullet) blocks.push({ listItem: 'bullet', text })
    else blocks.push({ style: 'normal', text })
  }
  return { blocks, specs }
}

/* ---------- build ---------- */
const docs = []
for (const [slug, title, short, intro, img, alt, types] of categories) {
  docs.push({
    _id: `category-${slug}`,
    _type: 'category',
    title,
    slug: { _type: 'slug', current: slug },
    short,
    intro,
    types,
    order: docs.length + 1,
    image: { _upload: `content/media/${img}`, alt },
  })
}

const seenBrands = new Map()
const seen = new Map()
const products = []
for (const a of raw) {
  a.photos = (a.photos || []).filter((src) => !/undefined/.test(src))
  if (a.error || !a.photos.length) continue
  const name = cleanName(a.title || a.name)
  const f = fold(name)
  const price = Number(String(a.price2 ?? a.price).replace(/[^\d]/g, ''))
  if (!price) continue
  // same product listed twice on KP: keep the listing with more photos
  const dupKey = `${f.replace(/[^a-z0-9]/g, '')}|${price}`
  if (seen.has(dupKey)) {
    const prev = seen.get(dupKey)
    if (prev.photos.length >= a.photos.length) continue
    products.splice(products.indexOf(prev.doc), 1)
  }
  const rule = rules.find(([re]) => re.test(f))
  const [cat, type] = rule ? [rule[1], rule[2]] : [/^fitnes/.test(a.cat) ? 'funkcionalni' : 'funkcionalni', 'Krosfit oprema']
  const brandName = (brands.find(([re]) => re.test(f)) || [])[1]
  if (brandName && !seenBrands.has(brandName)) seenBrands.set(brandName, slugify(brandName))
  const { blocks, specs } = describe(a.description)
  const doc = {
    _id: `product-${a.id}`,
    _type: 'product',
    kpId: String(a.id),
    name,
    category: { _type: 'reference', _ref: `category-${cat}` },
    type,
    ...(brandName ? { brand: { _type: 'reference', _ref: `brand-${seenBrands.get(brandName)}` } } : {}),
    price,
    inStock: true,
    images: a.photos.slice(0, 6).map((src, i) => ({ _upload: src, alt: i ? `${name}, fotografija ${i + 1}` : name })),
    ...(blocks.length ? { description: blocks } : {}),
    ...(specs.length ? { specs } : {}),
  }
  seen.set(dupKey, { photos: a.photos, doc })
  products.push(doc)
}

// unique slugs
const slugs = new Set()
for (const p of products) {
  let s = slugify(p.name)
  if (slugs.has(s)) s = `${s}-${p.kpId.slice(-4)}`
  slugs.add(s)
  p.slug = { _type: 'slug', current: s }
}

// "Novo": the most recent KP listings, at most 3 per category so one category does not fill the rail
const perCat = {}
;[...products]
  .sort((a, b) => b.kpId - a.kpId)
  .filter((p) => (perCat[p.category._ref] = (perCat[p.category._ref] || 0) + 1) <= 3)
  .slice(0, 16)
  .forEach((p) => (p.isNew = true))
// demo sale (about 15% off) on two products per category, mid-to-high prices: to be replaced by the client's real offers
for (const [slug] of categories) {
  const inCat = products.filter((p) => p.category._ref === `category-${slug}` && true).sort((a, b) => b.price - a.price)
  const picks = [inCat[Math.floor(inCat.length * 0.15)], inCat[Math.floor(inCat.length * 0.45)]].filter(Boolean)
  for (const p of new Set(picks)) p.salePrice = Math.round((p.price * 0.85) / 10) * 10
}
// featured on the home page: the best-photographed branded products
products
  .filter((p) => p.brand)
  .sort((a, b) => b.price - a.price)
  .filter((p, i, all) => all.findIndex((q) => q.category._ref === p.category._ref) === i)
  .slice(0, 8)
  .forEach((p) => (p.featured = true))

for (const [name, slug] of seenBrands) docs.push({ _id: `brand-${slug}`, _type: 'brand', name, slug: { _type: 'slug', current: slug } })

docs.push({
  _id: 'settings',
  _type: 'settings',
  announcements: [
    'Oprema za trening kod kuće, u sali i na terenu',
    'Isporuka na adresu širom Srbije',
    'Sportana, Vrbas, od 2015.',
    `${products.length}+ proizvoda na jednom mestu`,
  ],
  heroTitle: 'Treniraj gde god da si',
  heroText: 'Kardio sprave, tegovi, borilačka oprema, lopte, igre i vozila za decu. Sve na jednom mestu.',
  heroImage: { _upload: 'content/media/hero.jpg', alt: 'Vežbač radi sa battle rope konopcima u sali od cigle' },
  saleTitle: 'Akcija',
  saleText: 'Izdvojeni proizvodi po sniženim cenama, dok traju zalihe.',
  saleEnds: '2026-11-30T23:00:00.000Z',
  benefits: [
    { _key: 'b1', title: 'Sve na jednom mestu', text: 'Od gume za šaku do trake za trčanje.' },
    { _key: 'b2', title: 'Isporuka širom Srbije', text: 'Šaljemo na vašu adresu.' },
    { _key: 'b3', title: 'Od 2015. godine', text: 'Deset godina u sportskoj opremi.' },
    { _key: 'b4', title: 'Provereni brendovi', text: 'Kettler, Everlast, Spalding, Lotto Fitness…' },
  ],
  aboutTitle: 'Oprema koja izdrži trening',
  aboutText:
    'Sportana je trgovina sportskom opremom iz Vrbasa. Od 2015. godine opremamo kućne teretane, sale, klubove i dečje sobe: od trake za trčanje i tegova do bokserskih rukavica, košarkaških lopti i autića na akumulator. Kupci nas znaju sa KupujemProdajem, gde imamo više od 570 pozitivnih ocena.',
  email: 'info@sportana.rs',
  address: 'Panonska 22, 21460 Vrbas',
  kpUrl: 'https://www.kupujemprodajem.com/doo-sportana/svi-oglasi/1078419/1',
})

docs.push(...products)
fs.writeFileSync(path.join(root, 'content/seed.json'), JSON.stringify(docs, null, 1))

// report
const count = {}
for (const p of products) count[`${p.category._ref.slice(9)} / ${p.type}`] = (count[`${p.category._ref.slice(9)} / ${p.type}`] || 0) + 1
console.log(Object.entries(count).sort().map(([k, v]) => `${String(v).padStart(3)}  ${k}`).join('\n'))
console.log(`products ${products.length}, brands ${seenBrands.size}, images ${products.reduce((n, p) => n + p.images.length, 0)}, sale ${products.filter((p) => p.salePrice).length}, unmatched ${raw.filter((a) => !rules.find(([re]) => re.test(fold(cleanName(a.title || a.name))))).map((a) => a.title || a.name).join(' | ')}`)
