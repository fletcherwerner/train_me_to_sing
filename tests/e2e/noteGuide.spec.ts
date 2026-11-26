import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 750 },
];

type Entry = { passed: boolean; bestScore: number; attempts: number; lastAttemptAt: string; level?: string };

const seed = (page: Page, progress: Record<string, Entry> = {}) =>
  page.addInitScript((p) => {
    if (localStorage.getItem('tmts.v1')) return;
    localStorage.setItem(
      'tmts.v1',
      JSON.stringify({
        version: 2,
        range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
        settings: { latencyOffsetMs: 0 },
        progress: p,
        importedLessons: [],
      }),
    );
  }, progress);

const AT = '2026-11-01T00:00:00.000Z';
const at = (level: string): Entry => ({ passed: false, bestScore: 1, attempts: 1, lastAttemptAt: AT, level });
const start = (page: Page) => page.getByRole('button', { name: 'Start', exact: true });
const guide = (page: Page) => page.getByTestId('note-guide');

/** Intro Start, I do (Play, Next), then We do: Sing along starts the run. */
async function intoWeDo(page: Page) {
  await start(page).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
}

/** A Practise visit starts at We do (S11): one sing-along, then You do. Leaves the You do run going. */
async function practiseYouDo(page: Page) {
  await start(page).click();
  await page.getByRole('button', { name: 'Sing along', exact: true }).click();
  await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
  await page.getByRole('button', { name: 'Next: You do' }).click();
  await start(page).click();
}

for (const size of SIZES) {
  test.describe(`Note guide (${size.name})`, () => {
    test.setTimeout(150_000);
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
    });

    const learnCases: [string, string, RegExp, string?][] = [
      ['perfect', 'on', /On it/],
      ['flat70', 'near', /go up/, 'up'],
      ['sharp300', 'far', /About 3 notes too high/, 'down'],
      ['octaveDown', 'octave', /an octave too low/, 'up'],
    ];
    for (const [sim, state, text, dir] of learnCases) {
      test(`Sol–mi at Learn, sim=${sim}: ${state}`, async ({ page }) => {
        await seed(page);
        await page.goto(`/#/lesson/s1b-01?sim=${sim}`);
        await intoWeDo(page);
        await expect(guide(page)).toHaveAttribute('data-state', state, { timeout: 20000 });
        if (dir) await expect(guide(page)).toHaveAttribute('data-direction', dir);
        await expect(page.getByTestId('note-guide-text')).toContainText(text);
        const target = (await page.getByTestId('note-labels').textContent()) ?? '';
        const name = /Target: ([A-G]#?\d)/.exec(target)![1];
        await expect(page.getByTestId('note-guide-note')).toHaveText(name);
        await expect(page.locator('.cents-meter')).toHaveCount(0);
        if (size.width < 500 && sim === 'perfect') {
          // The guide and Stop are both in view at 393 x 750.
          const g = await guide(page).boundingBox();
          const stop = await page.getByRole('button', { name: 'Stop' }).boundingBox();
          expect(g!.y + g!.height).toBeLessThanOrEqual(size.height);
          expect(stop!.y + stop!.height).toBeLessThanOrEqual(size.height);
        }
      });
    }

    test('Sol–mi at Learn: I do shows the target line only', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await start(page).click();
      await expect(guide(page)).toHaveAttribute('data-state', 'idle');
      await expect(page.getByTestId('note-guide-dot')).toHaveCount(0);
    });

    test('Sol–mi at Practise: perfect never shows the guide', async ({ page }) => {
      await seed(page, { 's1b-01': at('practise') });
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await practiseYouDo(page);
      await expect(page.getByTestId('instruction')).toBeVisible();
      for (let i = 0; i < 30 && (await page.getByTestId('results-verdict').count()) === 0; i++) {
        await expect(guide(page)).toHaveCount(0);
        await page.waitForTimeout(500);
      }
      await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
      await expect(page.getByTestId('guide-helped')).toHaveCount(0);
    });

    test('Sol–mi at Practise: flat70 shows the rescue and the results say so', async ({ page }) => {
      await seed(page, { 's1b-01': at('practise') });
      await page.goto('/#/lesson/s1b-01?sim=flat70');
      await practiseYouDo(page);
      await expect(guide(page)).toBeVisible({ timeout: 20000 });
      await expect(guide(page)).toHaveAttribute('data-direction', 'up');
      await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
      await expect(page.getByTestId('guide-helped')).toContainText(/The guide helped on \d of 2 notes\./);
    });

    test('Sol–mi at Practise: silent never shows the guide', async ({ page }) => {
      await seed(page, { 's1b-01': at('practise') });
      await page.goto('/#/lesson/s1b-01?sim=silent');
      await practiseYouDo(page);
      for (let i = 0; i < 16; i++) {
        await expect(guide(page)).toHaveCount(0);
        await page.waitForTimeout(500);
      }
    });

    for (const sim of ['perfect', 'flat70', 'sharp300']) {
      test(`Sol–mi at Prove, sim=${sim}: no guide`, async ({ page }) => {
        await seed(page, { 's1b-01': at('prove') });
        await page.goto(`/#/lesson/s1b-01?sim=${sim}`);
        await start(page).click();
        await start(page).click();
        for (let i = 0; i < 12; i++) {
          await expect(guide(page)).toHaveCount(0);
          await page.waitForTimeout(500);
        }
      });
    }

    test('Find one note: sharp300 shows "too high"; perfect shows On it with Found it', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1a-01?sim=sharp300');
      await page.getByTestId('run-button').click();
      await expect(page.getByTestId('note-guide-text')).toContainText('too high', { timeout: 20000 });
      await expect(guide(page)).toHaveAttribute('data-direction', 'down');
      await page.getByRole('button', { name: 'Stop' }).click();
      await page.goto('/#/lesson/s1a-01?sim=perfect');
      await page.reload();
      await page.getByTestId('run-button').click();
      await expect(page.getByTestId('match-status')).toContainText('Found it', { timeout: 20000 });
      await expect(page.getByTestId('note-guide-text')).toHaveText('On it');
    });

    test("Today's practice, Pitch finding: the guide shows", async ({ page }) => {
      await seed(page, { 's1b-01': at('prove') });
      await page.goto('/#/?sim=perfect&today=2026-11-20');
      await page.getByTestId('start-practice').click();
      for (let i = 1; i <= 3; i++) {
        await page.getByTestId('warmup-start').click();
        await expect(page.getByTestId('warmup-next')).toBeVisible({ timeout: 40000 });
        await page.getByTestId('warmup-next').click();
      }
      await expect(page.getByTestId('practice-part')).toContainText('Pitch finding');
      await page.getByTestId('run-button').click();
      await expect(guide(page)).toBeVisible({ timeout: 20000 });
      await expect(page.getByTestId('note-guide-text')).toContainText(/\S/);
    });
  });
}
