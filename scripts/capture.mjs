// Full-page captures for design review: node scripts/capture.mjs [baseUrl] [outDir]

import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const out = process.argv[3] ?? '.impeccable/review';
const pages = [
  ['home', '/'],
  ['bubble-up', '/work/bubble-up'],
  ['agentgate', '/work/agentgate'],
  ['404', '/nope'],
];
const widths = { desktop: 1440, tablet: 768, mobile: 390 };
const themes = ['light', 'dark'];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const theme of themes) {
  for (const [wName, width] of Object.entries(widths)) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
    const page = await ctx.newPage();
    for (const [name, path] of pages) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const suffix = theme === 'light' ? '' : '-dark';
      await page.screenshot({ path: `${out}/${name}-${wName}${suffix}.png`, fullPage: true });
    }
    await ctx.close();
  }
}
await browser.close();
console.log('captured to', out);
