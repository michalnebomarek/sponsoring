// Vygeneruje ikony aplikace do public/ (spustit: node scripts/make-icons.mjs).
// Profil kopce s tečkou v akcentové barvě na papírovém pozadí.
import { createRequire } from 'node:module';
// Playwright stačí nainstalovaný globálně (npm i -g playwright)
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH ?? '').split(':')] }));
import { writeFileSync } from 'node:fs';

const svg = (pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#F6F2EA"/>
  <g transform="translate(${256 - 256 * (1 - pad)} ${256 - 256 * (1 - pad)}) scale(${1 - pad})">
    <path d="M56 372 C110 360 132 318 176 300 C214 285 232 318 262 302 C306 278 318 184 370 160 C400 146 430 150 456 140 L456 404 L56 404 Z" fill="#EAE2D2"/>
    <path d="M56 372 C110 360 132 318 176 300 C214 285 232 318 262 302 C306 278 318 184 370 160 C400 146 430 150 456 140" fill="none" stroke="#1D1C1A" stroke-width="14" stroke-linecap="round"/>
    <path d="M56 372 C110 360 132 318 176 300 C214 285 232 318 262 302" fill="none" stroke="#E2A33B" stroke-width="20" stroke-linecap="round"/>
    <circle cx="262" cy="302" r="30" fill="#E2A33B" stroke="#F6F2EA" stroke-width="10"/>
  </g>
</svg>`;

writeFileSync('public/favicon.svg', svg(0.04));
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [
  ['apple-touch-icon.png', 180, 0.04],
  ['icon-192.png', 192, 0.04],
  ['icon-512.png', 512, 0.04],
  ['icon-maskable-512.png', 512, 0.2],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg(pad)}`);
  await page.screenshot({ path: `public/${name}`, omitBackground: false });
}
await browser.close();
console.log('ikony hotové');
