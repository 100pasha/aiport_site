import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  const origin = 'http://127.0.0.1:4322',
    base = '/aiport_site';
  await page.goto(origin + base + '/');
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  assert((await page.locator('h1').innerText()).includes('Спросите свой ИИ'));
  assert.equal(
    await page.locator('link[rel=canonical]').getAttribute('href'),
    'https://100pasha.github.io/aiport_site/',
  );
  await page.locator('.desktop-nav a').filter({ hasText: 'Сервисы' }).click();
  assert.equal(new URL(page.url()).pathname, base + '/katalog/');
  await page.locator('[data-cat=crm]').click();
  assert.equal(await page.locator('[data-service-card]:visible').count(), 3);
  await page.goto(origin + base + '/katalog/ozon/');
  await page.locator('.prose img').waitFor();
  assert((await page.locator('.prose img').getAttribute('src')).startsWith(base + '/img/'));
  await page.goto(origin + base + '/tseny/');
  await page.locator('[data-billing=year]').click();
  await page.locator('[data-pricing] [data-cta]').click();
  assert.equal(new URL(page.url()).pathname, base + '/platform/');
  assert.equal(new URL(page.url()).searchParams.get('next'), '/signup?plan=year');
  await page.goto(origin + base + '/blog/');
  assert(
    await page
      .locator('.blog-card img')
      .first()
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  const kb = await (await page.request.get(origin + base + '/kb.json')).json();
  assert.equal(kb.articles.length, 33);
  assert(kb.articles.every((a) => a.url.includes('github.io/aiport_site/')));
  assert.deepEqual(errors, []);
  console.log(
    'GitHub Pages path verified: navigation, styles/fonts, filtering, help images, yearly CTA, blog and knowledge-base URLs.',
  );
} finally {
  await browser.close();
}
