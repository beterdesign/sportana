import {defineField, defineType} from 'sanity'

export const settings = defineType({
  name: 'settings',
  title: 'Podešavanja sajta',
  type: 'document',
  groups: [
    {name: 'home', title: 'Početna', default: true},
    {name: 'contact', title: 'Kontakt'},
  ],
  fields: [
    defineField({
      name: 'announcements',
      title: 'Traka sa obaveštenjima (vrh sajta)',
      type: 'array',
      of: [{type: 'string'}],
      group: 'home',
    }),
    defineField({name: 'heroTitle', title: 'Hero naslov', type: 'string', group: 'home'}),
    defineField({name: 'heroText', title: 'Hero tekst', type: 'text', rows: 2, group: 'home'}),
    defineField({
      name: 'heroImage',
      title: 'Hero fotografija (poster za video)',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Opis slike (alt)'}],
      group: 'home',
    }),
    defineField({name: 'saleTitle', title: 'Akcija: naslov banera', type: 'string', group: 'home'}),
    defineField({name: 'saleText', title: 'Akcija: tekst banera', type: 'text', rows: 2, group: 'home'}),
    defineField({name: 'saleEnds', title: 'Akcija traje do', type: 'datetime', group: 'home', description: 'Prazno = bez odbrojavanja.'}),
    defineField({
      name: 'benefits',
      title: 'Prednosti (traka na početnoj)',
      type: 'array',
      group: 'home',
      of: [
        {
          type: 'object',
          name: 'benefit',
          fields: [
            {name: 'title', type: 'string', title: 'Naslov'},
            {name: 'text', type: 'string', title: 'Tekst'},
          ],
        },
      ],
    }),
    defineField({name: 'aboutTitle', title: 'O nama: naslov', type: 'string', group: 'home'}),
    defineField({name: 'aboutText', title: 'O nama: tekst', type: 'text', rows: 5, group: 'home'}),
    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact'}),
    defineField({name: 'phone', title: 'Telefon', type: 'string', group: 'contact', description: 'U formatu +381 …'}),
    defineField({name: 'address', title: 'Adresa', type: 'string', group: 'contact'}),
    defineField({name: 'hours', title: 'Radno vreme', type: 'string', group: 'contact'}),
    defineField({name: 'kpUrl', title: 'KupujemProdajem profil', type: 'url', group: 'contact'}),
    defineField({name: 'instagram', title: 'Instagram', type: 'url', group: 'contact'}),
  ],
  preview: {prepare: () => ({title: 'Podešavanja sajta'})},
})
