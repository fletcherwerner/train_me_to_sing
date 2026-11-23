import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
];

type Progress = Record<string, { passed: boolean; bestScore: number; attempts: number; lastAttemptAt: string; level?: string }>;

const seed = (page: Page, progress: Progress = {}) =>
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

const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const runButton = (page: Page) => page.getByTestId('run-button');
const startOfRun = (page: Page) => page.getByRole('button', { name: 'Start', exact: true });
/** The note names a piano key is lit for (target keys). */
const litKeys = (page: Page) => page.locator('[class*="piano-key--target"], [class*="piano-key--sung"]').count();

async function learnIDoAndWeDo(page: Page) {
  await startOfRun(page).click(); // intro Start
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
}

for (const size of SIZES) {
  test.describe(`Stage 1 (${size.name})`, () => {
    test.setTimeout(150_000);
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
    });

    test('s1a-02 with sim=perfect matches 6 of 6; Stop is visible during the run', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1a-02?sim=perfect');
      await expect(page.getByTestId('match-how')).toContainText('Sliding up to the note is fine');
      await runButton(page).click();
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
      await expect(page.getByTestId('match-target')).toContainText('Note 1 of 6');
      await expect(page.getByTestId('pitch-graph')).toBeVisible();
      expect(await noSideScroll(page)).toBe(true);
      // S09: the target runs its full 8 s even though a perfect singer matches at once.
      await expect(page.getByTestId('match-countdown')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('match-countdown')).toHaveAttribute('role', 'progressbar');
      const sungAt = Date.now();
      await expect(page.getByTestId('match-status')).toContainText('Listen', { timeout: 15000 });
      expect(Date.now() - sungAt).toBeGreaterThan(7500); // next "Listen…" only after the full 8 s
      await expect(page.getByTestId('match-line-0')).toContainText('Found in');
      await expect(page.getByTestId('results-score')).toContainText('6 of 6', { timeout: 100000 });
      await expect(page.getByTestId('results-verdict')).toHaveText('Passed');
      await expect(page.getByTestId('match-result-0')).toContainText('✓ Found in');
      await expect(page.getByTestId('match-result-0')).toContainText('on the note');
      await expect(page.getByTestId('results-accuracy')).toContainText(/Accuracy: \d+%/);
      expect(await noSideScroll(page)).toBe(true);
      await page.getByRole('link', { name: 'Back to lessons' }).first().click();
      await expect(page.getByTestId('status-s1a-02')).toContainText('Passed');
    });

    test('s1a-02 with sim=silent matches 0 of 6', async ({ page }) => {
      test.setTimeout(180_000);
      await seed(page);
      await page.goto('/#/lesson/s1a-02?sim=silent');
      await runButton(page).click();
      await expect(page.getByTestId('results-score')).toContainText('0 of 6', { timeout: 140000 });
      await expect(page.getByTestId('results-verdict')).toHaveText('Not yet');
      await expect(page.getByTestId('match-result-0')).toContainText('Not found');
    });

    test('Home shows units, levels and the rebuilt notice; no sideways scroll', async ({ page }) => {
      const at = '2025-01-01T00:00:00.000Z';
      await seed(page, {
        's1-02': { passed: true, bestScore: 1, attempts: 2, lastAttemptAt: at }, // old Stage 1: dropped
        's2-01': { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: at },
        's1b-01': { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: at, level: 'prove' },
        's1b-02': { passed: false, bestScore: 0.9, attempts: 1, lastAttemptAt: at, level: 'practise' },
        's1b-03': { passed: false, bestScore: 0.6, attempts: 1, lastAttemptAt: at },
      });
      await page.goto('/#/');
      await expect(page.getByTestId('stage1-notice')).toContainText(
        'Stage 1 has been rebuilt. Your Stage 2 and 3 progress is kept.',
      );
      for (const u of ['A', 'B', 'C', 'D']) await expect(page.getByTestId(`unit-${u}`)).toBeVisible();
      await expect(page.getByTestId('unit-A')).toContainText('Find your voice');
      await expect(page.getByTestId('unit-B')).toContainText('First intervals');
      await expect(page.getByTestId('unit-C')).toContainText('Four-note patterns');
      await expect(page.getByTestId('unit-D')).toContainText('Five-note scale');
      await expect(page.getByTestId('unit-A-count')).toHaveText('0 of 3 passed');
      await expect(page.getByTestId('unit-B-count')).toHaveText('1 of 7 passed');
      await expect(page.getByTestId('stage-1-count')).toHaveText('1 of 19 passed');
      // A v1 Stage 2 pass becomes one proof of unknown key: it needs one more passing day.
      await expect(page.getByTestId('stage-2-count')).toHaveText('0 of 8 passed');
      await expect(page.getByTestId('status-s2-01')).toContainText('Passed once');
      await expect(page.getByTestId('status-s1b-01')).toContainText('Passed');
      await expect(page.getByTestId('status-s1b-02')).toContainText('Practise');
      await expect(page.getByTestId('status-s1b-03')).toContainText('Learn');
      await expect(page.getByTestId('status-s1b-04')).toContainText('Not started');
      // Continue picks the first unpassed lesson in the new order.
      await expect(page.getByTestId('continue-card')).toContainText('Find one note');
      expect(await noSideScroll(page)).toBe(true);
      await page.getByTestId('stage1-notice-dismiss').click();
      await expect(page.getByTestId('stage1-notice')).toHaveCount(0);
      await page.reload();
      await expect(page.getByTestId('stage1-notice')).toHaveCount(0);
    });
  });
}

test.describe('s1b-04 feedback levels', () => {
  test.setTimeout(200_000);

  for (const size of SIZES) {
    test(`Learn, Practise and Prove, then Passed on Home (${size.name})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await seed(page);
      await page.goto('/#/lesson/s1b-04?sim=perfect');
      await expect(page.getByTestId('lesson-goal')).toBeVisible();
      await learnIDoAndWeDo(page);
      await expect(page.getByTestId('level-label')).toHaveText('Level: Learn');
      await expect(page.getByTestId('start-note')).toContainText('Starting on');

      // Learn: You do pass unlocks Practise.
      await page.getByRole('button', { name: 'Next' }).click();
      await startOfRun(page).click();
      await expect(page.getByTestId('results-verdict')).toHaveText('Level passed', { timeout: 40000 });
      await expect(page.getByTestId('results-level')).toContainText('Practise is unlocked');
      await page.getByTestId('advance-level').click();

      // Practise: targets, but no red line and no sung key while singing; the full graph after.
      await expect(page.getByTestId('level-label')).toHaveText('Level: Practise');
      await expect(page.getByTestId('instruction')).toContainText('Your turn');
      await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
      await startOfRun(page).click();
      await expect(page.getByTestId('count-in')).toBeVisible();
      await expect(page.getByTestId('count-in')).toBeHidden({ timeout: 15000 });
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
      await expect(page.getByTestId('pitch-graph')).toBeVisible();
      await expect(page.getByTestId('legend-you')).toHaveCount(0);
      await expect(page.getByTestId('note-labels')).not.toContainText('Sung');
      await expect(page.getByTestId('graph-sung')).toHaveAttribute('d', '');
      await expect(page.locator('[class*="piano-key--sung"]')).toHaveCount(0);
      await expect(page.getByRole('meter')).toHaveCount(0);
      expect(await noSideScroll(page)).toBe(true);
      await expect(page.getByTestId('results-verdict')).toHaveText('Level passed', { timeout: 40000 });
      await expect(page.getByTestId('results-graph')).toBeVisible();
      await expect(page.getByTestId('results-graph').getByTestId('graph-sung')).toHaveAttribute('d', /^M/);
      await page.getByTestId('advance-level').click();

      // Prove: no graph, no sung key, no meter; only the starting note is lit before the count-in.
      await expect(page.getByTestId('level-label')).toHaveText('Level: Prove');
      await expect(page.getByTestId('pitch-graph')).toHaveCount(0);
      expect(await litKeys(page)).toBe(1);
      await startOfRun(page).click();
      await expect(page.getByTestId('count-in')).toBeVisible();
      await expect(page.getByTestId('count-in')).toBeHidden({ timeout: 15000 });
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
      await expect(page.getByTestId('pitch-graph')).toHaveCount(0);
      await expect(page.getByTestId('graph-sung')).toHaveCount(0);
      await expect(page.getByTestId('note-labels')).toHaveCount(0);
      await expect(page.locator('[class*="piano-key--target"], [class*="piano-key--sung"]')).toHaveCount(0);
      await expect(page.getByRole('meter')).toHaveCount(0);
      await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 40000 });
      await expect(page.getByTestId('results-level')).toContainText('without any live help');

      await page.getByRole('link', { name: 'Back to lessons' }).first().click();
      await expect(page.getByTestId('status-s1b-04')).toContainText('Passed once');
      await expect(page.getByTestId('status-s1b-04')).toContainText('come back tomorrow in a new key');
      await expect(page.getByTestId('unit-B-count')).toHaveText('0 of 7 passed');
    });
  }

  test('a lesson opens at its highest unlocked level and can be stepped back down', async ({ page }) => {
    const at = '2025-01-01T00:00:00.000Z';
    await seed(page, { 's1b-04': { passed: false, bestScore: 1, attempts: 2, lastAttemptAt: at, level: 'prove' } });
    await page.goto('/#/lesson/s1b-04?sim=perfect');
    await startOfRun(page).click();
    await expect(page.getByTestId('level-label')).toHaveText('Level: Prove');
    await page.getByTestId('step-down').click();
    await expect(page.getByTestId('level-label')).toHaveText('Level: Practise');
    await page.getByTestId('step-down').click();
    await expect(page.getByTestId('level-label')).toHaveText('Level: Learn');
    await expect(page.getByTestId('instruction')).toHaveText('Listen and watch.');
  });

  test('the starting note changes between Practise attempts (key=random)', async ({ page }) => {
    const at = '2025-01-01T00:00:00.000Z';
    await seed(page, { 's1b-04': { passed: false, bestScore: 1, attempts: 1, lastAttemptAt: at, level: 'practise' } });
    await page.goto('/#/lesson/s1b-04?sim=perfect&key=random');
    await startOfRun(page).click();
    await expect(page.getByTestId('level-label')).toHaveText('Level: Practise');
    const first = await page.getByTestId('start-note').innerText();
    expect(first).toMatch(/^Starting on [A-G]#?\d$/);
    await startOfRun(page).click();
    await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
    await page.getByRole('button', { name: 'Try again' }).click();
    const second = await page.getByTestId('start-note').innerText();
    expect(second).not.toBe(first);
  });

  test('a failed Prove attempt stays at Prove', async ({ page }) => {
    const at = '2025-01-01T00:00:00.000Z';
    await seed(page, { 's1b-04': { passed: false, bestScore: 1, attempts: 1, lastAttemptAt: at, level: 'prove' } });
    await page.goto('/#/lesson/s1b-04?sim=octaveDown');
    await startOfRun(page).click();
    await startOfRun(page).click();
    await expect(page.getByTestId('results-verdict')).toHaveText('Not yet', { timeout: 40000 });
    await expect(page.getByTestId('level-label')).toHaveText('Level: Prove');
    await expect(page.getByTestId('advance-level')).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to lessons' }).first().click();
    await expect(page.getByTestId('status-s1b-04')).toContainText('Prove');
    await expect(page.getByTestId('status-s1b-04')).not.toContainText('Passed');
  });
});

test.describe('echo yourself', () => {
  test.setTimeout(150_000);

  for (const size of SIZES) {
    test(`after a perfect Unit B run it plays your voice and scores a We do-style attempt (${size.name})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await seed(page);
      await page.goto('/#/lesson/s1b-04?sim=perfect');
      await startOfRun(page).click();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 25000 });
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByTestId('echo-button')).toHaveCount(0);
      await page.getByRole('button', { name: 'Sing along' }).click();
      await expect(page.getByTestId('practice-line')).toContainText('3 of 3', { timeout: 25000 });
      await expect(page.getByTestId('echo-button')).toBeVisible({ timeout: 10000 });
      await page.getByTestId('echo-button').click();
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
      expect(await noSideScroll(page)).toBe(true);
      await expect(page.getByTestId('echo-line')).toContainText('Echo run: 3 of 3 notes', { timeout: 25000 });
      // The We do result is left alone, and nothing is saved by an echo run.
      await expect(page.getByTestId('practice-line')).toContainText('3 of 3');
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!).progress);
      expect(saved['s1b-04']).toBeUndefined();
    });
  }

  test('is not offered after a run that was not clean', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1b-04?sim=flat40');
    await startOfRun(page).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 25000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Sing along' }).click();
    await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
    await expect(page.getByTestId('echo-button')).toHaveCount(0);
  });

  test('Unit A: after matching, echo plays your own note and you match it', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1a-01?sim=perfect');
    await runButton(page).click();
    await expect(page.getByTestId('results-score')).toContainText('5 of 5', { timeout: 100000 });
    await page.getByTestId('echo-button').click();
    await expect(page.getByTestId('echo-line')).toContainText('Echo: matched', { timeout: 25000 });
  });

  test('a lesson without echo (Unit C) never offers it', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1c-01?sim=perfect');
    await startOfRun(page).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 25000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Sing along' }).click();
    await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
    await expect(page.getByTestId('echo-button')).toHaveCount(0);
  });
});

test.describe('landing right on it', () => {
  test.setTimeout(160_000);

  test('s1a-03 says so when it is told to land right on the note', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1a-03?sim=perfect');
    await expect(page.getByTestId('match-how')).toContainText('Start right on the note: you have 0.4 seconds');
    await runButton(page).click();
    // A perfect singer starts right on the note, so every target matches.
    await expect(page.getByTestId('results-score')).toContainText('6 of 6', { timeout: 100000 });
  });
});

test.describe('match lessons report how well (S09)', () => {
  test.setTimeout(160_000);

  test('sim=flat40 says flat with the cents, matched per tolerance', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1a-02?sim=flat40');
    await runButton(page).click();
    await expect(page.getByTestId('results-score')).toContainText('of 6', { timeout: 120000 });
    await expect(page.getByTestId('match-result-0')).toContainText(/flat \(−40 cents\)/);
  });
});
