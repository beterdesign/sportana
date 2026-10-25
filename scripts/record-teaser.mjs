// Records a scripted scroll-through of the homepage and encodes it as an MP4 for LinkedIn.
//
//   npm install --no-save playwright-core ffmpeg-static   (once; kept out of package.json so deploys stay light)
//   npm run dev                                            (in another terminal)
//   node scripts/record-teaser.mjs [desktop|mobile] [url]
//
// desktop → 1920x1080 (16:9), mobile → 1080x1350 (4:5, LinkedIn's tallest feed format).
// Uses the Edge that ships with Windows, so no browser download is needed.
import { chromium } from 'playwright-core';
import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const format = process.argv[2] === 'mobile' ? 'mobile' : 'desktop';
const url = process.argv[3] || 'http://localhost:4321/';

const presets = {
  // CSS viewport × device scale = output pixels
  desktop: { viewport: { width: 1440, height: 810 }, scale: 4 / 3, out: [1920, 1080] },
  mobile: { viewport: { width: 432, height: 540 }, scale: 2.5, out: [1080, 1350] },
};
const { viewport, scale, out } = presets[format];

const outDir = path.resolve('teaser');
const framesDir = path.join(outDir, `frames-${format}`);
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--hide-scrollbars'] });
const context = await browser.newContext({ viewport, deviceScaleFactor: scale, reducedMotion: 'no-preference' });
const page = await context.newPage();

// Capture every painted frame through the DevTools screencast, keeping its timestamp.
const cdp = await context.newCDPSession(page);
const frames = [];
const writes = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = path.join(framesDir, `${String(frames.length).padStart(5, '0')}.jpg`);
  frames.push({ file, ts: metadata.timestamp });
  writes.push(fs.promises.writeFile(file, Buffer.from(data, 'base64')));
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

// Wheel events at a steady pace; Lenis turns them into smooth scrolling (and spins the logo faster).
async function scrollBy(px, ms) {
  const start = Date.now();
  let done = 0;
  while (done < px) {
    const target = Math.min(px, (px * (Date.now() - start)) / ms);
    const step = target - done;
    if (step > 0) {
      await page.mouse.wheel(0, step);
      done = target;
    }
    await sleep(16);
  }
}

async function scrollTo(selector, ms, offset = 0) {
  const delta = await page.evaluate(
    ([sel, off]) => document.querySelector(sel).getBoundingClientRect().top + off,
    [selector, offset],
  );
  if (delta > 0) await scrollBy(delta, ms);
}

await page.goto(url, { waitUntil: 'domcontentloaded' });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: out[0], maxHeight: out[1] });

// 1. preloader → hero intro
await sleep(4600);

// 2. play with the spinning logo, then hover the featured projects
const { width: w, height: h } = viewport;
await page.mouse.move(w * 0.5, h * 0.5);
await page.mouse.move(w * 0.25, h * 0.3, { steps: 50 });
await page.mouse.move(w * 0.7, h * 0.75, { steps: 60 });
if (format === 'desktop') {
  for (const item of await page.$$('.hero__item')) {
    const box = await item.boundingBox();
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2, { steps: 25 });
    await sleep(700);
  }
}
await page.mouse.move(w * 0.5, h * 0.92, { steps: 20 });
await sleep(400);

// 3. studio statement lighting up
await scrollTo('#studio', 2200, h * 0.25);
await scrollBy(h * 1.3, 3800);
await sleep(300);

// 4. horizontal project rail (pinned on desktop)
await scrollTo('#work', 1600);
await sleep(500);
const rail = await page.evaluate(() => {
  const st = window.innerWidth > 900 ? document.querySelector('.pin-spacer') : null;
  return st ? st.offsetHeight - window.innerHeight : document.querySelector('#work').offsetHeight;
});
await scrollBy(rail, format === 'desktop' ? 5500 : 6000);
await sleep(400);

// 5. method: title, then the stacked panels
await scrollTo('#method', 1800);
await sleep(600);
await scrollTo('[data-panel]:last-of-type', 5000);
await sleep(700);

// 6. services, then all the way to the footer wordmark
await scrollTo('#services', 1800);
await scrollBy(h * 0.9, 2600);
// keep wheeling until the page really bottoms out on the footer wordmark
const remaining = () => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
for (let i = 0; i < 12 && (await remaining()) > 4; i++) {
  await scrollBy(Math.min(await remaining(), 900) + 60, 1100);
}
await sleep(2800);

// the screencast only emits frames when something repaints, so a still ending has to be stretched by hand
const endTs = Date.now() / 1000;
await cdp.send('Page.stopScreencast');
await Promise.all(writes);
await browser.close();

// Turn the variable-rate frames into a constant 30 fps H.264 file (fade in/out at the edges).
const list = frames
  .map((f, i) => {
    const next = frames[i + 1]?.ts ?? Math.max(endTs, f.ts + 1 / 30);
    return `file '${f.file.replace(/\\/g, '/')}'\nduration ${(next - f.ts).toFixed(4)}`;
  })
  .join('\n');
const listFile = path.join(framesDir, 'list.txt');
fs.writeFileSync(listFile, `${list}\nfile '${frames.at(-1).file.replace(/\\/g, '/')}'\n`);

const total = Math.max(endTs, frames.at(-1).ts) - frames[0].ts;
const mp4 = path.join(outDir, `teaser-${format}.mp4`);
const res = spawnSync(
  ffmpegPath,
  [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', `fps=30,scale=${out[0]}:${out[1]}:flags=lanczos,fade=t=in:st=0:d=0.4,fade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    mp4,
  ],
  { stdio: 'inherit' },
);
if (res.status !== 0) process.exit(res.status ?? 1);
fs.rmSync(framesDir, { recursive: true, force: true });
console.log(`${frames.length} frames, ${total.toFixed(1)}s (still ending ${(endTs - frames.at(-1).ts).toFixed(1)}s) → ${mp4}`);
