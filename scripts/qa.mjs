// Strict QA gate: every built page at nine screen sizes, before anything is shown to the owner or the client.
//
//   npm install --no-save playwright-core     (once; kept out of package.json so deploys stay light)
//   npm run build && npm run qa               (add -- --shots for first-screen screenshots in qa/shots/)
//   npm run qa -- --only /work                (one page, or a comma-separated list)
//
// Serves dist/ the way Cloudflare does (clean URLs, 404 page) and checks, per page and size:
//   FAIL  content sticking out of the screen (sideways scroll), text cut off by its container, broken or upscaled
//         images, missing alt, console errors, failed requests, broken internal links and #anchors, SEO basics
//   WARN  images softer than retina, tap targets under 24px that crowd each other on phones, text under 10px, text still invisible after
//         scrolling past it with animations on
// Mark containers that clip on purpose (rails, marquees) with data-qa-ignore; aria-hidden content is skipped.
// Exit code 1 while anything FAILs. Full report: qa/report.md.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = [
  { name: '2560', width: 2560, height: 1440, dpr: 1 },
  { name: '1920', width: 1920, height: 1080, dpr: 1 },
  { name: '1440', width: 1440, height: 900, dpr: 2 },
  { name: '1280', width: 1280, height: 720, dpr: 1 },
  { name: '1024', width: 1024, height: 768, dpr: 2, mobile: true },
  { name: '768', width: 768, height: 1024, dpr: 2, mobile: true },
  { name: '390', width: 390, height: 844, dpr: 3, mobile: true },
  { name: '375', width: 375, height: 667, dpr: 2, mobile: true },
  { name: '360', width: 360, height: 780, dpr: 3, mobile: true },
];
const MOTION = ['1440', '390']; // sizes that also get a pass with animations on

const args = process.argv.slice(2);
const shots = args.includes('--shots');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const root = process.cwd();
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'qa');
if (!fs.existsSync(dist)) {
  console.error('No dist/ folder: run npm run build first.');
  process.exit(1);
}

/* ---------- static server: clean URLs like Cloudflare Workers assets ---------- */
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm' };
function resolve(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/index';
  for (const c of [p, `${p}.html`, `${p}/index.html`]) {
    const f = path.join(dist, c);
    if (f.startsWith(dist) && fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}
const server = http.createServer((req, res) => {
  const f = resolve(req.url);
  if (!f) {
    res.writeHead(404, { 'Content-Type': types['.html'] });
    return res.end(fs.existsSync(path.join(dist, '404.html')) ? fs.readFileSync(path.join(dist, '404.html')) : 'Not found');
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;

/* ---------- pages: every html file in dist ---------- */
const pages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.html')) {
      const rel = '/' + path.relative(dist, full).replace(/\\/g, '/').replace(/\.html$/, '').replace(/(^|\/)index$/, '');
      if (rel !== '/404') pages.push(rel.replace(/\/$/, '') || '/');
    }
  }
})(dist);
pages.sort();
const targets = only ? pages.filter((p) => only.includes(p)) : pages;

/* ---------- in-page checks (run inside the browser) ---------- */
function measure({ mobile, dpr, layout }) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const fail = [];
  const warn = [];
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.textContent || el.getAttribute('alt') || el.getAttribute('src') || '').trim().replace(/\s+/g, ' ').slice(0, 48);
    return `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}> "${text}"`;
  };
  const ignored = (el) => el.closest('[data-qa-ignore],[aria-hidden="true"],.sr-only,[hidden],template,dialog:not([open])');
  const shown = (el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  };
  const clips = (el) => /hidden|clip|auto|scroll/.test(getComputedStyle(el).overflowX + getComputedStyle(el).overflowY);
  const inFixed = (el) => {
    for (let a = el; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true;
    return false;
  };
  const opacity = (el) => {
    let o = 1;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) o *= parseFloat(getComputedStyle(a).opacity);
    return o;
  };
  const all = [...document.body.querySelectorAll('*')].filter((el) => !ignored(el) && shown(el));

  // 1. sideways overflow: elements outside the screen that nothing clips (html/body overflow-x hides the scrollbar,
  //    not the problem)
  const reported = new Set();
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) continue;
    if (reported.has(el.parentElement) || inFixed(el)) continue;
    let clipped = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (clips(a)) { clipped = true; break; }
    if (clipped) continue;
    reported.add(el);
    fail.push(`sticks out of the screen: ${label(el)} spans ${Math.round(r.left)}–${Math.round(r.right)}px, screen is ${vw}px`);
  }

  // 2. text cut off by a container that clips (masks, cards, panels)
  if (layout) {
    const seen = new Set();
    for (const box of all) {
      if (!clips(box)) continue;
      if (box.scrollWidth <= box.clientWidth + 2 && box.scrollHeight <= box.clientHeight + 2) continue;
      const b = box.getBoundingClientRect();
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!t.textContent.trim() || !t.parentElement || ignored(t.parentElement) || !shown(t.parentElement)) continue;
        const range = document.createRange();
        range.selectNodeContents(t);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        // a text range is taller than its line box when line-height < ~1.2, so vertically only count a line as cut
        // when its middle is outside the box or a large part of it hangs over the edge
        const mid = (r.top + r.bottom) / 2;
        const cut =
          r.right > b.right + 2 ||
          r.left < b.left - 2 ||
          mid > b.bottom ||
          mid < b.top ||
          r.bottom - b.bottom > r.height * 0.4 ||
          b.top - r.top > r.height * 0.4;
        if (cut && !seen.has(box)) {
          seen.add(box);
          fail.push(`text cut off: "${t.textContent.trim().slice(0, 48)}" inside ${label(box).split('>')[0]}> (text ${Math.round(r.left)}–${Math.round(r.right)}px × ${Math.round(r.top)}–${Math.round(r.bottom)}px, box ${Math.round(b.left)}–${Math.round(b.right)}px × ${Math.round(b.top)}–${Math.round(b.bottom)}px)`);
        }
      }
    }
  }

  // 3. images: broken, upscaled, softer than the screen, missing alt
  for (const img of document.images) {
    if (!img.hasAttribute('alt')) fail.push(`img without alt: ${img.currentSrc || img.src}`);
    if (ignored(img) || !shown(img)) continue;
    const r = img.getBoundingClientRect();
    if (r.width < 80 || /\.svg(\?|$)/.test(img.currentSrc || img.src)) continue;
    if (!img.complete || !img.naturalWidth) {
      fail.push(`image did not load: ${img.currentSrc || img.src}`);
      continue;
    }
    // the Sanity CDN happily upscales (?w=2400 on an 800px upload returns 2400px of blur), so the real width is
    // the original's, which Sanity puts in the file name: <hash>-<width>x<height>.<ext>
    const url = img.currentSrc || img.src;
    const orig = /cdn\.sanity\.io/.test(url) && url.match(/-(\d+)x(\d+)\.\w+(\?|$)/);
    const ratio = orig ? Math.min(1, +orig[1] / img.naturalWidth) : 1;
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    const fit = getComputedStyle(img).objectFit;
    const sx = r.width / w;
    const sy = r.height / h;
    const scale = fit === 'contain' || fit === 'scale-down' ? Math.min(sx, sy) : Math.max(sx, sy);
    const src = url.split('?')[0].split('/').pop();
    if (scale > 1.02) fail.push(`upscaled (blurry) image: ${src} has ${Math.round(w)}px of real detail but is shown ${Math.round(w * scale)}px wide`);
    else if (scale * Math.min(dpr, 2) > 1.25) warn.push(`soft on this screen: ${src} (${Math.round(w)}px, needs ~${Math.round(w * scale * Math.min(dpr, 2))}px for ${Math.min(dpr, 2)}x)`);
  }

  // 4. phones: tap targets and tiny text
  if (mobile && layout) {
    // WCAG 2.5.8: a target under 24px is fine when a 24px circle on it touches no other target
    const targets = all.filter((el) => el.matches('a[href],button,input,select,textarea,[role="button"]') && !inFixed(el) && !(el.tagName === 'A' && el.closest('p')));
    const rects = targets.map((el) => el.getBoundingClientRect());
    targets.forEach((el, i) => {
      const r = rects[i];
      if (!r.width || !r.height || (r.width >= 24 && r.height >= 24)) return;
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const crowded = rects.some((o, j) => j !== i && !targets[j].contains(el) && !el.contains(targets[j]) && Math.max(o.left - cx, 0, cx - o.right) ** 2 + Math.max(o.top - cy, 0, cy - o.bottom) ** 2 < 144);
      if (crowded) warn.push(`tap target ${Math.round(r.width)}×${Math.round(r.height)}px too close to another: ${label(el)}`);
    });
    const small = new Map();
    for (const el of all) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 10) small.set(`${Math.round(size * 10) / 10}px ${label(el).split('>')[0]}>`, true);
    }
    for (const k of small.keys()) warn.push(`text under 10px: ${k}`);
  }

  // 5. with motion on: text that sits on screen but is still invisible
  if (!layout) {
    for (const el of all) {
      if (inFixed(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > vh || !r.width) continue;
      if (opacity(el) < 0.05) warn.push(`still invisible after scrolling to it: ${label(el)}`);
    }
  }
  return { fail, warn };
}

function seo() {
  const fail = [];
  const warn = [];
  const q = (s) => document.querySelector(s);
  const title = document.title.trim();
  const desc = q('meta[name="description"]')?.content?.trim() || '';
  if (!title) fail.push('no <title>');
  else if (title.length > 65) warn.push(`title is ${title.length} characters (search shows ~60): "${title}"`);
  if (!desc) fail.push('no meta description');
  else if (desc.length < 50 || desc.length > 165) warn.push(`meta description is ${desc.length} characters (aim for 50–160)`);
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) fail.push(`${h1} h1 elements (needs exactly one)`);
  if (!document.documentElement.lang) fail.push('no lang on <html>');
  if (!q('link[rel="canonical"]')) fail.push('no canonical link');
  if (!q('meta[property="og:image"]')) fail.push('no og:image');
  if (q('meta[name="robots"][content*="noindex"]')) warn.push('page is noindex');
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      JSON.parse(s.textContent);
    } catch {
      fail.push('JSON-LD does not parse');
    }
  }
  const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
  const links = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (/^#./.test(href) && !ids.has(decodeURIComponent(href.slice(1))) && href !== '#contact') fail.push(`link to missing anchor ${href}`);
    if (/^\/(?!\/)/.test(href)) links.push(href.split('#')[0]);
    if (a.target === '_blank' && !/noopener|noreferrer/.test(a.rel)) warn.push(`target=_blank without rel=noopener: ${href}`);
    if (!a.textContent.trim() && !a.getAttribute('aria-label') && !a.querySelector('img[alt]:not([alt=""]),svg[aria-label]')) fail.push(`link without an accessible name: ${href}`);
  }
  return { fail, warn, links, og: q('meta[property="og:image"]')?.content || '' };
}

/* ---------- run ---------- */
let browser;
for (const channel of ['msedge', 'chrome', undefined]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}
if (!browser) {
  console.error('No browser found: install Edge or Chrome (or run npx playwright-core install chromium).');
  process.exit(1);
}

const results = {}; // page → { fail: Map(msg → sizes[]), warn: Map }
const note = (page, kind, msg, size) => {
  results[page] ??= { fail: new Map(), warn: new Map() };
  const m = results[page][kind];
  m.set(msg, [...(m.get(msg) || []), size]);
};
const internal = new Set();

async function visit(vp, page, { motion = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.mobile && vp.width < 768,
    hasTouch: !!vp.mobile,
    reducedMotion: motion ? 'no-preference' : 'reduce',
  });
  const tab = await ctx.newPage();
  const size = motion ? `${vp.name} motion` : vp.name;
  tab.on('console', (m) => m.type() === 'error' && note(page, 'fail', `console error: ${m.text().slice(0, 160)}`, size));
  tab.on('pageerror', (e) => note(page, 'fail', `script error: ${e.message.slice(0, 160)}`, size));
  tab.on('requestfailed', (r) => note(page, 'fail', `request failed: ${r.url().slice(0, 120)}`, size));
  tab.on('response', (r) => r.status() >= 400 && r.url().startsWith(origin) && r.request().resourceType() !== 'document' && note(page, 'fail', `${r.status()} for ${r.url().replace(origin, '')}`, size));
  const res = await tab.goto(origin + page, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => (note(page, 'fail', `page did not load: ${e.message.split('\n')[0]}`, size), null));
  if (!res) return ctx.close();
  if (res.status() !== 200) note(page, 'fail', `HTTP ${res.status()}`, size);
  await tab.evaluate(() => document.fonts.ready);

  if (motion) {
    // let the preloader and intro finish, then scroll the way a person does
    await tab.waitForFunction(() => !document.body.classList.contains('is-loading'), null, { timeout: 8000 }).catch(() => {});
    await tab.waitForTimeout(1200);
    const height = await tab.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += Math.round(vp.height * 0.8)) {
      await tab.mouse.move(vp.width / 2, vp.height / 2);
      await tab.mouse.wheel(0, Math.round(vp.height * 0.8));
      await tab.waitForTimeout(700);
      // mid-animation states are only warnings; the reduced-motion pass decides FAILs
      const r = await tab.evaluate(measure, { mobile: !!vp.mobile, dpr: vp.dpr, layout: false });
      [...r.fail, ...r.warn].forEach((m) => note(page, 'warn', m, size));
    }
  } else {
    // scroll once through the page so scroll-triggered reveals have played, and load every lazy image
    await tab.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) {
        scrollTo(0, y);
        await wait(90);
      }
      scrollTo(0, document.documentElement.scrollHeight);
      await wait(1600);
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
      await Promise.race([Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))), new Promise((r) => setTimeout(r, 8000))]);
    });
    await tab.waitForTimeout(300);
    const r = await tab.evaluate(measure, { mobile: !!vp.mobile, dpr: vp.dpr, layout: true });
    r.fail.forEach((m) => note(page, 'fail', m, size));
    r.warn.forEach((m) => note(page, 'warn', m, size));
    if (vp.name === '1440') {
      const s = await tab.evaluate(seo);
      s.fail.forEach((m) => note(page, 'fail', m, 'all'));
      s.warn.forEach((m) => note(page, 'warn', m, 'all'));
      s.links.forEach((l) => internal.add(l));
      // the social image has to exist in dist (Sanity CDN images are skipped)
      const og = s.og && new URL(s.og, origin);
      if (og && !/cdn.sanity.io/.test(og.host) && !resolve(og.pathname)) note(page, 'fail', `og:image file missing: ${og.pathname} (make a 1200×630 image)`, 'all');
    }
    if (shots) {
      const file = path.join(outDir, 'shots', vp.name, `${page === '/' ? 'home' : page.slice(1).replace(/\//g, '__')}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await tab.screenshot({ path: file });
    }
  }
  await ctx.close();
}

const jobs = [];
for (const page of targets) {
  for (const vp of VIEWPORTS) jobs.push(() => visit(vp, page));
  for (const name of MOTION) jobs.push(() => visit(VIEWPORTS.find((v) => v.name === name), page, { motion: true }));
}
let done = 0;
const total = jobs.length;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (jobs.length) {
      await jobs.shift()();
      done++;
      if (process.stdout.isTTY) process.stdout.write(`\r${done}/${total} checks`);
    }
  }),
);
if (process.stdout.isTTY) process.stdout.write('\n');

// internal links and the 404 page
for (const href of internal) {
  if (!resolve(href) && !/\.(xml|txt)$/.test(href)) note(href, 'fail', `broken internal link (linked from the site): ${href}`, 'all');
}
{
  const r = await fetch(`${origin}/qa-page-that-does-not-exist`);
  if (r.status !== 404 || !fs.existsSync(path.join(dist, '404.html'))) note('/404', 'fail', 'no 404 page for unknown URLs', 'all');
}
await browser.close();
server.close();

/* ---------- report ---------- */
let fails = 0;
let warns = 0;
const lines = [`# QA report`, ``, `${targets.length} pages × ${VIEWPORTS.length} sizes + motion pass at ${MOTION.join(', ')}. ${new Date().toISOString()}`, ``];
for (const page of Object.keys(results).sort()) {
  const { fail, warn } = results[page];
  if (!fail.size && !warn.size) continue;
  lines.push(`## ${page}`);
  for (const [m, s] of fail) lines.push(`- FAIL ${m}  [${[...new Set(s)].join(', ')}]`), fails++;
  for (const [m, s] of warn) lines.push(`- warn ${m}  [${[...new Set(s)].join(', ')}]`), warns++;
  lines.push('');
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'));
console.log(lines.slice(4).join('\n') || 'Nothing to report.');
console.log(`\n${fails ? `${fails} FAIL` : 'PASS'} · ${warns} warning(s) · ${targets.length} pages · qa/report.md${shots ? ' · qa/shots/' : ''}`);
process.exitCode = fails ? 1 : 0;
