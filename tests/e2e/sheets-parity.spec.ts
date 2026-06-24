import { type Page, expect, test } from '@playwright/test';

async function newSheet(page: Page) {
  await page.goto('/');
  await page.getByTestId('new-sheets').click();
  await expect(page.getByTestId('grid')).toBeVisible();
}
async function typeInto(page: Page, ref: string, text: string) {
  await page.locator(`td[data-ref="${ref}"]`).click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

test('TC-P1.3.1 — drag-select shows the aggregate', async ({ page }) => {
  await newSheet(page);
  await typeInto(page, 'A1', '10');
  await typeInto(page, 'A2', '20');
  await typeInto(page, 'A3', '30');

  const a1 = (await page.locator('td[data-ref="A1"]').boundingBox())!;
  const a3 = (await page.locator('td[data-ref="A3"]').boundingBox())!;
  await page.mouse.move(a1.x + 8, a1.y + 8);
  await page.mouse.down();
  await page.mouse.move(a3.x + 8, a3.y + 8, { steps: 6 });
  await page.mouse.up();

  const status = page.getByTestId('sheet-status');
  await expect(status).toContainText('Sum 60');
  await expect(status).toContainText('Avg 20');
  await expect(status).toContainText('Count 3');
  await expect(status).toContainText('Min 10');
  await expect(status).toContainText('Max 30');
});

test('TC-P1.3.2 — bold toggles + persists across reload', async ({ page }) => {
  await newSheet(page);
  await typeInto(page, 'A1', 'Header');
  await page.locator('td[data-ref="A1"]').click();
  await page.getByTestId('fmt-bold').click();
  await expect(page.locator('td[data-ref="A1"]')).toHaveClass(/bold/);

  await page.waitForTimeout(200);
  await page.reload();
  await expect(page.locator('td[data-ref="A1"]')).toHaveClass(/bold/);
});

test('TC-P1.3.3 — ∑ inserts SUM for the column above', async ({ page }) => {
  await newSheet(page);
  await typeInto(page, 'A1', '10');
  await typeInto(page, 'A2', '20');
  await typeInto(page, 'A3', '30'); // active is now A4
  await page.getByTestId('quick-sum').click();
  await expect(page.locator('td[data-ref="A4"]')).toHaveText('60');
  await page.locator('td[data-ref="A4"]').click();
  await expect(page.getByTestId('formula-input')).toHaveValue('=SUM(A1:A3)');
});

test('TC-P1.3.4 — multi-cell paste places a block', async ({ page }) => {
  await newSheet(page);
  await page.locator('td[data-ref="A1"]').click();
  await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="grid"]')!;
    const dt = new DataTransfer();
    dt.setData('text', '1\t2\n3\t4');
    grid.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  });
  await expect(page.locator('td[data-ref="A1"]')).toHaveText('1');
  await expect(page.locator('td[data-ref="B1"]')).toHaveText('2');
  await expect(page.locator('td[data-ref="A2"]')).toHaveText('3');
  await expect(page.locator('td[data-ref="B2"]')).toHaveText('4');
});
