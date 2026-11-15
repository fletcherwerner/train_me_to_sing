import { expect, test } from '@playwright/test';

const seed = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    localStorage.setItem(
      'tmts.v1',
      JSON.stringify({
        version: 1,
        range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
        settings: { latencyOffsetMs: 0 },
        progress: {},
        importedLessons: [],
      }),
    );
  });

test('sim=perfect passes', async ({ page }) => {
  await seed(page);
  await page.goto('/#/dev/attempt?sim=perfect');
  await page.getByRole('button', { name: 'Start attempt' }).click();
  await expect(page.getByTestId('attempt-verdict')).toHaveText('Pass', { timeout: 20000 });
  await expect(page.getByTestId('attempt-score')).toContainText('3 of 3 notes (100%)');
});

test('sim=octaveDown fails with wrong-octave on every row', async ({ page }) => {
  await seed(page);
  await page.goto('/#/dev/attempt?sim=octaveDown');
  await page.getByRole('button', { name: 'Start attempt' }).click();
  await expect(page.getByTestId('attempt-verdict')).toHaveText('Fail', { timeout: 20000 });
  for (let i = 0; i < 3; i++) {
    await expect(page.getByTestId(`result-row-${i}`)).toContainText('wrong octave');
  }
});
