// Cart, wishlist and recently viewed, kept in localStorage. Product data (names, prices, photos) always comes
// from /products.json, so a price changed in Sanity shows up in carts on the next build.
const KEYS = { cart: 'sportana:cart', wish: 'sportana:wish', recent: 'sportana:recent' };

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the page still works, the cart just isn't remembered */
  }
};

let productsPromise = null;
export function loadProducts() {
  productsPromise ||= fetch('/products.json')
    .then((r) => r.json())
    .then((list) => ({ list, byId: new Map(list.map((p) => [p.id, p])) }))
    .catch(() => ({ list: [], byId: new Map() }));
  return productsPromise;
}

export const rsd = (n) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} RSD`;
export const priceOf = (p) => (p.sp && p.sp < p.p ? p.sp : p.p);
export const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const emit = () => document.dispatchEvent(new CustomEvent('store:change'));

/* ---------- cart: [{ id, qty }] ---------- */
export const cart = {
  lines: () => read(KEYS.cart, []).filter((l) => l && l.id && l.qty > 0),
  count: () => cart.lines().reduce((n, l) => n + l.qty, 0),
  add(id, qty = 1) {
    const lines = cart.lines();
    const line = lines.find((l) => l.id === id);
    if (line) line.qty = Math.min(99, line.qty + qty);
    else lines.push({ id, qty });
    write(KEYS.cart, lines);
    emit();
  },
  set(id, qty) {
    const lines = cart.lines().map((l) => (l.id === id ? { ...l, qty: Math.max(0, Math.min(99, qty)) } : l)).filter((l) => l.qty > 0);
    write(KEYS.cart, lines);
    emit();
  },
  remove(id) {
    write(KEYS.cart, cart.lines().filter((l) => l.id !== id));
    emit();
  },
  clear() {
    write(KEYS.cart, []);
    emit();
  },
};

/* ---------- wishlist: [id] ---------- */
export const wish = {
  ids: () => read(KEYS.wish, []),
  has: (id) => wish.ids().includes(id),
  toggle(id) {
    const ids = wish.ids();
    const on = !ids.includes(id);
    write(KEYS.wish, on ? [id, ...ids] : ids.filter((x) => x !== id));
    emit();
    return on;
  },
};

/* ---------- recently viewed: [id], newest first ---------- */
export const recent = {
  ids: () => read(KEYS.recent, []),
  push(id) {
    write(KEYS.recent, [id, ...recent.ids().filter((x) => x !== id)].slice(0, 12));
  },
};

/* ---------- shared row markup (cart drawer, cart page, wishlist, search) ---------- */
export function lineHTML(p, qty) {
  const now = priceOf(p);
  return `
  <li class="line" data-line="${p.id}">
    <a href="/proizvod/${p.s}" class="line__img"><img src="${p.i}" alt="" width="88" height="88" loading="lazy" /></a>
    <div class="line__info">
      <a href="/proizvod/${p.s}" class="line__name">${esc(p.n)}</a>
      <p class="line__meta">${esc(p.b || p.t)}</p>
      <div class="line__row">
        <div class="qty" role="group" aria-label="Količina">
          <button type="button" data-qty="-1" aria-label="Manje">−</button>
          <span aria-live="polite">${qty}</span>
          <button type="button" data-qty="1" aria-label="Više">+</button>
        </div>
        <button type="button" class="line__remove" data-remove>Ukloni</button>
      </div>
    </div>
    <p class="price line__price"><span>${rsd(now * qty)}</span>${p.sp ? `<s>${rsd(p.p * qty)}</s>` : ''}</p>
  </li>`;
}
