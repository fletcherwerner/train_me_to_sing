import { expect, test, type Page } from '@playwright/test';

const seed = (page: Page, low = 45, high = 64) =>
  page.addInitScript(
    ([lo, hi]) => {
      if (localStorage.getItem('tmts.v1')) return;
      localStorage.setItem(
        'tmts.v1',
        JSON.stringify({
          version: 1,
          range: { lowMidi: lo, highMidi: hi, assessedAt: '2025-01-01T00:00:00.000Z' },
          settings: { latencyOffsetMs: 0 },
          progress: {},
          importedLessons: [],
        }),
      );
    },
    [low, high],
  );

test.setTimeout(120_000);

async function doLesson(page: Page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 30000 });
}

test('home lists lessons; perfect run shows passed 100% and persists', async ({ page }) => {
  await seed(page);
  await page.goto('/#/?sim=perfect');
  await expect(page.getByTestId('stage-2-count')).toHaveText('0 of 8 passed');
  await expect(page.getByTestId('continue-card')).toContainText('Find one note');
  await page.getByTestId('lesson-s2-01').click();
  await doLesson(page);
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed');
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page.getByTestId('status-s2-01')).toContainText('Passed');
  await expect(page.getByTestId('status-s2-01')).toContainText('100%');
  await expect(page.getByTestId('stage-2-count')).toHaveText('1 of 8 passed');
  await page.reload();
  await expect(page.getByTestId('status-s2-01')).toContainText('100%');
});

test('silent run shows Best 0%', async ({ page }) => {
  await seed(page);
  await page.goto('/#/?sim=silent');
  await page.getByTestId('lesson-s2-01').click();
  await doLesson(page);
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page.getByTestId('status-s2-01')).toContainText('Best 0%');
});

test('small range disables lessons that do not fit', async ({ page }) => {
  await seed(page, 50, 53);
  await page.goto('/#/');
  await expect(page.getByTestId('lesson-s1b-06')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('status-s1b-06')).toContainText("Doesn't fit: needs 7 semitones; your range is 3");
  await expect(page.getByTestId('lesson-s1a-01')).toHaveAttribute('href', /lesson\/s1a-01/);
});

test('unknown lesson shows not found; settings reset keeps range', async ({ page }) => {
  await seed(page);
  await page.goto('/#/lesson/zzz');
  await expect(page.getByText('Lesson not found')).toBeVisible();
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tmts.v1')!);
    d.progress['s1b-01'] = { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: 'x' };
    localStorage.setItem('tmts.v1', JSON.stringify(d));
  });
  await page.goto('/#/settings');
  await page.reload();
  await page.getByRole('button', { name: 'Reset progress' }).click();
  await page.getByRole('button', { name: 'Yes, clear progress' }).click();
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!));
  expect(data.progress).toEqual({});
  expect(data.range.lowMidi).toBe(45);
});
