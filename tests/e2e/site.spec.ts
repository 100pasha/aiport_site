import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('home, yearly pricing and platform fallback', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Спросите свой ИИ');
  const pricing = page.locator('[data-pricing]');
  await pricing.getByRole('button', { name: /Год/ }).click();
  await expect(pricing.locator('[data-price]')).toHaveText('7 476');
  await expect(pricing.locator('[data-period]')).toHaveText('/ год');
  await expect(pricing.locator('[data-cta]')).toHaveAttribute('data-plan', 'year');
  await pricing.locator('[data-cta]').click();
  await expect(page).toHaveURL(/next=%2Fsignup%3Fplan%3Dyear/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('центр управления');
});
test('catalog combines filters, persists URL and handles no matches', async ({ page }) => {
  await page.goto('/katalog/?cat=crm');
  await expect(page.locator('[data-service-card]:visible')).toHaveCount(3);
  await page.selectOption('[data-segment]', 'smb');
  await page.locator('[data-catalog-search]').fill('amo');
  await expect(page.locator('[data-service-card]:visible')).toHaveCount(1);
  await expect(page).toHaveURL(/q=amo/);
  await page.reload();
  await expect(page.locator('[data-catalog-search]')).toHaveValue('amo');
  await expect(page.locator('[data-service-card]:visible')).toHaveCount(1);
  await page.locator('[data-catalog-search]').fill('несуществующий');
  await expect(page.locator('[data-empty]')).toBeVisible();
  await page.locator('[data-reset]').click();
  await expect(page.locator('[data-service-card]:visible')).toHaveCount(16);
});
test('vote fallback does not claim to send or retain the email', async ({ page }) => {
  await page.goto('/katalog/?status=soon');
  await page.locator('[data-vote="whoop"]').click();
  await page.locator('#vote-form input[type=email]').fill('test@example.com');
  await page.locator('#vote-form input[type=checkbox]').check();
  await page.locator('#vote-form button[type=submit]').click();
  await expect(page.locator('.form-message')).toContainText('не отправлен и не сохранён');
  await expect
    .poll(() => page.evaluate(() => JSON.stringify(localStorage)))
    .not.toContain('test@example.com');
  await page.keyboard.press('Escape');
  await expect(page.locator('#vote-dialog')).not.toBeVisible();
});
test('mobile menu, sticky CTA and layout fit the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await page.locator('#kak-eto-rabotaet').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-sticky]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
for (const route of [
  '/',
  '/katalog/',
  '/tseny/',
  '/voprosy/',
  '/katalog/ozon/',
  '/podklyuchit/claude/',
  '/blog/pribyl-posle-komissiy/',
  '/dlya-sebya/',
])
  test(`accessible page ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.getByRole('button', { name: 'Только необходимые' }).click();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
test('platform vote honors errors and confirms only accepted API responses', async ({ page }) => {
  await page.route('**/katalog/', async (route) => {
    const r = await route.fetch();
    await route.fulfill({
      response: r,
      body: (await r.text()).replace(/data-app(?:="[^"]*")?/, 'data-app="https://platform.test"'),
    });
  });
  let status = 429;
  let payload: unknown;
  await page.route('https://platform.test/**', async (route) => {
    if (route.request().url().endsWith('/api/public/votes')) {
      payload = route.request().postDataJSON();
      await route.fulfill({ status, headers: { 'Access-Control-Allow-Origin': '*' }, json: {} });
    } else await route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/katalog/');
  await page.locator('[data-vote="whoop"]').click();
  await page.locator('#vote-form input[type=email]').fill('test@example.com');
  await page.locator('#vote-form input[type=checkbox]').check();
  await page.locator('#vote-form button[type=submit]').click();
  await expect(page.locator('.form-message')).toContainText('Подождите минуту');
  status = 201;
  await page.locator('#vote-form button[type=submit]').click();
  await expect(page.locator('.form-message')).toContainText('Сообщим, когда подключим');
  expect(payload).toEqual({ service_id: 'whoop', email: 'test@example.com' });
});
test('analytics loads on page visit and CTA includes goal block', async ({ page }) => {
  await page.route('**/tseny/', async (route) => {
    const r = await route.fetch();
    await route.fulfill({
      response: r,
      body: (await r.text()).replace(/data-ym-id(?:="[^"]*")?/, 'data-ym-id="123456"'),
    });
  });
  let requests = 0;
  await page.route('https://mc.yandex.ru/**', async (route) => {
    requests++;
    await route.fulfill({
      contentType: 'application/javascript',
      body: 'window.__goals=[]; window.ym=(...args)=>window.__goals.push(args);',
    });
  });
  await page.goto('/tseny/');
  await expect(page.locator('[data-cookie-banner]')).toHaveCount(0);
  await expect.poll(() => requests).toBe(1);
  await page
    .locator('[data-pricing] [data-cta]')
    .evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
  await page.locator('[data-pricing] [data-cta]').click();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.stringify((window as unknown as { __goals: unknown[] }).__goals)),
    )
    .toContain('cta_click');
});
test('referral and first-touch attribution cookies survive navigation', async ({
  page,
  context,
}) => {
  await page.goto('/?ref=friend-42&utm_source=first');
  let cookies = await context.cookies();
  expect(decodeURIComponent(cookies.find((c) => c.name === 'ref')!.value)).toBe('friend-42');
  await page.goto('/katalog/?utm_source=second');
  cookies = await context.cookies();
  expect(
    JSON.parse(decodeURIComponent(cookies.find((c) => c.name === 'utm')!.value)).utm_source,
  ).toBe('first');
});
test('no JavaScript still renders content, navigation and FAQ', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('.faq-list summary').first().click();
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await context.close();
});

test('personal landing offers a service choice and an email waitlist', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/dlya-sebya/');
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.hero [data-vote="personal"]').click();
  await expect(page.locator('[data-personal-choice]')).toBeVisible();
  await page.selectOption('[name=personal_service]', 'vkusvill');
  await expect(page.locator('[name=personal_service]')).toHaveValue('vkusvill');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations.map((v) => v.id)).toEqual([]);
});

test('all page types fit a 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  const routes = [
    '/',
    '/biznes/',
    '/dlya-sebya/',
    '/katalog/',
    '/katalog/ozon/',
    '/katalog/wildberries/',
    '/katalog/whoop/',
    '/podklyuchit/',
    '/podklyuchit/claude/',
    '/podklyuchit/chatgpt/',
    '/tseny/',
    '/bezopasnost/',
    '/voprosy/',
    '/partneram/',
    '/blog/',
    '/blog/pribyl-posle-komissiy/',
    '/oferta/',
    '/politika/',
    '/soglasie/',
    '/404.html',
    '/platform/',
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response!.status(), route).toBe(200);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      route,
    ).toBe(true);
  }
});
