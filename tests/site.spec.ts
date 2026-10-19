import { readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const projects = readdirSync('src/content/projects')
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

const pages = ['/', '/work', ...projects.map((p) => `/work/${p}`)];

for (const theme of ['light', 'dark'] as const) {
  for (const path of pages) {
    test(`${path} has no axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(path);
      // The C/M/Y plates are aria-hidden overprint layers under the key plate, which carries the visible contrast.
      const results = await new AxeBuilder({ page })
        .exclude('.plate:not(.plate-k)')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }
}

test('home shows the name, the work list and a working email action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Amit Asher' })).toBeVisible();
  await expect(page.locator('#work li')).toHaveCount(projects.length);
  const email = page.getByRole('link', { name: /^Email me/ }).first();
  await expect(email).toHaveAttribute('href', /^https:\/\/mail\.google\.com\/mail\/\?.*to=asherproc%40gmail\.com/);
  await expect(email).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('button', { name: 'Copy email' }).first()).toBeVisible();
  await expect(page.locator('#recruiters')).toBeVisible();
});

test('every project row opens its case study', async ({ page }) => {
  for (const slug of projects) {
    await page.goto('/');
    await page.locator(`a[href="/work/${slug}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('the theme button switches light and dark and remembers it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('the product reel can be paused', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-reel-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-reel]')).toHaveClass(/is-paused/);
});

test('unknown pages get the 404 sheet', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
});

test('client JavaScript stays inside the 50 KB budget', async ({ page }) => {
  // Static pages ship no bundles; the only bundle allowed is the twin chat, when it is enabled.
  const bytes: number[] = [];
  page.on('response', async (r) => {
    if (r.request().resourceType() === 'script') bytes.push((await r.body()).length);
  });
  for (const path of pages) await page.goto(path, { waitUntil: 'networkidle' });
  expect(bytes.reduce((a, b) => a + b, 0)).toBeLessThan(50 * 1024);
});

test('each page has an OG image that resolves', async ({ page, request }) => {
  for (const path of pages) {
    await page.goto(path);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    if (!og) throw new Error(`${path} has no og:image`);
    const res = await request.get(new URL(og).pathname);
    expect(res.status(), `${path} -> ${og}`).toBe(200);
  }
});
