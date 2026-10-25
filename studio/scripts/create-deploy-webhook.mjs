// Creates (or keeps) the Sanity webhook that rebuilds the site on Cloudflare when content is published.
// The deploy hook URL is passed in, never committed:
//
//   $env:DEPLOY_HOOK_URL = 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/...'
//   npx sanity exec scripts/create-deploy-webhook.mjs --with-user-token
import {getCliClient} from 'sanity/cli'

const url = process.env.DEPLOY_HOOK_URL
if (!url?.startsWith('https://api.cloudflare.com/')) throw new Error('Set DEPLOY_HOOK_URL to the Cloudflare deploy hook URL')

const client = getCliClient({apiVersion: '2021-10-04'}).withConfig({useProjectHostname: false})
const {projectId} = getCliClient().config()
const name = 'Rebuild site on Cloudflare'

const existing = await client.request({url: `/hooks/projects/${projectId}`})
const found = existing.find((h) => h.name === name)
if (found) {
  console.log(`already exists: ${found.id}`)
} else {
  const hook = await client.request({
    url: `/hooks/projects/${projectId}`,
    method: 'POST',
    body: {
      type: 'document',
      name,
      description: 'Starts a Cloudflare Workers build whenever a project or journal post is published, changed or deleted.',
      url,
      httpMethod: 'POST',
      dataset: 'production',
      apiVersion: 'v2025-02-19',
      includeDrafts: false,
      rule: {
        on: ['create', 'update', 'delete'],
        filter: '_type in ["project", "post"]',
        projection: '{_id, _type}',
      },
    },
  })
  console.log(`created: ${hook.id}`)
}
