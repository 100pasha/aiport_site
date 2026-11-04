import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WHOOP signup retains the service selection and landing attribution', async ({
  page,
  context,
}) => {
  await page.goto('/whoop/?ref=coach-42&utm_source=whoop');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ваш WHOOP.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://ligos.io/whoop/',
  );
  for (const link of await page.locator('[data-cta]').all()) {
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.pathname).toBe('/signup');
    expect(url.searchParams.get('next')).toBe('/?service=whoop');
  }
  const cookies = await context.cookies();
  expect(decodeURIComponent(cookies.find((c) => c.name === 'ref')!.value)).toBe('coach-42');
  expect(
    JSON.parse(decodeURIComponent(cookies.find((c) => c.name === 'utm')!.value)).utm_source,
  ).toBe('whoop');
  await expect(page.locator('.steps .step')).toHaveCount(3);
  await page.getByRole('link', { name: 'Подробная инструкция для ChatGPT ↗' }).click();
  await expect(page).toHaveURL(/\/podklyuchit\/chatgpt\/$/);
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
  expect(await page.evaluate(() => (window as any).__copied)).toContain(
    'для обсуждения с тренером',
  );
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
  await expect(button).toBeFocused();
  await expect(page.locator('textarea')).toHaveCount(0);
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
    const question = noJs.getByText('Какие данные доступны и можно ли что-то изменить?', {
      exact: true,
    });
    await question.click();
    await expect(
      noJs.getByText('Изменять данные в WHOOP через Ligos нельзя.', { exact: false }),
    ).toBeVisible();
    await expect(
      noJs.getByRole('link', { name: 'Подключить бесплатно ↗', exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
