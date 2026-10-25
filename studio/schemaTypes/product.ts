import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Proizvod',
  type: 'document',
  groups: [
    {name: 'basic', title: 'Osnovno', default: true},
    {name: 'price', title: 'Cena i lager'},
    {name: 'content', title: 'Opis i slike'},
  ],
  fields: [
    defineField({name: 'name', title: 'Naziv', type: 'string', group: 'basic', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Adresa stranice',
      type: 'slug',
      group: 'basic',
      options: {source: 'name', maxLength: 90},
      description: 'sportana.rs/proizvod/…',
      validation: (r) => r.required(),
    }),
    defineField({name: 'category', title: 'Kategorija', type: 'reference', to: [{type: 'category'}], group: 'basic', validation: (r) => r.required()}),
    defineField({
      name: 'type',
      title: 'Tip proizvoda',
      type: 'string',
      group: 'basic',
      description: 'Podkategorija za filtere, npr. „Trake za trčanje”. Isti tekst kao u listi tipova kategorije.',
    }),
    defineField({name: 'brand', title: 'Brend', type: 'reference', to: [{type: 'brand'}], group: 'basic'}),
    defineField({name: 'price', title: 'Cena (RSD)', type: 'number', group: 'price', validation: (r) => r.required().min(0)}),
    defineField({
      name: 'salePrice',
      title: 'Akcijska cena (RSD)',
      type: 'number',
      group: 'price',
      description: 'Popunite samo ako je proizvod na akciji. Prazno = redovna cena.',
      validation: (r) =>
        r.custom((sale, ctx) => {
          const price = (ctx.document as {price?: number})?.price
          return sale == null || price == null || (sale as number) < price ? true : 'Akcijska cena mora biti niža od redovne'
        }),
    }),
    defineField({name: 'inStock', title: 'Na stanju', type: 'boolean', group: 'price', initialValue: true}),
    defineField({name: 'isNew', title: 'Novo', type: 'boolean', group: 'basic', description: 'Prikazuje se u „Novo u ponudi”.'}),
    defineField({name: 'featured', title: 'Izdvojeno na početnoj', type: 'boolean', group: 'basic'}),
    defineField({
      name: 'images',
      title: 'Fotografije',
      type: 'array',
      group: 'content',
      of: [{type: 'image', options: {hotspot: true}, fields: [{name: 'alt', type: 'string', title: 'Opis slike (alt)'}]}],
      validation: (r) => r.min(1),
    }),
    defineField({name: 'description', title: 'Opis', type: 'blockContent', group: 'content'}),
    defineField({
      name: 'specs',
      title: 'Specifikacije',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'spec',
          fields: [
            {name: 'label', type: 'string', title: 'Naziv'},
            {name: 'value', type: 'string', title: 'Vrednost'},
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        },
      ],
    }),
    defineField({name: 'kpId', title: 'KupujemProdajem ID', type: 'string', group: 'basic', readOnly: true}),
  ],
  orderings: [
    {title: 'Cena, rastuće', name: 'priceAsc', by: [{field: 'price', direction: 'asc'}]},
    {title: 'Naziv', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', price: 'price', sale: 'salePrice', media: 'images.0', category: 'category.title'},
    prepare: ({title, price, sale, media, category}) => ({
      title,
      media,
      subtitle: `${category || ''} · ${sale ? `${sale} RSD (akcija, redovno ${price})` : `${price} RSD`}`,
    }),
  },
})
