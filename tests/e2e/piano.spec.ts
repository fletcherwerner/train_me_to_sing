import { expect, test } from '@playwright/test';

test('dev piano page loads and shows the keyboard', async ({ page }) => {
  await page.goto('/#/dev/piano');
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Piano keyboard' })).toBeVisible();
  await expect(page.locator('.piano-key--white')).toHaveCount(15);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByTestId('key-60').click();
  await expect(page.getByTestId('key-60')).toHaveClass(/piano-key--target/);
});
