// Pre-launch check: lists every TODO, unfilled __TOKEN__ and stray studio reference left in the site.
//   npm run check
import fs from 'node:fs';
import path from 'node:path';

const roots = ['src', 'public', 'studio/schemaTypes', 'astro.config.mjs', 'wrangler.jsonc', 'studio/sanity.config.ts', 'studio/sanity.cli.ts'];
const patterns = [
  [/TODO/, 'TODO'],
  [/__[A-Z_]+__/, 'unfilled token'],
  [/beterdesign|N5 Marketing/i, 'studio name in client site'],
  [/lorem ipsum/i, 'placeholder text'],
];
const hits = [];

function scan(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).forEach((f) => scan(path.join(p, f)));
  if (!/\.(astro|js|mjs|ts|css|json|jsonc|txt|svg|md)$/.test(p)) return;
  fs.readFileSync(p, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [re, label] of patterns) if (re.test(line)) hits.push(`${p}:${i + 1}  [${label}]  ${line.trim().slice(0, 110)}`);
    });
}
roots.forEach(scan);

if (hits.length) {
  console.log(hits.join('\n'));
  console.log(`\n${hits.length} item(s) left before launch.`);
  process.exitCode = 1;
} else {
  console.log('Clean: no TODOs, tokens or placeholder text left.');
}
