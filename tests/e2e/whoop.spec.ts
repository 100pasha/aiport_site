import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WHOOP opens the guest chat and retains landing attribution', async ({ page, context }) => {
  await page.goto('/whoop/?ref=coach-42&utm_source=whoop');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('WHOOP в вашем ChatGPT — Ligos');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://ligos.io/whoop/',
  );
  for (const link of await page.locator('[data-cta]').all()) {
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.pathname).toBe('/whoop');
    expect(url.searchParams.has('next')).toBe(false);
  }
  const cookies = await context.cookies();
  expect(decodeURIComponent(cookies.find((c) => c.name === 'ref')!.value)).toBe('coach-42');
  expect(
    JSON.parse(decodeURIComponent(cookies.find((c) => c.name === 'utm')!.value)).utm_source,
  ).toBe('whoop');
  await expect(page.locator('[data-cta]')).toHaveCount(2);
  await expect(page.locator('.site-header a')).toHaveCount(2);
  await expect(page.locator('.site-header nav')).toHaveCount(0);
  await page.getByText('С какими ИИ работает?', { exact: true }).click();
  await expect(page.locator('details[open]')).toContainText('ChatGPT, Claude и Le Chat');
  await expect(page.locator('.site-version')).toContainText('Версия сайта:');
});

test('WHOOP questions copy the full prompt, including the coach summary', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (value: string) => {
          (window as any).__copied = value;
        },
      },
    });
  });
  await page.goto('/whoop/');
  for (const button of await page.locator('[data-prompt]').all()) {
    await button.click();
    await expect
      .poll(() => page.evaluate(() => (window as any).__copied))
      .toBe(await button.getAttribute('data-prompt'));
    await expect(page.getByRole('status')).toContainText('Вопрос скопирован');
  }
  expect(await page.evaluate(() => (window as any).__copied)).toContain('для тренера');
});

test('blocked clipboard uses the fallback and reports a failed copy honestly', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    });
    document.execCommand = () => false;
  });
  await page.goto('/whoop/');
  const button = page.locator('[data-prompt]').first();
  await button.click();
  await expect(page.getByRole('status')).toContainText('Выделите и скопируйте');
  await expect(page.locator('#manual-prompt')).toBeFocused();
  await expect(page.locator('#manual-prompt')).toHaveValue(
    (await button.getAttribute('data-prompt'))!,
  );
});

for (const width of [1440, 820, 390, 320]) {
  test(`WHOOP layout and accessibility at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/whoop/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('h1')).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      accessibility.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('WHOOP remains usable without JavaScript and is linked from the personal landing', async ({
  browser,
  page,
}) => {
  await page.goto('/dlya-sebya/');
  await page.locator('[data-cta="personal_whoop"]').click();
  await expect(page).toHaveURL(/\/whoop\/$/);
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const noJs = await context.newPage();
    await noJs.goto('http://127.0.0.1:4321/whoop/');
    await expect(noJs.getByRole('heading', { level: 1 })).toBeVisible();
    const question = noJs.getByText('Ligos может что-то изменить в моём WHOOP?', {
      exact: true,
    });
    await question.click();
    await expect(
      noJs.getByText('Нет. Подключение даёт доступ только на чтение.', { exact: false }),
    ).toBeVisible();
    await expect(
      noJs.getByRole('link', { name: 'Подключить бесплатно', exact: true }).first(),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('WHOOP ads variant tracks each CTA once and preserves source parameters', async ({ page }) => {
  await page.route('https://mc.yandex.ru/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.goto('/whoop/?variant=ads&utm_source=community&ref=pavel');
  await expect(page.locator('h1')).toHaveText('WHOOP в вашем ChatGPT — Ligos');
  await expect(page.locator('[data-cta]')).toHaveCount(3);
  await expect(page.locator('#ads-intro')).toBeVisible();
  await page.evaluate(() => {
    (window as any).__goals = [];
    document.body.dataset.ymId = '123';
    window.ym = (...args: unknown[]) => (window as any).__goals.push(args);
    document
      .querySelectorAll('[data-cta]')
      .forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  });
  for (const link of await page.locator('[data-cta]').all()) {
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.searchParams.get('utm_source')).toBe('community');
    expect(url.searchParams.get('ref')).toBe('pavel');
    await link.click();
  }
  const goals = await page.evaluate(() =>
    (window as any).__goals.filter((a: unknown[]) => a[2] === 'cta_click'),
  );
  expect(goals.map((a: any[]) => a[3])).toEqual([
    { block: 'whoop_ads_top', plan: 'free', variant: 'ads' },
    { block: 'whoop_letter_mid', plan: 'free', variant: 'ads' },
    { block: 'whoop_letter_bottom', plan: 'free', variant: 'ads' },
  ]);
});

test('WHOOP serves both original photographs and opens the full screenshot', async ({ page }) => {
  await page.goto('/whoop/');
  await expect(page.locator('.letter-photo img')).toHaveJSProperty('naturalWidth', 863);
  await page.locator('.shot-wrap img').scrollIntoViewIfNeeded();
  await expect(page.locator('.shot-wrap img')).toHaveJSProperty('naturalWidth', 1320);
  await expect(page.locator('.highlight')).toHaveCount(0);
  await page.getByRole('button', { name: 'Открыть скриншот крупнее' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('img')).toHaveJSProperty('naturalWidth', 1320);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});
