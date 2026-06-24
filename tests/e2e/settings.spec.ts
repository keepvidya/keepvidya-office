import { expect, test } from '@playwright/test';

// TC-05.3.1 — settings opens, saves, and the default mock keeps working.
test('TC-05.3.1 — AI provider settings panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await page.getByTestId('settings-btn').click();
  await expect(page.getByTestId('settings-modal')).toBeVisible();

  // choose Local Shiva, fill fields, save
  await page.getByTestId('settings-provider').selectOption('ollama');
  await page.getByTestId('settings-baseurl').fill('http://localhost:11434');
  await page.getByTestId('settings-model').fill('shiva');
  await page.getByTestId('settings-save').click();
  await expect(page.getByTestId('settings-modal')).toHaveCount(0); // closed + persisted

  // reset to Built-in demo so generation stays deterministic in CI
  await page.getByTestId('settings-btn').click();
  await page.getByTestId('settings-provider').selectOption('mock');
  await page.getByTestId('settings-save').click();
  await expect(page.getByTestId('settings-modal')).toHaveCount(0);

  // the AI still works on the mock
  await page.getByTestId('new-sheets').click();
  await expect(page.getByTestId('grid')).toBeVisible();
  await page.getByTestId('ai-prompt').fill('a freelancer budget');
  await page.getByTestId('ai-generate').click();
  await expect(page.locator('td[data-ref="B5"]')).toHaveText('2400');
  expect(errors).toEqual([]);
});
