// Reads the shop from Sanity at build time: settings, categories, brands and products.
// The dataset is public, so no token is needed to read it. Every query runs once per build (memoised).
import { createClient } from '@sanity/client';
import { toHTML } from '@portabletext/to-html';

const SANITY_PROJECT_ID = 'w1ng3i4w';

export const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2025-02-19',
  useCdn: false, // builds should always see the latest published content
});

const memo = new Map();
const once = (key, query) => {
  if (!memo.has(key)) memo.set(key, sanity.fetch(query));
  return memo.get(key);
};

// Sanity image URL, resized and served as WebP/AVIF. fit=max: never upscale a small upload.
export function img(image, width = 1600) {
  const ref = image?.asset?._ref || image?.asset?._id;
  if (!ref) return '';
  const [, id, size, ext] = ref.split('-');
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/production/${id}-${size}.${ext}?w=${width}&fit=max&auto=format&q=80`;
}

// widths are capped at the upload's own width, so the browser never picks an upscaled file
export function srcset(image, widths = [400, 800, 1200, 1600, 2400, 3200]) {
  const ref = image?.asset?._ref || image?.asset?._id;
  if (!ref) return '';
  const w = Number(ref.split('-')[2]?.split('x')[0]) || 9999;
  const list = widths.filter((x) => x < w).concat(w <= widths.at(-1) ? [w] : []);
  return list.map((x) => `${img(image, x)} ${x}w`).join(', ');
}

// natural size of an upload, from the asset id (image-<hash>-<w>x<h>-<ext>)
export function dims(image) {
  const ref = image?.asset?._ref || image?.asset?._id || '';
  const [w, h] = (ref.split('-')[2] || '').split('x').map(Number);
  return { width: w || 1200, height: h || 1200 };
}

export const fold = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/đ/g, 'dj')
    .replace(/[̀-ͯ]/g, '');

export const rsd = (n) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} RSD`;

export const getSettings = () => once('settings', `*[_id == "settings"][0]`);

export const getCategories = () =>
  once(
    'categories',
    `*[_type == "category"] | order(order asc) {
      _id, title, "slug": slug.current, short, intro, image, types,
      "count": count(*[_type == "product" && references(^._id)])
    }`,
  );

export const getBrands = () =>
  once(
    'brands',
    `*[_type == "brand"] | order(name asc) {
      _id, name, "slug": slug.current, about,
      "count": count(*[_type == "product" && references(^._id)]),
      "cover": *[_type == "product" && references(^._id)] | order(price desc) [0].images[0]
    }`,
  );

const productFields = `
  _id, name, "slug": slug.current, type, price, salePrice, inStock, isNew, featured, kpId, images,
  "category": category->{title, "slug": slug.current},
  "brand": brand->{name, "slug": slug.current}
`;

export async function getProducts() {
  const list = await once('products', `*[_type == "product" && defined(slug.current)] | order(_createdAt desc) { ${productFields}, description, specs }`);
  return list.map(toProduct);
}

function toProduct(p) {
  const sale = p.salePrice && p.salePrice < p.price ? p.salePrice : null;
  return {
    ...p,
    href: `/proizvod/${p.slug}`,
    sale,
    now: sale || p.price,
    off: sale ? Math.round((1 - sale / p.price) * 100) : 0,
    inStock: p.inStock !== false,
    images: p.images || [],
    description: p.description || [],
    specs: p.specs || [],
  };
}

// compact record for the client: search, filters, cart, wishlist
export const toIndex = (p) => ({
  id: p._id.replace('product-', ''),
  s: p.slug,
  n: p.name,
  b: p.brand?.name || '',
  bs: p.brand?.slug || '',
  c: p.category?.slug || '',
  ct: p.category?.title || '',
  t: p.type || '',
  p: p.price,
  sp: p.sale || 0,
  i: img(p.images[0], 400),
  new: p.isNew ? 1 : 0,
  st: p.inStock ? 1 : 0,
});

const plain = (blocks = []) =>
  blocks
    .filter((b) => b._type === 'block')
    .map((b) => (b.children || []).map((c) => c.text || '').join(''))
    .join(' ');
export const descriptionText = (blocks) => plain(blocks).replace(/\s+/g, ' ').trim();

const escape = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Portable Text → HTML for product descriptions
export function richText(blocks = []) {
  return toHTML(blocks, {
    components: {
      types: {
        image: ({ value }) => `<figure><img src="${img(value, 1400)}" alt="${escape(value.alt || '')}" loading="lazy" /></figure>`,
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
