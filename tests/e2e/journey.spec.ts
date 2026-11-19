import { expect, test, type Page } from '@playwright/test';

// S07: the highlighted button is the likely next step; the header link and Home's "Next" tag; light and dark.
test.setTimeout(150_000);

const SIZES = [
  { name: '1280px', width: 1280, height: 800 },
  { name: '393px', width: 393, height: 800 },
];

const seed = (page: Page) =>
  page.addInitScript(() => {
    if (localStorage.getItem('tmts.v1')) return;
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

const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name });

for (const size of SIZES) {
  test.describe(`S07 journey (${size.name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await seed(page);
    });

    test('the primary button points forward at every step; results offer the next lesson', async ({ page }) => {
      await page.goto('/#/lesson/s2-03?sim=perfect');
      await button(page, 'Start').click();
      // I do: Play is primary until played once; then "Next: We do" is.
      await expect(button(page, 'Play')).toHaveClass(/btn--primary/);
      await expect(page.getByTestId('run-button')).toHaveText('Play');
      await expect(button(page, 'Next: We do')).toBeDisabled();
      await button(page, 'Play').click();
      await expect(button(page, 'Play again')).toBeVisible({ timeout: 40000 });
      await expect(button(page, 'Next: We do')).toHaveClass(/btn--primary/);
      await expect(button(page, 'Play again')).not.toHaveClass(/btn--primary/);
      await expect(page.getByTestId('run-button')).toHaveText('Play again');
      expect(await noSideScroll(page)).toBe(true);
      // The three-step bar names where we are.
      await expect(page.locator('.lesson-steps__item--current')).toHaveText('I do');
      await button(page, 'Next: We do').click();
      await expect(page.locator('.lesson-steps__item--done')).toContainText('I do');
      // We do: Sing along is primary, then "Next: You do".
      await expect(button(page, 'Sing along')).toHaveClass(/btn--primary/);
      await button(page, 'Sing along').click();
      await expect(page.getByTestId('practice-line')).toBeVisible({ timeout: 40000 });
      await expect(button(page, 'Next: You do')).toHaveClass(/btn--primary/);
      await expect(button(page, 'Sing along again')).not.toHaveClass(/btn--primary/);
      await button(page, 'Next: You do').click();
      await button(page, 'Start').click();
      // Results: Next lesson is primary, Back to lessons is always there.
      await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 40000 });
      await expect(page.getByTestId('results-come-back')).toHaveText('Come back tomorrow to finish this one.');
      const next = page.getByTestId('next-lesson');
      await expect(next).toContainText('Next lesson: ');
      await expect(next).toHaveClass(/btn--primary/);
      await expect(page.getByTestId('back-to-lessons')).toBeVisible();
      await expect(page.getByTestId('back-to-lessons')).not.toHaveClass(/btn--primary/);
      await expect(page.locator('.lesson-actions .btn--primary')).toHaveCount(1);
      expect(await noSideScroll(page)).toBe(true);
      const title = (await next.innerText()).replace('Next lesson: ', '');
      await next.click();
      await expect(page).toHaveURL(/#\/lesson\/s2-0[4-9]/);
      await expect(page.locator('.lesson-title')).toHaveText(title);
    });

    test('sim=silent: Try again is primary and Back to lessons returns Home', async ({ page }) => {
      await page.goto('/#/lesson/s2-03?sim=silent');
      await button(page, 'Start').click();
      await button(page, 'Play').click();
      await expect(button(page, 'Play again')).toBeVisible({ timeout: 40000 });
      await button(page, 'Next: We do').click();
      await button(page, 'Next: You do').click();
      await button(page, 'Start').click();
      await expect(page.getByTestId('results-verdict')).toHaveText('Not yet', { timeout: 40000 });
      await expect(button(page, 'Try again')).toHaveClass(/btn--primary/);
      await expect(page.getByTestId('next-lesson')).toHaveCount(0);
      await expect(page.getByTestId('back-to-lessons')).toBeVisible();
      await expect(page.locator('.lesson-actions .btn--primary')).toHaveCount(1);
      await page.getByTestId('back-to-lessons').click();
      await expect(page.getByTestId('home-range')).toBeVisible();
      await expect(page).toHaveURL(/sim=silent/);
    });

    test('the header link reads "Lessons" and Home marks the next lesson', async ({ page }) => {
      await page.goto('/#/?sim=perfect');
      const tag = page.getByTestId('next-tag');
      await expect(tag).toHaveCount(1);
      await expect(tag).toHaveText('Next');
      await expect(page.getByTestId('lesson-s1a-01')).toContainText('Next');
      await page.getByTestId('lesson-s1a-01').click();
      const back = page.locator('.lesson-header').getByRole('link', { name: 'Back to lessons' });
      await expect(back).toHaveText(/Lessons/);
      await back.click();
      await expect(page.getByTestId('home-range')).toBeVisible();
      await expect(page).toHaveURL(/sim=perfect/);
    });
  });
}

test.describe('S07 light and dark', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`Home and a lesson step in ${scheme} mode`, async ({ browser }, testInfo) => {
      for (const size of SIZES) {
        const context = await browser.newContext({
          colorScheme: scheme,
          viewport: { width: size.width, height: size.height },
          ignoreHTTPSErrors: true,
          baseURL: testInfo.project.use.baseURL,
        });
        const page = await context.newPage();
        await seed(page);
        await page.goto('/#/?sim=perfect');
        await expect(page.getByTestId('next-tag')).toBeVisible();
        expect(await noSideScroll(page)).toBe(true);
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        expect(bg).toBe(scheme === 'dark' ? 'rgb(17, 20, 24)' : 'rgb(255, 255, 255)');
        await page.screenshot({ path: testInfo.outputPath(`home-${scheme}-${size.width}.png`) });
        await page.goto('/#/lesson/s1b-04?sim=perfect');
        await page.getByRole('button', { name: 'Start', exact: true }).click();
        await expect(page.getByTestId('instruction')).toBeVisible();
        expect(await noSideScroll(page)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`lesson-${scheme}-${size.width}.png`) });
        await context.close();
      }
    });
  }
});
