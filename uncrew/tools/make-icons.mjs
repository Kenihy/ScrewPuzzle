/*
 * 언스크류(UNCREW) — 홈 화면 아이콘 생성 (선택 사항, Playwright 1.63.0 필요)
 * 타이틀 엠블럼(src/ui/art.js)을 그대로 PNG로 저장합니다.
 *   node tools/make-icons.mjs
 */
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { titleEmblem } from '../src/ui/art.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const html = (size, pad) => `<!doctype html><html><body style="margin:0;background:#121114">
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:radial-gradient(70% 70% at 50% 40%, #3a1620, #121114 72%)">
  <div style="width:${size - pad * 2}px;height:${size - pad * 2}px">${titleEmblem().replace('<svg ', '<svg width="100%" height="100%" ')}</div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, size, pad] of [
  ['icon-192.png', 192, 10],
  ['icon-512.png', 512, 26],
  ['icon-maskable-512.png', 512, 96],
  ['apple-touch-icon.png', 180, 12],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, pad));
  await page.screenshot({ path: join(ROOT, 'icons', name), clip: { x: 0, y: 0, width: size, height: size } });
  console.log('icons/' + name);
}
await browser.close();
