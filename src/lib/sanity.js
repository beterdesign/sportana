// Reads projects and journal posts from Sanity at build time.
// The dataset is public, so no token is needed to read it.
import { createClient } from '@sanity/client';
import { toHTML } from '@portabletext/to-html';

// Filled in by scripts/new-project.mjs once the Sanity project exists.
const SANITY_PROJECT_ID = 'w1ng3i4w';
// Before the CMS is connected every query returns nothing, so the site still builds.
const connected = !SANITY_PROJECT_ID.startsWith('__');

export const sanity = createClient({
  projectId: connected ? SANITY_PROJECT_ID : 'unset',
  dataset: 'production',
  apiVersion: '2025-02-19',
  useCdn: false, // builds should always see the latest published content
});
const fetchAll = (query) => (connected ? sanity.fetch(query) : Promise.resolve([]));

// Sanity image URL from an image field, resized and served as WebP/AVIF by the CDN.
export function img(image, width = 1600) {
  const ref = image?.asset?._ref || image?.asset?._id;
  if (!ref) return '';
  const [, id, size, ext] = ref.split('-');
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/production/${id}-${size}.${ext}?w=${width}&fit=max&auto=format&q=80`;
}

// srcset for responsive images; fit=max means the CDN never upscales, so small uploads stay visible to npm run qa
export function srcset(image, widths = [800, 1600, 2400, 3200]) {
  return img(image) ? widths.map((w) => `${img(image, w)} ${w}w`).join(', ') : '';
}

const projectFields = `
  _id, title, "slug": slug.current, category, tag, excerpt, services, featured, order,
  coverImage, "tone": coverImage.asset->metadata.palette.darkMuted.background
`;

const toCard = (p) => ({
  ...p,
  name: p.title,
  desc: p.excerpt,
  tags: p.services || [],
  href: `/work/${p.slug}`,
  image: img(p.coverImage, 1400),
  tone: p.tone || '#1d1d1b',
});

export async function getProjects() {
  const list = await fetchAll(`*[_type == "project" && defined(slug.current)] | order(order asc) { ${projectFields} }`);
  return list.map(toCard);
}

export async function getFeaturedProjects() {
  const list = await fetchAll(`*[_type == "project" && defined(featured)] | order(featured asc) [0...5] { ${projectFields} }`);
  return list.map(toCard);
}

export async function getProjectPages() {
  const list = await fetchAll(`*[_type == "project" && defined(slug.current)] | order(order asc) {
    ${projectFields}, liveUrl, year, partner, brief, scope, closing, gallery
  }`);
  return list.map(toCard);
}

const toPost = (p) => ({
  ...p,
  href: `/journal/${p.slug}`,
  image: img(p.coverImage, 1400),
});

export async function getPosts() {
  const list = await fetchAll(`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id, title, "slug": slug.current, topic, publishedAt, excerpt, coverImage
  }`);
  return list.map(toPost);
}

export async function getPostPages() {
  const list = await fetchAll(`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id, title, "slug": slug.current, topic, publishedAt, excerpt, coverImage, body
  }`);
  return list.map(toPost);
}

const plain = (block) => (block.children || []).map((c) => c.text || '').join('');
export const headingId = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// h2 headings, for the article table of contents
export const outline = (blocks = []) =>
  blocks.filter((b) => b._type === 'block' && b.style === 'h2').map((b) => ({ text: plain(b), id: headingId(plain(b)) }));

export const readingMinutes = (blocks = []) =>
  Math.max(1, Math.round(blocks.filter((b) => b._type === 'block').map(plain).join(' ').split(/\s+/).length / 230));

const escape = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Portable Text → HTML for the prose blocks on case study and article pages.
export function richText(blocks = []) {
  return toHTML(blocks, {
    components: {
      types: {
        image: ({ value }) =>
          `<figure><img src="${img(value, 1800)}" alt="${escape(value.alt || '')}" loading="lazy" />${
            value.caption ? `<figcaption>${escape(value.caption)}</figcaption>` : ''
          }</figure>`,
      },
      block: {
        h2: ({ children, value }) => `<h2 id="${headingId(plain(value))}">${children}</h2>`,
      },
      marks: {
        link: ({ children, value }) => {
          const href = value?.href || '#';
          const external = /^https?:\/\//.test(href) && !href.startsWith('https://sportana.rs');
          return `<a href="${escape(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${children}</a>`;
        },
      },
    },
  });
}
