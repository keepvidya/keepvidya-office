import { expect, test } from '@playwright/test';

// TC-03.3.1 — AI prompt bar fills the sheet (mock model) and it computes live.
test('TC-03.3.1 — AI prompt fills the sheet and it computes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await page.getByTestId('new-sheets').click();
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.getByTestId('ai-prompt')).toBeVisible();

  await page.getByTestId('ai-prompt').fill('a freelancer monthly budget');
  await page.getByTestId('ai-generate').click();

  await expect(page.locator('td[data-ref="A1"]')).toHaveText('Category');
  await expect(page.locator('td[data-ref="B5"]')).toHaveText('2400'); // computed by the engine
  await expect(page.getByTestId('ai-note')).toHaveText('✓ filled');
  expect(errors).toEqual([]);
});
