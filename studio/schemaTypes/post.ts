import {defineField, defineType} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Journal post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      description: 'The page address: /journal/your-slug',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'topic',
      type: 'string',
      options: {
        list: [
          {title: 'Case study', value: 'case'},
          {title: 'Guide', value: 'guide'},
          {title: 'Studio news', value: 'news'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({name: 'publishedAt', title: 'Published', type: 'datetime', validation: (r) => r.required()}),
    defineField({name: 'excerpt', type: 'text', rows: 3, description: 'Shown in listings and as the search description.'}),
    defineField({
      name: 'coverImage',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
    }),
    defineField({name: 'body', type: 'blockContent'}),
  ],
  orderings: [{title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'topic', media: 'coverImage'},
  },
})
