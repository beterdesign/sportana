# Sportana (sportana.rs)

Online prodavnica sportske i fitnes opreme, SPORTANA d.o.o. Vrbas. Built and maintained by the studio.

- **Site:** Astro (static) on Cloudflare Workers, worker `sportana`. Every push to `main` deploys.
- **CMS:** Sanity project `w1ng3i4w`, Studio at https://sportana.sanity.studio (products, categories, brands,
  site settings). Publishing rebuilds the site through the deploy-hook webhook.
- **Repo:** https://github.com/beterdesign/sportana

## Where things live
- Products, categories, brands, announcement bar, hero, sale banner, benefits, "O nama", contact: Sanity.
- Fixed labels, FAQ, popular searches: `src/data/site.js`.
- Search (no diacritics needed, Serbian word endings, one typo forgiven): `src/scripts/search.js`, index built at
  `/products.json`.
- Cart, wishlist, recently viewed (localStorage): `src/scripts/store.js`. Filters/sort/URL state:
  `src/scripts/listing.js`.
- Brand: `public/brand/logo.svg` (the "O" is a ball, `--ball` colours it), `mark.svg`, `favicon.svg`,
  preview in `brief/logo-preview.png`. Tokens in `src/styles/global.css`.

## Catalogue import
The first catalogue came from the client's KupujemProdajem shop (`brief/inputs/kp-products.json`).
`studio/scripts/import-kp.mjs` sorts it into categories/types/brands and writes `content/seed.json`;
`cd studio && npm run seed` uploads it (images are cached in `content/uploads.json`, so re-runs are cheap).
Re-running the import overwrites products edited in Sanity, so after launch edit in the Studio instead.

## Not built yet
Online checkout/ordering (next phase). Until then the cart page sends the order by email with the cart contents.
