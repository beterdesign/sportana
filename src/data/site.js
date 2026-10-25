// Copy that is not in Sanity. Contact details, the announcement bar, hero and "O nama" texts live in Sanity
// (Podešavanja sajta); these are the fallbacks and the fixed labels.

export const site = {
  name: 'Sportana',
  legal: 'SPORTANA d.o.o. Vrbas',
  founded: '11. decembra 2015.',
  email: 'info@sportana.rs',
  address: 'Panonska 22, 21460 Vrbas',
  title: 'Sportana | Sportska i fitnes oprema, Vrbas',
  description:
    'Online prodavnica sportske opreme: trake za trčanje, sobni bicikli, tegovi, oprema za boks, lopte, stoni tenis i vozila za decu. Sportana, Vrbas, od 2015.',
};

// What people look for most: shown in the empty search overlay
export const popularSearches = [
  'Traka za trčanje',
  'Sobni bicikl',
  'Bokserske rukavice',
  'Bučice',
  'Košarkaška lopta',
  'Strunjača',
  'Sto za stoni tenis',
  'Auto na akumulator',
];

export const infoLinks = [
  { label: 'Akcija', href: '/akcija' },
  { label: 'Brendovi', href: '/brendovi' },
  { label: 'O nama', href: '/o-nama' },
  { label: 'Kontakt', href: '/kontakt' },
  { label: 'Česta pitanja', href: '/cesta-pitanja' },
];

// Delivery and payment answers are general until the client confirms their terms (see brief, Open questions).
export const faq = [
  {
    title: 'Kupovina',
    items: [
      {
        q: 'Kako da pronađem proizvod?',
        a: 'Kliknite na „Pretraga” u zaglavlju ili pritisnite taster / na tastaturi i počnite da kucate. Pretraga radi i bez kvačica: „trbusnjaci” pronalazi „trbušnjake”. Možete i da birate kategoriju iz menija pa suzite izbor filterima po tipu, brendu i ceni.',
      },
      {
        q: 'Kako da poručim?',
        a: 'Dodajte proizvode u korpu i pratite korake u korpi. Poručivanje direktno preko sajta stiže uskoro; do tada nam pišite na email sa spiskom iz korpe i javićemo vam se sa potvrdom.',
      },
      {
        q: 'Da li su cene na sajtu konačne?',
        a: 'Cene su izražene u dinarima (RSD). Akcijske cene važe do isteka akcije ili dok traju zalihe.',
      },
    ],
  },
  {
    title: 'Isporuka',
    items: [
      {
        q: 'Gde isporučujete?',
        a: 'Šaljemo na adrese širom Srbije. Rok i cena isporuke zavise od veličine i težine paketa; tačne uslove dobijate uz potvrdu porudžbine.',
      },
      {
        q: 'Šta je sa velikim spravama, poput traka za trčanje?',
        a: 'Velike sprave šaljemo u originalnom pakovanju. Pre slanja vas kontaktiramo da dogovorimo termin isporuke.',
      },
    ],
  },
  {
    title: 'O Sportani',
    items: [
      {
        q: 'Ko stoji iza Sportane?',
        a: 'SPORTANA d.o.o. iz Vrbasa, osnovana 2015. godine, bavi se trgovinom na malo putem pošte i interneta. Na KupujemProdajem nas kupci prate od 2016. godine.',
      },
      {
        q: 'Koje brendove prodajete?',
        a: 'Između ostalih Kettler, Everlast, Lotto Fitness, Orion, NordicTrack, Spalding, Capriolo, Nabaiji i Sporter Boxing. Ceo spisak je na stranici Brendovi.',
      },
    ],
  },
];
