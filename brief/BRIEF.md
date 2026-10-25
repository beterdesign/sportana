# Project brief: Sportana

Built from `brief/inputs/` (owner's request 25.10.2026, the client's KupujemProdajem shop, inspiration links).
Defaults chosen for anything unknown are listed under **Open questions**.

## Client
- **Name:** SPORTANA d.o.o. Vrbas (on KP: "DOO Sportana")
- **Domain:** sportana.rs (assumed)
- **What they do:** online and mail-order retail of fitness and sports equipment: cardio machines, weights and
  benches, functional training gear, martial arts equipment, balls and team sports, table games, recovery and
  support gear, kids' ride-ons and outdoor items.
- **Facts we have:** registered 11.12.2015, seat Panonska 22, Vrbas; KP member since 10.02.2016, 571 positive /
  2 negative reviews, ~368 active listings (25.10.2026). Brands sold: Kettler, Everlast, Lotto Fitness, Orion,
  NordicTrack, Spalding, Capriolo, Nabaiji, Sporter Boxing, TLS, BMA, Thema Sport, Gymost, Body Sculpture…
- **Who they sell to:** home gym owners, recreational athletes, martial arts clubs and coaches, schools/clubs
  (cones, goals, ball carts, coach boards), parents (kids' ride-ons, balance bikes).
- **Where:** all of Serbia, site in Serbian (Latin script).
- **Contact email:** info@sportana.rs (assumed).

## Goal of the site
- **Main action:** find a product fast (search, categories, filters) → add to cart → order. Ordering/checkout is
  built **last** (owner's decision); until then the cart works fully and the checkout step says ordering is coming.
- **Success in 6 months:** the shop sells directly instead of only through KP.

## Brand (made by beterdesign)
- **Logo:** `public/brand/logo.svg` — wordmark SPORTANA in Archivo Condensed ExtraBold, oblique 10°, the "O" is a
  solid ball (volt on dark, ink on light). `mark.svg` / favicon — volt ball with an oblique black S.
  Preview: `brief/logo-preview.png`.
- **Colours:** ink `#0B0B0A` (text, dark sections) · paper `#F6F5F1` (background) · white `#FFFFFF` (product
  stage) · volt `#D4FF1F` (accent: announcement bar, sale badges, the ball, focus) · grey `#EBEAE4` (cards) ·
  sale red not used (sale = volt badge, like the inspiration).
- **Type:** Archivo (Google Fonts, variable width + weight). Display: condensed 62–75 width, 800 weight, caps.
  Body/UI: normal width, 400–600.
- **Tone:** direct, energetic, practical. "Oprema za trening kod kuće, u sali i na terenu." No hype, no invented
  numbers.

## Design direction
- **Main inspiration — Achilles Heel:** white base, black condensed caps, volt announcement marquee, text nav
  ("Meni · Pretraga · Korpa (0)"), full-bleed video hero with the giant wordmark, horizontal product rails,
  brands list with hover image, sale rail with % badges, pinned "O nama" split.
- **Secondary — Ridely:** benefits strip, timed sale banner, newsletter block.
- **Search is the priority:** a search overlay reachable from every page (button, `/` and Ctrl/⌘+K), instant
  results while typing, works without diacritics ("trbusnjaci" finds "trbušnjake"), popular searches and
  categories when empty, full results page with filters.

## Sitemap
| Page | Purpose | Sections |
|---|---|---|
| `/` Početna | show range, start search | announcement marquee, video hero + wordmark, category tiles, Novo rail, brands list, sale banner + rail, benefits strip, "O nama" split, plain-words paragraph |
| `/prodavnica` | all products | filters (kategorija, tip, brend, cena, samo akcija), sort, grid |
| `/kategorija/[slug]` (9) | category landing | image header, type chips, filtered grid |
| `/proizvod/[slug]` (~350) | product | gallery, price/sale, add to cart, wishlist, description, specs, related, recently viewed |
| `/akcija` | everything on sale | grid sorted by discount |
| `/brendovi` | brand index | brand list → filtered shop |
| `/pretraga` | search results | query, filters, grid |
| `/korpa` | cart | lines, qty, totals, checkout placeholder |
| `/sacuvano` | wishlist | saved products |
| `/o-nama`, `/kontakt`, `/cesta-pitanja`, `/privatnost`, 404 | info | |

## Section sources
- **Brand mood:** volt ball on paper — a clean sports catalogue that moves.
- **Signature interaction:** the search overlay (instant, diacritic-proof) + the ball that "drops" into the cart
  counter on add-to-cart.

| Page · section | Source |
|---|---|
| Home · announcement | Achilles Heel volt marquee |
| Home · hero | Achilles Heel full-bleed media + giant wordmark (video: Pixabay #200657) |
| Home · categories | Achilles Heel Men/Women tiles, extended to 9 photo tiles |
| Home · rails | Achilles Heel featured collections |
| Home · brands | Achilles Heel brands list + image (hover swaps the image) |
| Home · sale | Ridely sale banner + Achilles sale rail |
| Home · benefits | Ridely features strip |
| Home · about | Achilles Heel pinned "About us" split |

## Content model (Sanity, project `w1ng3i4w`)
- `product`: name, slug, category →, type, brand →, price, salePrice, images[], description, specs[],
  inStock, isNew, featured, kpId.
- `category`: title, slug, image, intro, order, types[].
- `brand`: name, slug, image.
- `settings` (singleton): announcement items, hero title/text/poster, contact (email, phone, address, hours),
  benefits, about text.
- Who edits: studio; client access later.

## Copy
- Product names, prices and descriptions: from the client's KP listings (lightly cleaned: typos in names).
- Everything else written by us in the brand tone; facts only from the inputs.

## SEO / AEO
- Themes: oprema za fitnes, teretana kod kuće, trake za trčanje, sobni bicikli, tegovi, bokserske rukavice,
  džakovi, košarkaške lopte, stoni tenis, auto na akumulator za decu. Location: Srbija, Vrbas.
- Product schema (Product + Offer, RSD) on product pages, ItemList on categories, Organization + FAQ.

## Technical
- Cart and wishlist: browser storage (localStorage). Checkout/order flow: **later phase**.
- Search index: built at build time from Sanity (`/search.json`).
- Hosting: Cloudflare Workers, publish in Sanity → rebuild by webhook.

## Open questions (defaults in use)
- Domain `sportana.rs` and email `info@sportana.rs` — assumed.
- Phone number — not public on KP; contact page shows email + address only until we get it.
- Delivery and payment terms (courier, price, cash on delivery) — FAQ answers are written generically and marked
  in Sanity/`site.js`; confirm before launch.
- **Sale prices are demo values** (about 15% off on 16 products) to show the sale feature. Set the real ones in
  Sanity (`salePrice`) or clear them before launch.
- "Novo" = the 16 most recently listed products on KP; editable per product (`isNew`).
- Product photos are the client's own KP photos; lifestyle photography/video from Pixabay (free licence).
- Duplicated KP ads (same product listed twice) were merged into one product.
