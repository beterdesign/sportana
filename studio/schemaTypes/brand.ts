import {defineField, defineType} from 'sanity'

export const brand = defineType({
  name: 'brand',
  title: 'Brend',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Naziv', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', title: 'Adresa', type: 'slug', options: {source: 'name'}, validation: (r) => r.required()}),
    defineField({name: 'about', title: 'Kratko o brendu', type: 'text', rows: 2}),
  ],
  preview: {select: {title: 'name', subtitle: 'about'}},
})
