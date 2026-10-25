import {defineField, defineType} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Kategorija',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Naziv', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', title: 'Adresa stranice', type: 'slug', options: {source: 'title'}, validation: (r) => r.required()}),
    defineField({name: 'short', title: 'Kratki opis (na pločici)', type: 'string'}),
    defineField({name: 'intro', title: 'Uvod na stranici kategorije', type: 'text', rows: 3}),
    defineField({
      name: 'image',
      title: 'Fotografija',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Opis slike (alt)'}],
    }),
    defineField({
      name: 'types',
      title: 'Tipovi proizvoda (filteri)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({name: 'order', title: 'Redosled', type: 'number'}),
  ],
  orderings: [{title: 'Redosled', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'short', media: 'image'}},
})
