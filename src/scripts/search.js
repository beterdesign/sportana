// Product search shared by the overlay and the results page.
// Works without diacritics and with Serbian word endings: "trbusnjaci" finds "trbušnjake", "lopta" finds "lopte".
// One typo per longer word is forgiven ("bokserske ruakvice").
export const fold = (s = '') =>
  s
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
const words = (s) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

// a few everyday words people type that the product names say differently
const SYNONYMS = {
  bicikla: ['bicikl'],
  biciklo: ['bicikl'],
  vreca: ['dzak'],
  dzak: ['vreca'],
  bucice: ['tegovi'],
  utezi: ['tegovi'],
  teretana: ['sprava'],
  trenazer: ['krostrenazer', 'sprava'],
  joga: ['strunjaca', 'joga'],
  yoga: ['joga', 'strunjaca'],
  pingpong: ['stoni', 'tenis'],
  autic: ['auto'],
  deca: ['decji', 'decja', 'decje'],
  decu: ['decji', 'decja', 'decje'],
};

function near(a, b) {
  // edit distance <= 1 (one insert, delete, swap or change)
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a[i + 1] === b[j] && a[i] === b[j + 1]) {
      i += 2;
      j += 2;
    } else if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenScore(t, list, weight) {
  let best = 0;
  const stem = t.length > 4 ? t.slice(0, Math.max(4, t.length - 2)) : t;
  for (const w of list) {
    if (w === t) best = Math.max(best, 10);
    else if (w.startsWith(t)) best = Math.max(best, 8);
    else if (t.length > 3 && w.startsWith(stem)) best = Math.max(best, 6);
    else if (t.length >= 5 && w.length >= 4 && (near(t, w) || near(t, w.slice(0, t.length)) || near(t, w.slice(0, t.length + 1)))) best = Math.max(best, 3);
    else if (/\d/.test(t) && w.includes(t)) best = Math.max(best, 5);
  }
  return best * weight;
}

const prepared = new WeakMap();
function prep(p) {
  if (!prepared.has(p)) prepared.set(p, { n: words(p.n), b: words(p.b), t: words(p.t), c: words(p.ct) });
  return prepared.get(p);
}

export function search(list, query, limit = Infinity) {
  const tokens = words(query).filter((t) => t.length > 1 || /\d/.test(t));
  if (!tokens.length) return [];
  const out = [];
  for (const p of list) {
    const h = prep(p);
    let total = 0;
    let ok = true;
    for (const t of tokens) {
      const alts = [t, ...(SYNONYMS[t] || [])];
      let s = 0;
      for (const a of alts) s = Math.max(s, tokenScore(a, h.n, 1.2), tokenScore(a, h.b, 1), tokenScore(a, h.t, 0.8), tokenScore(a, h.c, 0.5));
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) out.push({ p, score: total + (p.st ? 0.5 : 0) });
  }
  out.sort((a, b) => b.score - a.score || a.p.n.localeCompare(b.p.n, 'sr'));
  return out.slice(0, limit).map((x) => x.p);
}

// wraps the matched beginnings of words in <mark>
export function highlight(text, query, esc) {
  const tokens = words(query).filter((t) => t.length > 1);
  if (!tokens.length) return esc(text);
  return text
    .split(/(\s+)/)
    .map((part) => {
      const f = fold(part);
      const t = tokens.find((t) => f.startsWith(t) || (t.length > 4 && f.startsWith(t.slice(0, t.length - 2))));
      if (!t) return esc(part);
      const n = Math.min(part.length, f.startsWith(t) ? t.length : t.length - 2);
      return `<mark>${esc(part.slice(0, n))}</mark>${esc(part.slice(n))}`;
    })
    .join('');
}
