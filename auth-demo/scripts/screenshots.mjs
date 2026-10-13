#!/usr/bin/env node
/**
 * Capture every SDK component from /gallery, light and dark, at 2x.
 *
 *   npm run build && npm start            # serve the demo on :3003
 *   node scripts/screenshots.mjs ../../hypery-sdk/docs/images [baseUrl]
 *
 * Each `[data-shot]` frame is cropped to the union of its rendered boxes plus
 * room for its shadow, on a transparent background. Dialogs are cropped to the
 * dialog itself (the gallery hides the scrim in single-shot mode).
 * Uses the installed Google Chrome (`channel: 'chrome'`), so no browser download.
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2];
const base = process.argv[3] ?? 'http://localhost:3003';
if (!outDir) {
  console.error('usage: node scripts/screenshots.mjs <out-dir> [baseUrl]');
  process.exit(1);
}
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const index = await browser.newPage();
await index.goto(`${base}/gallery`);
await index.waitForSelector('main[data-ready]');
const names = await index.$$eval('[data-shot]', (els) => els.map((e) => e.getAttribute('data-shot')));
// Dialogs only render in single-shot mode; the index lists them as links.
const modalNames = await index.$$eval('a[href^="?shot="]', (els) => els.map((e) => e.getAttribute('href').slice(6)));
await index.close();

const written = [];
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ deviceScaleFactor: 2, colorScheme: theme, viewport: { width: 1200, height: 1000 } });
  const page = await ctx.newPage();
  for (const name of [...names, ...modalNames]) {
    await page.goto(`${base}/gallery?shot=${name}&theme=${theme}`);
    await page.waitForSelector('main[data-ready]');
    const frame = page.locator(`[data-shot="${name}"]`);
    if (await frame.getAttribute('data-shot-click')) {
      await frame.locator('button').first().click();
    }
    await page.waitForTimeout(700); // entrance animations, fetched sample data
    // No focus rings in docs images (dialogs autofocus their first button).
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog instanceof HTMLElement) dialog.focus({ preventScroll: true }); // dialogs keep focus inside
      else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300); // let the focus-ring transition finish
    const modal = await frame.getAttribute('data-shot-modal');
    const box = await page.evaluate(
      ({ name, modal }) => {
        const root = modal ? document.querySelector('[role="dialog"]') : document.querySelector(`[data-shot="${name}"]`);
        const els = [root, ...root.querySelectorAll('*')];
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const s = getComputedStyle(el);
          if (s.position === 'fixed' && el !== root && !modal) continue; // click-away layers
          x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
          x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
        }
        return { x0, y0, x1, y1 };
      },
      { name, modal: !!modal },
    );
    const pad = modal ? 104 : 44; // room for the whole shadow (shadow-xl reaches ~80px below a dialog)
    const clip = {
      x: Math.max(0, Math.floor(box.x0 - pad)),
      y: Math.max(0, Math.floor(box.y0 - pad)),
      width: Math.ceil(box.x1 - box.x0 + pad * 2),
      height: Math.ceil(box.y1 - box.y0 + pad * 2),
    };
    const file = resolve(outDir, `${name}-${theme}.png`);
    await page.screenshot({ path: file, clip, omitBackground: true });
    written.push(file);
  }
  await ctx.close();
}
await browser.close();
console.log(written.join('\n'));
