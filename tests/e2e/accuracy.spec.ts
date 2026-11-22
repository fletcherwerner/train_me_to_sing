import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
];

const seed = (page: Page) =>
  page.addInitScript(() => {
    if (localStorage.getItem('tmts.v1')) return;
    localStorage.setItem(
      'tmts.v1',
      JSON.stringify({
        version: 2,
        range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
        settings: { latencyOffsetMs: 0 },
        progress: {},
        importedLessons: [],
      }),
    );
  });

async function throughSession(page: Page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  // At Practise and Prove the lesson goes straight to You do.
  const play = page.getByRole('button', { name: 'Play', exact: true });
  const sing = page.getByRole('button', { name: 'Start', exact: true });
  await expect(page.getByTestId('instruction')).toBeVisible();
  if (!(await play.isVisible())) {
    await sing.click();
    await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
    return;
  }
  await play.click();
  await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
}

for (const size of SIZES) {
  test.describe(`Accuracy (${size.name})`, () => {
    test.setTimeout(150_000);
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
    });

    test('perfect then flat40: new best, then a lower accuracy keeps the best', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1b-04?sim=perfect');
      await expect(page.getByTestId('best-accuracy')).toHaveText('No best yet');
      await throughSession(page);
      // The synthetic singer reads one frame ahead of the recorded clock, so a perfect run is 98-100%, not always 100%.
      const first = (await page.getByTestId('results-accuracy').textContent()) ?? '';
      const f = /^Accuracy: (9[89]|100)% — ✓ New best!$/.exec(first);
      expect(f, first).not.toBeNull();
      const best = `${f![1]}%`;
      await expect(page.getByTestId('results-score')).toContainText('3 of 3 notes hit · pass mark 80%');
      await expect(page.getByTestId('note-accuracy-0')).toHaveText(/^✓ hit · (9[89]|100)%$/);
      await expect(page.getByTestId('best-accuracy')).toHaveText(`Best accuracy: ${best}`);

      await page.getByRole('link', { name: 'Back to lessons' }).first().click();
      await expect(page.getByTestId('status-s1b-04')).toContainText(best);
      await page.goto('/#/lesson/s1b-04?sim=flat40');
      await page.reload();
      await expect(page.getByTestId('best-accuracy')).toHaveText(`Best accuracy: ${best}`);
      await throughSession(page);
      // 40 cents flat still counts as hit, but is less accurate.
      await expect(page.getByTestId('results-score')).toContainText('3 of 3 notes hit');
      const text = (await page.getByTestId('results-accuracy').textContent()) ?? '';
      const m = /^Accuracy: (\d+)% · Best: (\d+%)$/.exec(text);
      expect(m, text).not.toBeNull();
      expect(Number(m![1])).toBeLessThan(80);
      expect(m![2]).toBe(best);
      await expect(page.getByTestId('best-accuracy')).toHaveText(`Best accuracy: ${best}`);
    });

    test('a match lesson shows accuracy and updates the best', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1a-02?sim=perfect');
      await expect(page.getByTestId('best-accuracy')).toHaveText('No best yet');
      await page.getByTestId('run-button').click();
      await expect(page.getByTestId('results-accuracy')).toContainText('New best!', { timeout: 90000 });
      await expect(page.getByTestId('results-accuracy')).toContainText(/Accuracy: \d+%/);
      await expect(page.getByTestId('note-accuracy-0')).toContainText('%');
      await expect(page.getByTestId('best-accuracy')).toContainText(/Best accuracy: \d+%/);
      await page.getByRole('link', { name: 'Back to lessons' }).first().click();
      await expect(page.getByTestId('status-s1a-02')).toContainText(/Passed · \d+%/);
    });
  });
}
