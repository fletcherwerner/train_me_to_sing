import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
];

interface SeedNote {
  t: number;
  c: number | null;
  h: number;
  o?: number;
}
interface SeedRun {
  date: string;
  notes: SeedNote[];
  accuracy?: number;
}

/** A run of `total` voiced notes, `flat` of them 30 cents flat, `wobbly` of them held for only 30%. Scattered, so no drift. */
function makeRun(date: string, total: number, flat: number, wobbly = 0, accuracy = 0.7): SeedRun {
  const notes: SeedNote[] = [];
  for (let i = 0; i < total; i++) {
    const slot = (i * 7) % total;
    notes.push({ t: 60, c: slot < flat ? -30 : 0, h: (i * 3) % total < wobbly ? 0.3 : 1, o: 0 });
  }
  return { date, notes, accuracy };
}

async function seed(page: Page, runs: SeedRun[]) {
  await page.addInitScript((rs: SeedRun[]) => {
    if (localStorage.getItem('tmts.v1')) return;
    localStorage.setItem(
      'tmts.v1',
      JSON.stringify({
        version: 2,
        range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
        settings: { latencyOffsetMs: 0 },
        progress: {},
        importedLessons: [],
        history: {
          runs: rs.map((r, i) => ({
            id: `seed-${i}`,
            lessonId: 's1b-04',
            kind: 'melody',
            date: r.date,
            endedAt: `${r.date}T10:00:00.000Z`,
            durationSec: 30,
            inPractice: false,
            range: { lowMidi: 45, highMidi: 64 },
            score: 0.8,
            accuracy: r.accuracy ?? 0.7,
            passed: true,
            notes: r.notes,
          })),
          days: Object.fromEntries(rs.map((r) => [r.date, { seconds: 600 }])),
        },
      }),
    );
  }, runs);
}

async function seedRangeOnly(page: Page) {
  await page.addInitScript(() => {
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
}

async function throughSession(page: Page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
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
  test.describe(`Practice insights (${size.name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
    });

    test('a finished perfect run: positive focus, the ring says 1 of 4 days, Progress shows the day, time and best run', async ({ page }) => {
      test.setTimeout(150_000);
      await seedRangeOnly(page);
      await page.goto('/#/?sim=perfect');
      await expect(page.getByTestId('home-week-ring')).toContainText('0 of 4 days this week');
      await page.goto('/#/lesson/s1b-04?sim=perfect');
      await throughSession(page);
      await expect(page.getByTestId('run-focus')).toBeVisible();
      await expect(page.getByTestId('run-focus-positive')).toBeVisible();
      await page.getByTestId('back-to-lessons').click();
      await expect(page.getByTestId('home-week-ring')).toContainText('1 of 4 days this week');
      await page.getByTestId('home-week-ring').click();
      await expect(page.getByTestId('progress')).toBeVisible();
      await expect(page.getByTestId('week-count')).toHaveText('1 of 4 days');
      await expect(page.locator('[data-testid^="day-dot-"][data-today="true"]')).toHaveAttribute('data-active', 'true');
      await expect(page.locator('[data-testid^="day-dot-"][data-active="true"]')).toHaveCount(1);
      await expect(page.getByTestId('time-today')).not.toHaveText('0 min');
      await expect(page.getByTestId('best-s1b-04')).toBeVisible();
      await expect(page.getByTestId('today-card')).toContainText('1 run');
      // No horizontal scrolling at this width.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('flat40 names "Landing flat" with the cents', async ({ page }) => {
      test.setTimeout(150_000);
      await seedRangeOnly(page);
      await page.goto('/#/lesson/s1d-01?sim=flat40');
      await throughSession(page);
      const flat = page.getByTestId('run-focus-flat');
      await expect(flat).toBeVisible();
      await expect(flat).toContainText('Landing flat');
      await expect(flat).toContainText('by about 40 cents');
    });

    test('stopping a run early does not add an active day', async ({ page }) => {
      await seedRangeOnly(page);
      await page.goto('/#/lesson/s1b-04?sim=perfect&today=2026-11-26');
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.getByRole('button', { name: 'Stop' }).click();
      await page.getByRole('link', { name: /Lessons/ }).first().click();
      await expect(page.getByTestId('home-week-ring')).toContainText('0 of 4 days this week');
    });

    test('a new student sees the empty state', async ({ page }) => {
      await seedRangeOnly(page);
      await page.goto('/#/progress?today=2026-11-26');
      await expect(page.getByTestId('progress-empty')).toHaveText('Sing your first lesson to start your week.');
      await expect(page.getByTestId('week-count')).toHaveText('0 of 4 days');
    });

    test('goal met this week, 3 days last week', async ({ page }) => {
      await seed(page, [
        makeRun('2026-11-16', 6, 0), makeRun('2026-11-18', 6, 0), makeRun('2026-11-20', 6, 0), // last week: 3 days
        makeRun('2026-11-23', 6, 0), makeRun('2026-11-24', 6, 0), makeRun('2026-11-25', 6, 0), makeRun('2026-11-26', 6, 0),
      ]);
      await page.goto('/#/progress?today=2026-11-27');
      await expect(page.getByTestId('week-count')).toHaveText('4 of 4 days');
      await expect(page.getByTestId('goal-met')).toHaveText('Goal met');
      await expect(page.getByTestId('last-week')).toHaveText('Last week: 3 days');
      await expect(page.getByTestId('week-compare')).toHaveText('1 more than last week');
      await expect(page.getByTestId('streak')).toHaveText('Goal met this week');
      await page.goto('/#/?today=2026-11-27');
      await expect(page.getByTestId('home-week-ring')).toContainText('4 of 4 days this week');
    });

    test('goal met two weeks in a row', async ({ page }) => {
      await seed(page, [
        makeRun('2026-11-16', 6, 0), makeRun('2026-11-17', 6, 0), makeRun('2026-11-18', 6, 0), makeRun('2026-11-19', 6, 0),
        makeRun('2026-11-23', 6, 0), makeRun('2026-11-24', 6, 0), makeRun('2026-11-25', 6, 0), makeRun('2026-11-26', 6, 0),
      ]);
      await page.goto('/#/progress?today=2026-11-27');
      await expect(page.getByTestId('last-week')).toHaveText('Last week: 4 days');
      await expect(page.getByTestId('streak')).toHaveText('Goal met 2 weeks in a row');
    });

    test('four weeks of use: patterns name what keeps coming up and improvements name flat landing', async ({ page }) => {
      const before = ['2026-10-31', '2026-11-03', '2026-11-06', '2026-11-09'].map((d) => makeRun(d, 20, 8, 8)); // flat 40%, unsteady 40%
      const recent = ['2026-11-14', '2026-11-17', '2026-11-20', '2026-11-24'].map((d) => makeRun(d, 20, 4, 8)); // flat 20%, unsteady 40%
      await seed(page, [...before, ...recent]);
      await page.goto('/#/progress?today=2026-11-27');
      await expect(page.getByTestId('patterns-window')).toHaveText('Last 2 weeks');
      const steady = page.getByTestId('pattern-unsteady');
      await expect(steady).toContainText('Holding steady');
      await expect(steady).toContainText('on 4 of 4 days');
      await expect(page.getByTestId('improvements')).toContainText('Landing flat: 40% of notes → 20%');
    });

    test('five days of use: the 1-week window and the keep-going text', async ({ page }) => {
      await seed(page, ['2026-11-21', '2026-11-22', '2026-11-24', '2026-11-25', '2026-11-26'].map((d) => makeRun(d, 8, 4)));
      await page.goto('/#/progress?today=2026-11-27');
      await expect(page.getByTestId('patterns-window')).toHaveText('Last week');
      await expect(page.getByTestId('improvements')).toContainText("Keep going: after about four weeks, this shows what you've improved.");
    });
  });
}
