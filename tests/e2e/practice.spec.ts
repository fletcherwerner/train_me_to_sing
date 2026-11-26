import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
];

type Entry = { passed: boolean; bestScore: number; attempts: number; lastAttemptAt: string; level?: string };

/** Version 1 data on purpose: it is migrated on load. */
const seed = (page: Page, progress: Record<string, Entry> = {}) =>
  page.addInitScript((p) => {
    if (localStorage.getItem('tmts.v1')) return;
    localStorage.setItem(
      'tmts.v1',
      JSON.stringify({
        version: 1,
        range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
        settings: { latencyOffsetMs: 0 },
        progress: p,
        importedLessons: [],
      }),
    );
  }, progress);

const AT = '2026-11-01T00:00:00.000Z';
const atProve = (): Entry => ({ passed: false, bestScore: 1, attempts: 1, lastAttemptAt: AT, level: 'prove' });
const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const start = (page: Page) => page.getByRole('button', { name: 'Start', exact: true });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!));

/** Intro Start, then Start on the You do screen (a lesson already at Prove). */
async function proveRun(page: Page) {
  await start(page).click();
  await start(page).click();
  await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
}

test.describe('mastery over two days', () => {
  test.setTimeout(200_000);

  test('Passed once, then Passed in a new key the next day, then a review is due', async ({ page }) => {
    await seed(page, { 's1b-01': atProve() });
    await page.goto('/#/?sim=perfect&today=2026-11-20');
    await page.getByTestId('lesson-s1b-01').click();
    await proveRun(page);
    await expect(page.getByTestId('results-verdict')).toHaveText('Passed');
    await expect(page.getByTestId('results-mastery')).toContainText('Passed once — come back tomorrow in a new key');
    const day1 = await stored(page);
    expect(day1.version).toBe(2);
    expect(day1.progress['s1b-01'].proofs).toHaveLength(1);
    expect(day1.progress['s1b-01'].passed).toBe(false);
    await page.getByRole('link', { name: 'Back to lessons' }).first().click();
    await expect(page.getByTestId('status-s1b-01')).toContainText('Passed once');

    // Passing again the same day is not a second day.
    await page.getByTestId('lesson-s1b-01').click();
    await proveRun(page);
    await expect(page.getByTestId('results-mastery')).toContainText('Passed once');

    // The next day, in a new key.
    await page.goto('/#/?sim=perfect&today=2026-11-21');
    await page.getByTestId('lesson-s1b-01').click();
    await proveRun(page);
    await expect(page.getByTestId('results-mastery')).toContainText('Mastered');
    const day2 = await stored(page);
    const tonics = new Set(day2.progress['s1b-01'].proofs.map((p: { tonicMidi: number }) => p.tonicMidi));
    expect(tonics.size).toBeGreaterThanOrEqual(2);
    expect(day2.progress['s1b-01']).toMatchObject({ passed: true, review: { step: 0, dueOn: '2026-11-22' } });
    await page.getByRole('link', { name: 'Back to lessons' }).first().click();
    await expect(page.getByTestId('status-s1b-01')).toContainText('Passed');
    await expect(page.getByTestId('status-s1b-01')).not.toContainText('Passed once');
    await expect(page.getByTestId('unit-B-count')).toHaveText('1 of 7 passed');

    // The day after: the review is due, and Today's practice brings the lesson back.
    await page.goto('/#/?sim=perfect&today=2026-11-22');
    await expect(page.getByTestId('status-s1b-01')).toContainText('Review due');
    await expect(page.getByTestId('practice-summary')).toContainText('1 review');
    await page.getByTestId('start-practice').click();
    await expect(page.getByTestId('practice-part')).toContainText('Part 1 of');
  });
});

test.describe('scooping', () => {
  test.setTimeout(150_000);

  test('in Unit C at Prove, sliding into notes is a miss with the tip', async ({ page }) => {
    await seed(page, { 's1c-01': atProve() });
    await page.goto('/#/lesson/s1c-01?sim=scoop');
    await proveRun(page);
    await expect(page.getByTestId('results-verdict')).toHaveText('Not yet');
    await expect(page.getByTestId('missed-notes')).toContainText('You slid into this note. Try to start right on it.');
    await expect(page.getByTestId('run-focus-sliding')).toContainText('Sliding into notes');
  });

  test('in Unit B it is only a tip and the notes still count', async ({ page }) => {
    await seed(page, { 's1b-01': atProve() });
    await page.goto('/#/lesson/s1b-01?sim=scoop');
    await proveRun(page);
    await expect(page.getByTestId('results-verdict')).toHaveText('Passed');
    await expect(page.getByTestId('results-score')).toContainText('2 of 2');
    // Two notes are too few to name a pattern, so "Focus next" shows the run's best point.
    await expect(page.getByTestId('run-focus')).toBeVisible();
  });
});

for (const size of SIZES) {
  test.describe(`Today's practice (${size.name})`, () => {
    test.setTimeout(300_000);
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
    });

    test('runs every part with sim=perfect, saves progress; the warm-up is not scored', async ({ page }) => {
      await seed(page);
      await page.goto('/#/?sim=perfect&today=2026-11-20');
      await expect(page.getByTestId('practice-summary')).toHaveText('Warm-up, 4 notes, Sol–mi');
      await page.getByTestId('start-practice').click();

      // 1. Warm-up: three glides drawn as sloped lines. No score anywhere.
      await expect(page.getByTestId('practice-part')).toContainText('Part 1 of 3: Warm-up');
      await expect(page.getByTestId('practice-stop')).toBeVisible();
      for (let i = 1; i <= 3; i++) {
        await expect(page.getByTestId('warmup-count')).toContainText(`Glide ${i} of 3`);
        await expect(page.getByTestId('graph-target').first()).toHaveAttribute('data-glide', 'true');
        const t = await page.getByTestId('graph-target').first().evaluate((el) => ({
          y1: Number(el.getAttribute('y1')),
          y2: Number(el.getAttribute('y2')),
        }));
        expect(t.y1).not.toBe(t.y2);
        await expect(page.getByTestId('warmup').locator('.piano-marker').first()).toBeVisible();
        await expect(page.getByTestId('warmup-note-labels')).toBeVisible();
        expect(await noSideScroll(page)).toBe(true);
        await page.getByTestId('warmup-start').click();
        await expect(page.getByTestId('practice-stop')).toBeVisible();
        await expect(page.getByTestId('warmup-next')).toBeVisible({ timeout: 40000 });
        await expect(page.getByTestId('results-score')).toHaveCount(0);
        await page.getByTestId('warmup-next').click();
      }

      // 2. Pitch finding: four single notes.
      await expect(page.getByTestId('practice-part')).toContainText('Pitch finding');
      await page.getByTestId('run-button').click();
      await expect(page.getByTestId('match-target')).toContainText('Note 1 of 4');
      await expect(page.getByTestId('match-countdown')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('results-score')).toContainText('4 of 4', { timeout: 120000 });
      await expect(page.getByTestId('match-result-3')).toContainText('✓ Found in');
      await expect(page.locator('.btn--primary')).toHaveCount(1);
      await expect(page.getByTestId('back-to-lessons')).toHaveCount(0);
      await page.getByTestId('practice-next').click();

      // 3. New pattern: Sol–mi at Learn.
      await expect(page.getByTestId('practice-part')).toContainText('New pattern: Sol–mi');
      await start(page).click();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 40000 });
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('button', { name: 'Sing along' }).click();
      await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 40000 });
      await page.getByRole('button', { name: 'Next' }).click();
      await start(page).click();
      // S11: the first Learn pass counts (1 of 2) and does not unlock Practise.
      await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 40000 });
      await expect(page.getByTestId('practice-stop')).toBeVisible();
      // S07: inside practice the only primary button is "Next part"; the lesson's own exits are hidden.
      await expect(page.locator('.btn--primary')).toHaveCount(1);
      await expect(page.getByTestId('practice-next')).toHaveClass(/btn--primary/);
      await expect(page.getByTestId('next-lesson')).toHaveCount(0);
      await expect(page.getByTestId('back-to-lessons')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Hear it again' })).toBeVisible();
      await page.getByTestId('practice-next').click();

      // 4. Wrap-up.
      await expect(page.getByTestId('wrapup')).toBeVisible();
      await expect(page.getByTestId('wrapup-practised')).toContainText('Warm-up — done');
      await expect(page.getByTestId('wrapup-practised')).toContainText('Pitch finding');
      await expect(page.getByTestId('wrapup-practised')).toContainText('New pattern: Sol–mi — passed');
      await expect(page.getByTestId('wrapup-due')).toBeVisible();
      await expect(page.getByTestId('wrapup-time')).toContainText('Practice time');
      expect(await noSideScroll(page)).toBe(true);

      const data = await stored(page);
      expect(data.progress['s1a-01'].attempts).toBe(1);
      expect(data.progress['s1b-01']).toMatchObject({ level: 'learn', learnPasses: 1, attempts: 1 });
      expect(Object.keys(data.progress).some((k) => k.startsWith('warmup'))).toBe(false);
    });

    test('Stop for today is visible during a run and ends practice', async ({ page }) => {
      await seed(page);
      await page.goto('/#/practice?sim=perfect&today=2026-11-20');
      await expect(page.getByTestId('practice-stop')).toBeVisible();
      await page.getByTestId('warmup-start').click();
      await expect(page.getByTestId('practice-stop')).toBeVisible();
      expect(await noSideScroll(page)).toBe(true);
      await page.getByTestId('practice-stop').click();
      await expect(page.getByTestId('wrapup')).toBeVisible();
      await expect(page.getByTestId('wrapup-practised')).toContainText('Warm-up — skipped');
      expect(await noSideScroll(page)).toBe(true);
      await page.getByTestId('wrapup-home').click();
      await expect(page.getByTestId('home-range')).toBeVisible();
    });

    test('a note after 20 minutes of practice, none before', async ({ page }) => {
      await seed(page);
      await page.goto('/#/practice?sim=perfect&today=2026-11-20');
      await expect(page.getByTestId('practice-good-session')).toHaveCount(0);
      await page.goto('/#/practice?sim=perfect&today=2026-11-20&minutes=20');
      await page.reload();
      await expect(page.getByTestId('practice-good-session')).toHaveText(
        "That's a good session. Stop if your voice feels tired.",
      );
    });
  });
}

test('a review comes back at Prove in a new key and moves the schedule on', async ({ page }) => {
  test.setTimeout(200_000);
  const mastered = {
    's1b-01': {
      passed: true,
      bestScore: 1,
      attempts: 4,
      lastAttemptAt: AT,
      level: 'prove',
      proofs: [
        { date: '2026-11-18', tonicMidi: 50, score: 1 },
        { date: '2026-11-19', tonicMidi: 52, score: 1 },
      ],
      review: { step: 0, dueOn: '2026-11-20' },
    },
  };
  await page.addInitScript((p) => {
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
  }, mastered);
  await page.goto('/#/?sim=perfect&today=2026-11-20');
  await expect(page.getByTestId('status-s1b-01')).toContainText('Review due');
  await page.getByTestId('lesson-s1b-01').click();
  await expect(page.getByTestId('lesson-goal')).toBeVisible();
  await proveRun(page);
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed');
  const data = await stored(page);
  expect(data.progress['s1b-01'].review).toEqual({ step: 1, dueOn: '2026-11-23' });
  const last = data.progress['s1b-01'].proofs.at(-1);
  expect([50, 52]).not.toContain(last.tonicMidi);
});
