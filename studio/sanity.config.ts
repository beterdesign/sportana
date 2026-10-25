import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// Settings is a single document; everything else is a list.
export default defineConfig({
  name: 'default',
  title: 'Sportana',

  projectId: 'w1ng3i4w',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Sportana')
          .items([
            S.listItem().title('Podešavanja sajta').id('settings').child(S.document().schemaType('settings').documentId('settings')),
            S.divider(),
            S.documentTypeListItem('product').title('Proizvodi'),
            S.listItem()
              .title('Na akciji')
              .child(S.documentList().title('Na akciji').filter('_type == "product" && defined(salePrice)')),
            S.documentTypeListItem('category').title('Kategorije'),
            S.documentTypeListItem('brand').title('Brendovi'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({schemaType}) => schemaType !== 'settings'),
  },
})
