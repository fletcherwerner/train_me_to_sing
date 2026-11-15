import { expect, test } from '@playwright/test';

test('first launch redirects to range setup; wizard completes and persists', async ({ page }) => {
  await page.goto('/#/?sim=range:45,64');
  await expect(page.getByRole('heading', { name: 'Vocal Range Assessment' })).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();

  await expect(page.getByText('Sing your lowest comfortable note and hold it.')).toBeVisible();
  await expect(page.locator('.range-note-name')).toHaveText('A2');
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Lowest note: A2')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Use this' }).click();

  await expect(page.getByText('Now sing your highest comfortable note and hold it.')).toBeVisible();
  await expect(page.locator('.range-note-name')).toHaveText('E4');
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Highest note: E4')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Use this' }).click();

  await expect(page.getByText('Your range: A2 – E4 (19 semitones)')).toBeVisible();
  await page.getByRole('button', { name: 'Raise the low note' }).click();
  await page.getByRole('button', { name: 'Lower the low note' }).click();
  await expect(page.getByText('Your range: A2 – E4 (19 semitones)')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('A2 – E4')).toBeVisible();
  await page.reload();
  await expect(page.getByText('A2 – E4')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Redo range test' })).toBeVisible();
});

test('silence during a recording window gives the retry message', async ({ page }) => {
  await page.goto('/#/range?sim=silent');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText("We couldn't hear a steady note", { exact: false })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
