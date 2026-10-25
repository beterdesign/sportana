// Filters, sort and "show more" for product grids. State lives in the URL so filtered pages can be shared
// and the back button works: ?kategorija=a,b&tip=…&brend=…&min=…&max=…&akcija=1&novo=1&sort=…&q=…
import { loadProducts } from './store.js';
import { search, fold } from './search.js';

const PAGE = 36;
const root = document.querySelector('[data-listing]');

if (root) {
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const grid = $('[data-grid]');
  const cards = $$('[data-card]');
  const panel = $('[data-filters]');
  const isQuery = root.dataset.query === '1';
  const defaultSort = root.dataset.sortDefault || 'popular';
  let shown = PAGE;
  let queryIds = null; // ids matching ?q=, ranked

  const params = () => new URLSearchParams(location.search);
  const listParam = (p, k) => (p.get(k) ? p.get(k).split(',').filter(Boolean) : []);

  // URL → controls
  function readState() {
    const p = params();
    $$('[data-filter]').forEach((i) => (i.checked = listParam(p, i.dataset.filter).includes(i.value)));
    $$('[data-flag]').forEach((i) => (i.checked = p.get(i.dataset.flag) === '1'));
    $('[data-min]').value = p.get('min') || '';
    $('[data-max]').value = p.get('max') || '';
    $('[data-sort]').value = p.get('sort') || defaultSort;
    if ($('[data-q]')) $('[data-q]').value = p.get('q') || '';
  }

  // controls → URL
  function writeState() {
    const p = new URLSearchParams();
    if ($('[data-q]')?.value.trim()) p.set('q', $('[data-q]').value.trim());
    for (const key of ['kategorija', 'tip', 'brend']) {
      const v = $$(`[data-filter="${key}"]:checked`).map((i) => i.value);
      if (v.length) p.set(key, v.join(','));
    }
    $$('[data-flag]:checked').forEach((i) => p.set(i.dataset.flag, '1'));
    if ($('[data-min]').value) p.set('min', $('[data-min]').value);
    if ($('[data-max]').value) p.set('max', $('[data-max]').value);
    if ($('[data-sort]').value !== defaultSort) p.set('sort', $('[data-sort]').value);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  async function apply({ resetPage = true } = {}) {
    const p = params();
    if (resetPage) shown = PAGE;
    const cats = listParam(p, 'kategorija');
    const types = listParam(p, 'tip');
    const brands = listParam(p, 'brend');
    const min = Number(p.get('min')) || 0;
    const max = Number(p.get('max')) || Infinity;
    const onSale = p.get('akcija') === '1';
    const onlyNew = p.get('novo') === '1';
    const sort = p.get('sort') || defaultSort;
    const q = (p.get('q') || '').trim();

    if (isQuery) {
      if (q) {
        const { list } = await loadProducts();
        queryIds = new Map(search(list, q).map((x, i) => [x.id, i]));
      } else queryIds = null;
    }

    const match = (c) =>
      (!cats.length || cats.includes(c.dataset.cat)) &&
      (!types.length || types.includes(c.dataset.type)) &&
      (!brands.length || brands.includes(c.dataset.brand)) &&
      +c.dataset.price >= min &&
      +c.dataset.price <= max &&
      (!onSale || c.dataset.sale === '1') &&
      (!onlyNew || c.dataset.new === '1') &&
      (!queryIds || queryIds.has(c.dataset.id));

    const list = cards.filter(match);
    const by = {
      popular: (a, b) => (queryIds ? queryIds.get(a.dataset.id) - queryIds.get(b.dataset.id) : a.dataset.order - b.dataset.order),
      'price-asc': (a, b) => a.dataset.price - b.dataset.price,
      'price-desc': (a, b) => b.dataset.price - a.dataset.price,
      off: (a, b) => b.dataset.off - a.dataset.off || a.dataset.order - b.dataset.order,
      new: (a, b) => b.dataset.new - a.dataset.new || b.dataset.id - a.dataset.id,
      name: (a, b) => a.dataset.text.localeCompare(b.dataset.text, 'sr'),
    };
    list.sort(by[sort] || by.popular);

    cards.forEach((c) => (c.hidden = true));
    list.forEach((c, i) => {
      grid.append(c);
      c.hidden = i >= shown;
    });

    const n = list.length;
    $('[data-count]').textContent = n;
    $('[data-count-word]').textContent = n % 10 === 1 && n % 100 !== 11 ? 'proizvod' : 'proizvoda';
    $('[data-count-btn]').textContent = n;
    $('[data-empty]').hidden = n > 0;
    $('[data-more]').hidden = n <= shown;
    $('[data-shown]').textContent = n > shown ? `Prikazano ${shown} od ${n}` : '';
    $$('[data-range]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === `${p.get('min') || 0}-${p.get('max') || 0}`)));
    renderChips(p);
  }

  function renderChips(p) {
    const chips = [];
    const label = (key, v) => $(`[data-filter="${key}"][value="${CSS.escape(v)}"]`)?.closest('label')?.querySelector('span')?.textContent || v;
    if (p.get('q')) chips.push(['q', null, `„${p.get('q')}”`]);
    for (const key of ['kategorija', 'tip', 'brend']) listParam(p, key).forEach((v) => chips.push([key, v, label(key, v)]));
    if (p.get('akcija')) chips.push(['akcija', null, 'Na akciji']);
    if (p.get('novo')) chips.push(['novo', null, 'Novo']);
    if (p.get('min') || p.get('max')) chips.push(['price', null, `${p.get('min') || 0} – ${p.get('max') || '∞'} RSD`]);
    const box = $('[data-chips]');
    box.innerHTML =
      chips.map(([k, v, l], i) => `<button type="button" data-chip="${i}" aria-label="Ukloni filter ${l}">${l} <span aria-hidden="true">×</span></button>`).join('') +
      (chips.length > 1 ? '<button type="button" class="chip-clear" data-clear>Obriši sve</button>' : '');
    $$('[data-chip]').forEach((b) =>
      b.addEventListener('click', () => {
        const [k, v] = chips[+b.dataset.chip];
        if (k === 'q' && $('[data-q]')) $('[data-q]').value = '';
        else if (k === 'price') {
          $('[data-min]').value = '';
          $('[data-max]').value = '';
        } else if (v) $(`[data-filter="${k}"][value="${CSS.escape(v)}"]`).checked = false;
        else $(`[data-flag="${k}"]`).checked = false;
        changed();
      }),
    );
    const active = chips.length;
    $('[data-filter-n]').textContent = active ? `(${active})` : '';
  }

  const changed = () => {
    writeState();
    apply();
  };

  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-filter], [data-flag], [data-sort], [data-min], [data-max]')) changed();
  });
  let qTimer;
  $('[data-q]')?.addEventListener('input', () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(changed, 200);
  });
  $$('[data-range]').forEach((b) =>
    b.addEventListener('click', () => {
      const [a, z] = b.dataset.range.split('-');
      const on = b.getAttribute('aria-pressed') === 'true';
      $('[data-min]').value = on || a === '0' ? '' : a;
      $('[data-max]').value = on || z === '0' ? '' : z;
      changed();
    }),
  );
  root.addEventListener('click', (e) => {
    if (!e.target.closest('[data-clear]')) return;
    $$('[data-filter], [data-flag]').forEach((i) => (i.checked = false));
    $('[data-min]').value = '';
    $('[data-max]').value = '';
    if ($('[data-q]')) $('[data-q]').value = '';
    changed();
  });
  $('[data-more]').addEventListener('click', () => {
    const first = cards.find((c) => c.hidden && cards.indexOf(c) >= 0);
    shown += PAGE;
    apply({ resetPage: false });
    first?.querySelector('a[href]:not([tabindex])')?.focus({ preventScroll: true });
  });

  // phone: filters open as a full-screen sheet
  const openBtn = $('[data-filters-open]');
  openBtn?.addEventListener('click', () => {
    panel.classList.add('is-open');
    document.body.classList.add('is-locked');
    openBtn.setAttribute('aria-expanded', 'true');
  });
  $$('[data-filters-close]').forEach((b) =>
    b.addEventListener('click', () => {
      panel.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      openBtn?.setAttribute('aria-expanded', 'false');
    }),
  );

  readState();
  apply();
  window.addEventListener('popstate', () => {
    readState();
    apply();
  });
}

export { fold };
