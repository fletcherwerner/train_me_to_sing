import { expect, test, type Page } from '@playwright/test';

const seed = (page: Page) =>
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

// A full session is about 30 s of real audio-clock time.
test.setTimeout(90_000);

async function throughSession(page: Page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('instruction')).toHaveText('Listen and watch.');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('instruction')).toHaveText('Sing along with the piano.');
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
}

test('sim=perfect: full lesson passes', async ({ page }) => {
  await seed(page);
  await page.goto('/#/lesson/demo?sim=perfect');
  await throughSession(page);
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 30000 });
  await expect(page.getByTestId('results-score')).toContainText('5 of 5');
});

test('sim=octaveDown: Not yet with the octave tip', async ({ page }) => {
  await seed(page);
  await page.goto('/#/lesson/demo?sim=octaveDown');
  await throughSession(page);
  await expect(page.getByTestId('results-verdict')).toHaveText('Not yet', { timeout: 30000 });
  await expect(page.getByTestId('results-tip')).toContainText('different octave');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByTestId('instruction')).toContainText('Your turn');
});

test('no range redirects to range setup', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    location.hash = '#/lesson/demo';
  });
  await expect(page).toHaveURL(/#\/range/);
});
