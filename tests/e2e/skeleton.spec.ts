import { expect, test } from '@playwright/test';

// TS-00.3 — critical flows (E2E). Each step has an expected result (see TEST-PLAN).

test('TC-00.3.1 — app boots to Home with zero console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page.getByTestId('home')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Keepvidya Office' })).toBeVisible();
  await expect(page.getByTestId('new-writer')).toBeVisible();
  await expect(page.getByTestId('new-sheets')).toBeVisible();
  await expect(page.getByTestId('new-slides')).toBeVisible();
  expect(errors).toEqual([]);
});

test('TC-00.3.2 — create routes to the editor', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('new-sheets').click();
  await expect(page).toHaveURL(/#\/sheets\//);
  await expect(page.getByTestId('editor')).toBeVisible();
  await expect(page.getByTestId('grid')).toBeVisible();
});

test('TC-00.3.3 — persistence survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('new-sheets').click();
  await page.getByTestId('editor-title').fill('Budget');
  await page.waitForTimeout(250); // allow async IndexedDB write
  await page.goto('/'); // back to Home
  await expect(page.getByTestId('recent').getByText('Budget')).toBeVisible();
});

test('TC-00.3.4 — theme toggle is durable', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByTestId('theme-toggle').click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after ?? 'light');
});
