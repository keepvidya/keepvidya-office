import { type Page, expect, test } from '@playwright/test';

async function newDoc(page: Page) {
  await page.goto('/');
  await page.getByTestId('new-writer').click();
  await expect(page.getByTestId('doc-page')).toBeVisible();
}

test('TC-06.3.1 — editable page + live word count', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await newDoc(page);
  await expect(page.getByTestId('ai-prompt')).toBeVisible();

  const pageEl = page.getByTestId('doc-page');
  await pageEl.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('alpha beta gamma');
  await expect(pageEl).toContainText('alpha beta gamma');
  await expect(page.getByTestId('doc-status')).toContainText('3 words');
  expect(errors).toEqual([]);
});

test('TC-06.3.2/3 — prompt → document persists across reload', async ({ page }) => {
  await newDoc(page);
  await page.getByTestId('ai-prompt').fill('a project proposal');
  await page.getByTestId('ai-generate').click();
  await expect(page.getByTestId('ai-note')).toHaveText('✓ drafted');
  await expect(page.getByTestId('doc-page')).toContainText('Project Proposal');

  await page.waitForTimeout(250); // allow async IndexedDB write
  await page.reload();
  await expect(page.getByTestId('doc-page')).toContainText('Project Proposal');
});
