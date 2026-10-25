// All site copy lives here, so editing content never means touching layout.
// Everything marked TODO is filled from the client brief (brief/BRIEF.md) during the build.

export const site = {
  name: 'Sportana',
  email: 'info@sportana.rs',
  calendly: '', // TODO: booking link, or leave empty to hide "Book a call"
  linkedin: '', // TODO
  logo: '/brand/logo.svg',
  mark: '/brand/mark.svg',
  title: 'Sportana — TODO: positioning line',
  description: 'TODO: 150–160 character description for search results and social cards.',
};

export const nav = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'Studio', href: '/studio' },
  { label: 'Journal', href: '/journal' },
];

// Labels for Sanity project categories (keep ids in sync with studio/schemaTypes/project.ts).
export const categories = [
  { id: 'all', label: 'All' },
  { id: 'one', label: 'TODO: category one' },
  { id: 'two', label: 'TODO: category two' },
  { id: 'three', label: 'TODO: category three' },
];

export const steps = [
  { kicker: 'Discovery', title: 'TODO', text: 'TODO', tags: 'TODO' },
  { kicker: 'Strategy', title: 'TODO', text: 'TODO', tags: 'TODO' },
  { kicker: 'Build', title: 'TODO', text: 'TODO', tags: 'TODO' },
  { kicker: 'Launch', title: 'TODO', text: 'TODO', tags: 'TODO' },
];

export const services = [
  { title: 'TODO: service', text: 'TODO', price: '', sub: 'TODO', long: 'TODO', deliverables: ['TODO'] },
];

export const clients = []; // TODO: client / partner names for "Trusted by", or remove the block

export const principles = [{ title: 'TODO', text: 'TODO' }];

export const servicesFaq = [{ q: 'TODO', a: 'TODO' }];
export const studioFaq = [{ q: 'TODO', a: 'TODO' }];

export const journalTopics = [
  { id: 'all', label: 'All' },
  { id: 'case', label: 'Case studies' },
  { id: 'guide', label: 'Guides' },
  { id: 'news', label: 'News' },
];

export const faqGroups = [{ title: 'TODO', items: [{ q: 'TODO', a: 'TODO' }] }];
