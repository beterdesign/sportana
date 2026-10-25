import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'w1ng3i4w',
    dataset: 'production'
  },
  // hosted at https://sportana.sanity.studio
  studioHost: 'sportana',
  deployment: {
    appId: 'ohtxvt7cvq0eya4uapanwmxi',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
