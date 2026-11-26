import { expect, test, type Page } from '@playwright/test';

// S11: hear the whole pattern before a solo, earn the solo, and a faster note guide.

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
const intro = (page: Page) => page.getByRole('button', { name: 'Start', exact: true }).click();
const run = (page: Page) => page.getByTestId('run-button');
const status = (page: Page) => page.getByTestId('run-status');

/** I do (play, next) and We do (sing along, wait for the result). */
async function iDoAndWeDo(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next: We do' }).click();
  await weDo(page);
}
async function weDo(page: Page) {
  await run(page).click();
  await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
}
/** The chips that were lit while the status said "Listen…", in order, until "Your turn". */
async function chipsDuringCall(page: Page): Promise<number[]> {
  const seen: number[] = [];
  await expect(status(page)).toHaveText('Listen…', { timeout: 10000 });
  for (let i = 0; i < 400; i++) {
    if ((await status(page).textContent()) !== 'Listen…') break;
    const lit = await page
      .locator('.sequence-chip')
      .evaluateAll((els) => els.findIndex((e) => e.classList.contains('sequence-chip--current')));
    if (lit >= 0 && seen[seen.length - 1] !== lit) seen.push(lit);
    await page.waitForTimeout(50);
  }
  return seen;
}
const attempts = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1') ?? '{}').progress?.['s1b-01']?.attempts ?? 0);

for (const size of SIZES) {
  test.describe(`Solo readiness (${size.name})`, () => {
    test.setTimeout(170_000);
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
    });

    test('Sol–mi You do at Learn: both notes are played first, then the result is unchanged', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await intro(page);
      await iDoAndWeDo(page);
      await page.getByRole('button', { name: 'Next: You do' }).click();
      await run(page).click();
      const chips = await chipsDuringCall(page);
      expect(chips).toEqual([0, 1]);
      await expect(status(page)).toHaveText('Your turn');
      await expect(page.getByTestId('results-score')).toContainText('2 of 2', { timeout: 40000 });
    });

    test('Prove plays the same call; perfect passes and silent scores 0 (the call is not scored)', async ({ page }) => {
      await seed(page, { 's1b-01': at('prove') });
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await intro(page);
      await run(page).click();
      await expect(status(page)).toHaveText('Listen…', { timeout: 10000 });
      await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 40000 });
      await expect(page.getByTestId('results-score')).toContainText('2 of 2');
    });

    test('Prove with sim=silent scores 0 of 2', async ({ page }) => {
      await seed(page, { 's1b-01': at('prove') });
      await page.goto('/#/lesson/s1b-01?sim=silent');
      await intro(page);
      await run(page).click();
      await expect(status(page)).toHaveText('Listen…', { timeout: 10000 });
      await expect(page.getByTestId('results-score')).toContainText('0 of 2', { timeout: 40000 });
    });

    test('"Hear it again" plays the call and records no attempt', async ({ page }) => {
      await seed(page, { 's1b-01': at('prove') });
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await intro(page);
      const before = await attempts(page);
      await page.getByTestId('hear-again').click();
      await expect(status(page)).toHaveText('Listen…');
      await expect(run(page)).toBeDisabled();
      await expect(page.getByTestId('hear-again')).not.toHaveClass(/btn--primary/);
      await expect(status(page)).toHaveCount(0, { timeout: 15000 });
      await expect(run(page)).toBeEnabled();
      expect(await attempts(page)).toBe(before);
    });

    test('the gate: a missed We do keeps "Sing along again" primary; a perfect one makes "Next: You do" primary', async ({
      page,
    }) => {
      await seed(page);
      await page.goto('/#/lesson/s1b-01?sim=weDoMiss');
      await intro(page);
      await iDoAndWeDo(page);
      await expect(page.getByTestId('wedo-gate')).toHaveText('Hit every note while singing along, then try it solo.');
      await expect(run(page)).toHaveText('Sing along again');
      await expect(run(page)).toHaveClass(/btn--primary/);
      const next = page.getByRole('button', { name: 'Next: You do' });
      await expect(next).not.toHaveClass(/btn--primary/);
      await next.click(); // still reachable
      await expect(page.getByTestId('instruction')).toContainText('Your turn');

      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await page.reload();
      await intro(page);
      await iDoAndWeDo(page);
      await expect(page.getByTestId('wedo-gate')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Next: You do' })).toHaveClass(/btn--primary/);
    });

    test('Practise unlocks after two Learn passes, and a Practise visit starts at We do', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await intro(page);
      await iDoAndWeDo(page);
      await page.getByRole('button', { name: 'Next: You do' }).click();
      await run(page).click();
      await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
      await expect(page.getByTestId('results-level')).toHaveText(
        'Passed at Learn: 1 of 2. One more pass unlocks Practise.',
      );
      await expect(page.getByTestId('advance-level')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Try again' })).toHaveClass(/btn--primary/);

      await page.getByRole('button', { name: 'Try again' }).click();
      await run(page).click();
      await expect(page.getByTestId('results-level')).toContainText('Practise is unlocked', { timeout: 40000 });
      await expect(page.getByTestId('advance-level')).toBeVisible();

      // Opening the lesson again starts Practise at We do.
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await page.reload();
      await intro(page);
      await expect(page.getByTestId('level-label')).toContainText('Practise');
      await expect(page.locator('.lesson-steps__item--current')).toHaveText('We do');
    });

    test('"Go to Practise" lands on We do', async ({ page }) => {
      await seed(page, { 's1b-01': { ...at('learn'), learnPasses: 1 } as Entry });
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await intro(page);
      await iDoAndWeDo(page);
      await page.getByRole('button', { name: 'Next: You do' }).click();
      await run(page).click();
      await expect(page.getByTestId('results-level')).toContainText('Practise is unlocked', { timeout: 40000 });
      await page.getByTestId('advance-level').click();
      await expect(page.locator('.lesson-steps__item--current')).toHaveText('We do');
    });

    test('guide speed: data-state flips within 120 ms of a 300-cent step, the text within 150 ms', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s1b-01?sim=step300');
      await intro(page);
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible({ timeout: 25000 });
      await page.getByRole('button', { name: 'Next: We do' }).click();
      await page.evaluate(() => {
        const w = window as unknown as { __rec: { far?: number; text?: number; on?: number }; __tmtsStepAt?: number };
        w.__rec = {};
        new MutationObserver(() => {
          const g = document.querySelector('[data-testid=note-guide]') as HTMLElement | null;
          const t = document.querySelector('[data-testid=note-guide-text]');
          const now = performance.now();
          if (g?.dataset.state === 'on' && w.__rec.on === undefined) w.__rec.on = now;
          if (g?.dataset.state === 'far' && w.__rec.far === undefined) w.__rec.far = now;
          if (t?.textContent?.includes('too high') && w.__rec.text === undefined) w.__rec.text = now;
        }).observe(document.body, { subtree: true, attributes: true, childList: true, characterData: true });
      });
      await run(page).click();
      await page.waitForFunction(
        () => {
          const w = window as unknown as { __rec: { far?: number; text?: number }; __tmtsStepAt?: number };
          return w.__tmtsStepAt !== undefined && w.__rec.far !== undefined && w.__rec.text !== undefined;
        },
        undefined,
        { timeout: 40000 },
      );
      const t = await page.evaluate(() => {
        const w = window as unknown as { __rec: { far: number; text: number; on?: number }; __tmtsStepAt: number };
        return { on: w.__rec.on, far: w.__rec.far - w.__tmtsStepAt, text: w.__rec.text - w.__tmtsStepAt };
      });
      expect(t.on).toBeDefined(); // it was on the note first
      expect(t.far).toBeLessThanOrEqual(120);
      expect(t.text).toBeLessThanOrEqual(150);
    });

    test('guide height: at least 90 px on the laptop', async ({ page }) => {
      test.skip(size.width < 900, 'the laptop height rule');
      await seed(page);
      await page.goto('/#/lesson/s1b-01?sim=perfect');
      await intro(page);
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible({ timeout: 25000 });
      await page.getByRole('button', { name: 'Next: We do' }).click();
      await run(page).click();
      await expect(page.getByTestId('note-guide-dot')).toBeVisible({ timeout: 25000 });
      const box = await page.locator('.note-guide__box').boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(90);
      const stop = await page.getByRole('button', { name: 'Stop' }).boundingBox();
      expect(stop!.y + stop!.height).toBeLessThanOrEqual(size.height);
    });

    test('Stage 2: You do keeps the start-note cue only (no call, no Hear it again)', async ({ page }) => {
      await seed(page);
      await page.goto('/#/lesson/s2-01?sim=perfect');
      await intro(page);
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible({ timeout: 40000 });
      await page.getByRole('button', { name: 'Next: We do' }).click();
      await weDo(page);
      await page.getByRole('button', { name: 'Next: You do' }).click();
      await expect(page.getByTestId('hear-again')).toHaveCount(0);
      await expect(page.getByTestId('wedo-gate')).toHaveCount(0);
      await run(page).click();
      await expect(status(page)).toHaveCount(0);
      await expect(page.getByTestId('results-score')).toBeVisible({ timeout: 90000 });
      await expect(page.getByTestId('results-level')).toHaveCount(0);
    });
  });
}
