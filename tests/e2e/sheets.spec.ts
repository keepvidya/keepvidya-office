import { type Page, expect, test } from '@playwright/test';

async function newSheet(page: Page) {
  await page.goto('/');
  await page.getByTestId('new-sheets').click();
  await expect(page.getByTestId('grid')).toBeVisible();
}

async function typeInto(page: Page, ref: string, text: string) {
  await page.getByTestId('grid').locator(`td[data-ref="${ref}"]`).click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

test('TC-02.3.1 — grid renders', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await newSheet(page);
  await expect(page.getByTestId('formula-input')).toBeVisible();
  await expect(page.locator('th[data-c="1"]')).toHaveText('A');
  await expect(page.locator('td[data-ref="A1"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('TC-02.3.2 — type values + SUM formula', async ({ page }) => {
  await newSheet(page);
  const grid = page.getByTestId('grid');
  await grid.locator('td[data-ref="A1"]').click();
  await page.keyboard.type('10');
  await page.keyboard.press('Enter');
  await page.keyboard.type('20'); // now on A2
  await page.keyboard.press('Enter');
  await page.keyboard.type('=SUM(A1:A2)'); // now on A3
  await page.keyboard.press('Enter');
  await expect(grid.locator('td[data-ref="A3"]')).toHaveText('30');
  await expect(grid.locator('td[data-ref="A1"]')).toHaveText('10');
});

test('TC-02.3.3 — error value displays', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await newSheet(page);
  await typeInto(page, 'B1', '=1/0');
  await expect(page.getByTestId('grid').locator('td[data-ref="B1"]')).toHaveText('#DIV/0!');
  expect(errors).toEqual([]);
});

test('TC-02.3.4/5 — formula bar edits + persistence across reload', async ({ page }) => {
  await newSheet(page);
  const grid = page.getByTestId('grid');
  await typeInto(page, 'A1', '10');
  await typeInto(page, 'A2', '20');
  await typeInto(page, 'A3', '=SUM(A1:A2)');

  // formula bar reflects the active cell's raw content
  await grid.locator('td[data-ref="A3"]').click();
  await expect(page.getByTestId('formula-input')).toHaveValue('=SUM(A1:A2)');

  // edit via the formula bar
  const fb = page.getByTestId('formula-input');
  await fb.fill('=A1*A2');
  await fb.press('Enter');
  await expect(grid.locator('td[data-ref="A3"]')).toHaveText('200');

  // persistence: reload re-opens the same sheet (hash route) with restored data
  await page.waitForTimeout(250); // allow async IndexedDB write
  await page.reload();
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.locator('td[data-ref="A1"]')).toHaveText('10');
  await expect(page.locator('td[data-ref="A3"]')).toHaveText('200');
});
