import {defineField, defineType} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'card', title: 'Card & listing', default: true},
    {name: 'case', title: 'Case study'},
  ],
  fields: [
    defineField({name: 'title', title: 'Client / project name', type: 'string', group: 'card', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'card',
      options: {source: 'title', maxLength: 80},
      description: 'The page address: /work/your-slug',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      group: 'card',
      options: {
        list: [
          {title: 'TODO category one', value: 'one'},
          {title: 'TODO category two', value: 'two'},
          {title: 'TODO category three', value: 'three'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({name: 'tag', title: 'Short label', type: 'string', group: 'card', description: 'Under the name on cards, e.g. “Brand & website”'}),
    defineField({name: 'excerpt', title: 'One-line summary', type: 'text', rows: 3, group: 'card'}),
    defineField({name: 'services', title: 'Services', type: 'array', of: [{type: 'string'}], group: 'card', options: {layout: 'tags'}}),
    defineField({
      name: 'coverImage',
      type: 'image',
      group: 'card',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Homepage position',
      type: 'number',
      group: 'card',
      description: '1–5 puts the project on the homepage in that order. Leave empty to show it only on /work.',
      validation: (r) => r.min(1).max(5).integer(),
    }),
    defineField({name: 'order', title: 'Order on /work', type: 'number', group: 'card', description: 'Lower numbers come first.'}),

    defineField({name: 'liveUrl', title: 'Live site', type: 'url', group: 'case'}),
    defineField({name: 'year', type: 'string', group: 'case'}),
    defineField({name: 'partner', type: 'string', group: 'case', description: 'Agency or partner the project came through, if any'}),
    defineField({name: 'brief', title: 'The story', type: 'blockContent', group: 'case'}),
    defineField({name: 'scope', title: 'What we did', type: 'array', of: [{type: 'string'}], group: 'case'}),
    defineField({name: 'closing', title: 'Closing line', type: 'text', rows: 3, group: 'case'}),
    defineField({
      name: 'gallery',
      type: 'array',
      group: 'case',
      of: [{type: 'image', options: {hotspot: true}, fields: [{name: 'alt', type: 'string', title: 'Alt text'}]}],
      options: {layout: 'grid'},
    }),
  ],
  orderings: [
    {title: 'Order on /work', name: 'order', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Homepage position', name: 'featured', by: [{field: 'featured', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'tag', media: 'coverImage', featured: 'featured'},
    prepare: ({title, subtitle, media, featured}) => ({
      title,
      subtitle: featured ? `★ Homepage #${featured} · ${subtitle ?? ''}` : subtitle,
      media,
    }),
  },
})
