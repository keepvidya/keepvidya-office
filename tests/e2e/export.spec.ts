import { type Page, expect, test } from '@playwright/test';

async function genAndExport(page: Page, newType: string, readyText: string): Promise<string> {
  await page.goto('/');
  await page.getByTestId(newType).click();
  await page.getByTestId('ai-prompt').fill('demo');
  await page.getByTestId('ai-generate').click();
  await expect(page.getByTestId('ai-note')).toHaveText(readyText);
  await page.waitForTimeout(150); // allow autosave to settle
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-btn').click()]);
  return dl.suggestedFilename();
}

test('TC-07.3.1 — each editor exports its Office file', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  expect(await genAndExport(page, 'new-sheets', '✓ filled')).toMatch(/\.xlsx$/);
  expect(await genAndExport(page, 'new-slides', '✓ deck ready')).toMatch(/\.pptx$/);
  expect(await genAndExport(page, 'new-writer', '✓ drafted')).toMatch(/\.docx$/);

  expect(errors).toEqual([]);
});
