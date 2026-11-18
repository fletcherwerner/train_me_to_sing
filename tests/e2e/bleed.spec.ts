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

test.setTimeout(90_000);

async function iDoThenWeDo(page: Page, sim: string) {
  await seed(page);
  await page.goto(`/#/lesson/s1b-04?sim=${sim}`);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  if (sim === 'bleed') {
    // Live readout must not follow the piano while it plays.
    await page.waitForTimeout(3000);
    await expect(page.getByTestId('note-labels')).toContainText('Sung: —');
  }
  await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
}

test('sim=bleed: piano only counts for nothing and the notice shows', async ({ page }) => {
  await iDoThenWeDo(page, 'bleed');
  await expect(page.getByTestId('practice-line')).toContainText('0 of 3 notes');
  await expect(page.getByTestId('bleed-notice')).toBeVisible();
  const d = await page.getByTestId('graph-sung').last().getAttribute('d');
  // At most one stray dot (the simulator looks one frame ahead of a note edge); no line following the piano.
  expect((d ?? '').match(/M/g)?.length ?? 0).toBeLessThanOrEqual(1);});

test('sim=bleedSing: a singer over the piano is scored', async ({ page }) => {
  await iDoThenWeDo(page, 'bleedSing');
  await expect(page.getByTestId('practice-line')).toContainText('3 of 3 notes');
  await expect(page.getByTestId('bleed-notice')).toBeVisible();
});

test('sim=perfect: unchanged and no notice', async ({ page }) => {
  await iDoThenWeDo(page, 'perfect');
  await expect(page.getByTestId('practice-line')).toContainText('3 of 3 notes');
  await expect(page.getByTestId('bleed-notice')).toHaveCount(0);
});
