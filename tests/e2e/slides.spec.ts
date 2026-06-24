import { type Page, expect, test } from '@playwright/test';

async function newDeckWithAI(page: Page) {
  await page.goto('/');
  await page.getByTestId('new-slides').click();
  await expect(page.getByTestId('sl-stage')).toBeVisible();
  await page.getByTestId('ai-prompt').fill('a pitch for my app');
  await page.getByTestId('ai-generate').click();
  await expect(page.getByTestId('ai-note')).toHaveText('✓ deck ready');
}

test('TC-04.3.1 — generate a deck from a prompt', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.getByTestId('new-slides').click();
  await expect(page.getByTestId('ai-prompt')).toBeVisible();
  await page.getByTestId('ai-prompt').fill('a pitch for my app');
  await page.getByTestId('ai-generate').click();
  await expect(page.getByTestId('ai-note')).toHaveText('✓ deck ready');
  expect(await page.getByTestId('sl-thumb').count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId('sl-stage')).toContainText('Your Big Idea');
  expect(errors).toEqual([]);
});

test('TC-04.3.2 — present mode navigates and exits', async ({ page }) => {
  await newDeckWithAI(page);
  await page.getByTestId('sl-present-btn').click();
  const present = page.getByTestId('sl-present');
  await expect(present).toBeVisible();
  await expect(present).toContainText('Your Big Idea'); // slide 1
  await page.keyboard.press('ArrowRight');
  await expect(present).toContainText('The Problem'); // slide 2
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('sl-present')).toHaveCount(0); // overlay removed
});

test('TC-04.3.3 — inline title edit persists across reload', async ({ page }) => {
  await newDeckWithAI(page);
  const titleEl = page.getByTestId('sl-stage').getByTestId('sl-el').first();
  await titleEl.dblclick();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('My Custom Title');
  await page.getByTestId('ai-prompt').click(); // blur to commit
  await expect(page.getByTestId('sl-stage')).toContainText('My Custom Title');

  await page.waitForTimeout(250); // allow async IndexedDB write
  await page.reload();
  await expect(page.getByTestId('sl-stage')).toContainText('My Custom Title');
});
