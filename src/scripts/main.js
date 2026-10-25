// Site-wide behaviour: overlays (menu, search, cart), wishlist and cart buttons, rails, reveals, countdown.
import { cart, wish, recent, loadProducts, lineHTML, rsd, priceOf, esc } from './store.js';
import { search, highlight } from './search.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- overlays ---------- */
const overlays = {};
let openName = null;
let lastTrigger = null;

function setupOverlay(name, { onOpen } = {}) {
  const el = $(`[data-${name}]`);
  if (!el) return;
  overlays[name] = { el, onOpen };
  $$(`[data-${name}-close]`).forEach((b) => b.addEventListener('click', () => close(name)));
  $$(`[data-${name}-open]`).forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      open(name, b);
    }),
  );
}

function open(name, trigger) {
  if (openName && openName !== name) close(openName, false);
  const o = overlays[name];
  if (!o || !o.el.hidden) return;
  lastTrigger = trigger || document.activeElement;
  o.el.hidden = false;
  openName = name;
  document.body.classList.add('is-locked');
  $$(`[aria-controls="${o.el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
  o.onOpen?.();
  const focusable = $('input, button, a', $('[role="dialog"]', o.el));
  if (name !== 'search') focusable?.focus({ preventScroll: true });
}

function close(name, restore = true) {
  const o = overlays[name];
  if (!o || o.el.hidden) return;
  o.el.hidden = true;
  openName = null;
  document.body.classList.remove('is-locked');
  $$(`[aria-controls="${o.el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
  if (restore) lastTrigger?.focus?.({ preventScroll: true });
}

document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    open('search');
    return;
  }
  if (!openName) return;
  if (e.key === 'Escape') close(openName);
  // keep keyboard focus inside the open overlay
  if (e.key === 'Tab') {
    const items = $$('a[href], button:not([disabled]), input, select', $('[role="dialog"]', overlays[openName].el)).filter((x) => x.offsetParent);
    if (!items.length) return;
    const [first, last] = [items[0], items.at(-1)];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* ---------- menu: desktop photo follows the hovered category ---------- */
setupOverlay('menu');
$$('[data-menu-cat]').forEach((li) => {
  const show = () => {
    $$('[data-menu-cat]').forEach((x) => x.classList.toggle('is-active', x === li));
    $$('[data-menu-photo]').forEach((f) => (f.hidden = f.dataset.menuPhoto !== li.dataset.menuCat));
  };
  li.addEventListener('mouseenter', show);
  li.addEventListener('focusin', show);
});

/* ---------- search overlay ---------- */
const input = $('[data-search-input]');
let activeHit = -1;

setupOverlay('search', {
  onOpen() {
    loadProducts();
    renderRecent();
    requestAnimationFrame(() => {
      input?.focus({ preventScroll: true });
      input?.select();
    });
  },
});

async function renderRecent() {
  const ids = recent.ids().slice(0, 4);
  const box = $('[data-search-recent]');
  if (!box || !ids.length) return;
  const { byId } = await loadProducts();
  const items = ids.map((id) => byId.get(id)).filter(Boolean);
  $('[data-search-recent-list]').innerHTML = items.map((p) => hitHTML(p, '')).join('');
  box.hidden = !items.length;
}

function hitHTML(p, q, i = -1) {
  return `<li><a class="hit" href="/proizvod/${p.s}" role="option" id="hit-${i}" aria-selected="false">
    <img src="${p.i}" alt="" width="64" height="64" loading="lazy" />
    <span><span class="hit__name">${q ? highlight(p.n, q, esc) : esc(p.n)}</span>
    <span class="hit__meta"><b>${rsd(priceOf(p))}</b>${p.sp ? '<span>akcija</span>' : ''}<span>${esc(p.ct)}</span></span></span>
  </a></li>`;
}

let searchTimer;
input?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 70);
});

async function runSearch() {
  const q = input.value.trim();
  const show = (k) => ['empty', 'results', 'none'].forEach((x) => ($(`[data-search-${x}]`).hidden = x !== k));
  activeHit = -1;
  if (q.length < 2) {
    show('empty');
    input.setAttribute('aria-expanded', 'false');
    return;
  }
  const { list } = await loadProducts();
  if (input.value.trim() !== q) return;
  const hits = search(list, q);
  if (!hits.length) {
    $('[data-search-none-q]').textContent = q;
    show('none');
    return;
  }
  show('results');
  input.setAttribute('aria-expanded', 'true');
  $('[data-search-count]').textContent = `${hits.length} ${hits.length % 10 === 1 && hits.length % 100 !== 11 ? 'proizvod' : 'proizvoda'}`;
  $('[data-search-list]').innerHTML = hits
    .slice(0, 8)
    .map((p, i) => hitHTML(p, q, i))
    .join('');
  const all = $('[data-search-all]');
  all.href = `/pretraga?q=${encodeURIComponent(q)}`;
  all.textContent = `Svi rezultati (${hits.length})`;

  // categories, types and brands among the hits
  const groups = { cats: new Map(), types: new Map(), brands: new Map() };
  for (const p of hits) {
    groups.cats.set(p.c, { label: p.ct, href: `/kategorija/${p.c}`, n: (groups.cats.get(p.c)?.n || 0) + 1 });
    if (p.t) groups.types.set(p.c + p.t, { label: p.t, href: `/kategorija/${p.c}?tip=${encodeURIComponent(p.t)}`, n: (groups.types.get(p.c + p.t)?.n || 0) + 1 });
    if (p.bs) groups.brands.set(p.bs, { label: p.b, href: `/prodavnica?brend=${p.bs}`, n: (groups.brands.get(p.bs)?.n || 0) + 1 });
  }
  const block = (title, map) =>
    map.size
      ? `<div class="group"><p class="eyebrow muted">${title}</p>${[...map.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, 4)
          .map((g) => `<a href="${g.href}">${esc(g.label)} <span>${g.n}</span></a>`)
          .join('')}</div>`
      : '';
  $('[data-search-groups]').innerHTML = block('Tipovi', groups.types) + block('Brendovi', groups.brands) + block('Kategorije', groups.cats);
}

input?.addEventListener('keydown', (e) => {
  const hits = $$('[data-search-list] .hit');
  if (!hits.length || !['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
  if (e.key === 'Enter') {
    if (activeHit >= 0) {
      e.preventDefault();
      hits[activeHit].click();
    }
    return;
  }
  e.preventDefault();
  activeHit = (activeHit + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
  hits.forEach((h, i) => h.setAttribute('aria-selected', String(i === activeHit)));
  input.setAttribute('aria-activedescendant', hits[activeHit].id);
  hits[activeHit].scrollIntoView({ block: 'nearest' });
});

$$('[data-search-term]').forEach((b) =>
  b.addEventListener('click', () => {
    input.value = b.dataset.searchTerm;
    runSearch();
    input.focus();
  }),
);

/* ---------- cart drawer ---------- */
setupOverlay('cart', { onOpen: renderCart });

async function renderCart() {
  const lines = cart.lines();
  const { byId } = await loadProducts();
  const rows = lines.map((l) => ({ ...l, p: byId.get(l.id) })).filter((l) => l.p);
  const ul = $('[data-cart-lines]');
  if (!ul) return;
  ul.innerHTML = rows.map((l) => lineHTML(l.p, l.qty)).join('');
  $('[data-cart-empty]').hidden = rows.length > 0;
  $('[data-cart-foot]').hidden = rows.length === 0;
  $('[data-cart-total]').textContent = rsd(rows.reduce((n, l) => n + priceOf(l.p) * l.qty, 0));
  const count = rows.reduce((n, l) => n + l.qty, 0);
  $('[data-cart-count-label]').textContent = count ? `(${count})` : '';
}

// quantity and remove buttons in any cart list (drawer and /korpa)
document.addEventListener('click', (e) => {
  const line = e.target.closest('[data-line]');
  if (!line) return;
  const id = line.dataset.line;
  const step = e.target.closest('[data-qty]');
  if (step) {
    const l = cart.lines().find((x) => x.id === id);
    cart.set(id, (l?.qty || 0) + Number(step.dataset.qty));
  }
  if (e.target.closest('[data-remove]')) cart.remove(id);
});

/* ---------- add to cart (cards and product page) ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  e.preventDefault();
  const qtyInput = btn.dataset.qtyFrom ? $(btn.dataset.qtyFrom) : null;
  const qty = Math.max(1, Number(qtyInput?.value) || 1);
  cart.add(btn.dataset.add, qty);
  flyBall(btn);
  toast(`Dodato u korpu${qty > 1 ? ` (${qty} kom.)` : ''}`, 'Pogledaj korpu', () => open('cart', btn));
});

// the signature: a volt ball flies from the button into the cart counter
function flyBall(from) {
  const target = $('[data-cart-count]');
  if (!target || reduced) return bump();
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const ball = document.createElement('span');
  ball.style.cssText = `position:fixed;z-index:130;left:${a.left + a.width / 2 - 9}px;top:${a.top + a.height / 2 - 9}px;width:18px;height:18px;border-radius:50%;background:var(--volt);box-shadow:0 0 0 2px var(--ink);pointer-events:none`;
  document.body.append(ball);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ball.animate(
    [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * 0.5}px, ${Math.min(dy, 0) - 80}px) scale(1.15)`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.5)` },
    ],
    { duration: 700, easing: 'cubic-bezier(.5,0,.3,1)' },
  );
  const done = () => {
    ball.remove();
    bump();
  };
  anim.onfinish = done;
  setTimeout(() => ball.isConnected && done(), 900);
}
function bump() {
  const c = $('[data-cart-count]');
  c?.classList.remove('is-bump');
  void c?.offsetWidth;
  c?.classList.add('is-bump');
}

let toastTimer;
function toast(text, action, onAction) {
  const t = $('[data-toast]');
  if (!t) return;
  t.innerHTML = `<span>${esc(text)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  t.hidden = false;
  $('button', t)?.addEventListener('click', () => {
    t.hidden = true;
    onAction?.();
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3800);
}

/* ---------- wishlist hearts ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-wish]');
  if (!btn) return;
  e.preventDefault();
  const on = wish.toggle(btn.dataset.wish);
  btn.classList.remove('is-pop');
  void btn.offsetWidth;
  btn.classList.add('is-pop');
  toast(on ? 'Sačuvano' : 'Uklonjeno iz sačuvanih', on ? 'Sačuvano' : '', () => (location.href = '/sacuvano'));
});

function syncCounts() {
  const n = cart.count();
  $$('[data-cart-count]').forEach((el) => (el.textContent = n));
  const w = wish.ids();
  $$('[data-wish-count]').forEach((el) => {
    el.textContent = w.length;
    el.hidden = !w.length;
  });
  $$('[data-wish]').forEach((b) => b.setAttribute('aria-pressed', String(w.includes(b.dataset.wish))));
}
document.addEventListener('store:change', () => {
  syncCounts();
  if (openName === 'cart') renderCart();
});
// another tab changed the cart
window.addEventListener('storage', () => document.dispatchEvent(new CustomEvent('store:change')));
syncCounts();

/* ---------- rails ---------- */
$$('[data-rail]').forEach((rail) => {
  const track = $('[data-rail-track]', rail);
  const prev = $('[data-rail-prev]', rail);
  const next = $('[data-rail-next]', rail);
  const step = () => track.clientWidth * 0.8;
  const update = () => {
    if (!prev) return;
    prev.disabled = track.scrollLeft < 8;
    next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
  };
  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  update();
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    }),
  { rootMargin: '0px 0px -8% 0px' },
);
$$('[data-reveal]').forEach((el) => io.observe(el));
// never leave content hidden if the observer is slow (background tabs, screenshots)
setTimeout(() => $$('[data-reveal]:not(.is-in)').forEach((el) => el.getBoundingClientRect().top < innerHeight && el.classList.add('is-in')), 1200);

/* ---------- sale countdown ---------- */
$$('[data-countdown]').forEach((el) => {
  const end = new Date(el.dataset.countdown).getTime();
  const parts = $$('[data-unit]', el);
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    const v = { d: Math.floor(left / 864e5), h: Math.floor(left / 36e5) % 24, m: Math.floor(left / 6e4) % 60, s: Math.floor(left / 1e3) % 60 };
    parts.forEach((p) => (p.textContent = String(v[p.dataset.unit]).padStart(2, '0')));
    if (!left) el.closest('[data-countdown-wrap]')?.setAttribute('hidden', '');
  };
  tick();
  setInterval(tick, 1000);
});

/* ---------- hero video: only where it can play, never on data saver ---------- */
const video = $('[data-hero-video]');
if (video) {
  const saver = navigator.connection?.saveData;
  if (reduced || saver) video.remove();
  else {
    const src = window.innerWidth < 760 ? video.dataset.srcSm : video.dataset.src;
    video.src = src;
    video.play?.().catch(() => {});
  }
}

export { open, close, toast };

/* ---------- header height for sticky bars below it ---------- */
const header = $('[data-header]');
if (header) {
  const setH = () => document.documentElement.style.setProperty('--hdr', `${header.offsetHeight}px`);
  new ResizeObserver(setH).observe(header);
  setH();
}
