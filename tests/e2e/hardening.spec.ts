import { expect, test, type Locator, type Page } from '@playwright/test';

// E13: audio recovery, run-screen layout, shared styles. All use the synthetic pitch source (?sim=).

const PAUSED = 'Sound is paused on this device. Check your headphones, then tap Try again.';
const STOPPED = 'The sound stopped. Check your headphones and microphone, then tap Try again.';
const LOST = 'The microphone disconnected. Reconnect it, then tap Reconnect microphone.';

type Hook = { suspendAudio(): Promise<void>; resumeAudio(): Promise<void>; loseMic(): void };
const hook = (page: Page, fn: 'suspendAudio' | 'resumeAudio' | 'loseMic') =>
  page.evaluate((f) => (window as unknown as { __tmtsTest: Hook }).__tmtsTest[f](), fn);

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

const btn = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: true });

test.describe('range test recovery', () => {
  test('sound stops during the countdown: message, Try again, then a clean run', async ({ page }) => {
    await page.goto('/#/range?sim=range:45,64');
    await btn(page, 'Start').click();
    await btn(page, 'Record').click();
    await expect(page.locator('.range-countdown')).toBeVisible();
    await hook(page, 'suspendAudio');
    await expect(page.getByText(STOPPED)).toBeVisible({ timeout: 3000 });
    await btn(page, 'Try again').click();
    await btn(page, 'Record').click();
    await expect(page.getByText('Lowest note: A2')).toBeVisible({ timeout: 15000 });
  });

  test('sound paused before Record: Record resumes it', async ({ page }) => {
    await page.goto('/#/range?sim=range:45,64');
    await btn(page, 'Start').click();
    await expect(page.locator('.range-note-name')).toHaveText('A2');
    await hook(page, 'suspendAudio');
    await btn(page, 'Record').click();
    await expect(page.getByText('Lowest note: A2')).toBeVisible({ timeout: 15000 });
  });

  test('only one primary button and one Home link', async ({ page }) => {
    await page.goto('/#/range?sim=range:45,64');
    await expect(page.getByRole('link', { name: 'Back to lessons' })).toHaveCount(1);
    await expect(page.locator('.btn--primary')).toHaveCount(1);
  });
});

/** Plays I do and We do to reach You do. */
async function toYouDo(page: Page, opts: { waitIdo?: number } = {}) {
  await btn(page, 'Start').click();
  await btn(page, 'Play').click();
  await expect(btn(page, /^(Play|Sing along) again$/)).toBeVisible({ timeout: opts.waitIdo ?? 90000 });
  await btn(page, /^Next: /).click();
}

test.describe('lesson recovery', () => {
  test.setTimeout(120_000);

  test('sound stops mid You do: message, no Results, nothing saved', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1b-04?sim=perfect');
    await toYouDo(page);
    await btn(page, /^Next: /).click();
    await btn(page, 'Start').click();
    await expect(btn(page, 'Stop')).toBeVisible();
    await page.waitForTimeout(1500);
    await hook(page, 'suspendAudio');
    await expect(page.getByText(STOPPED)).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('results')).toHaveCount(0);
    await expect(btn(page, 'Try again')).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!).progress);
    expect(saved['s1b-04']).toBeUndefined();
    await page.getByRole('link', { name: 'Back to lessons' }).click();
    await expect(page.getByTestId('status-s1b-04')).toContainText('Not started');
  });

  test('mic lost in We do: message, Reconnect, then the practice run completes', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1b-04?sim=perfect');
    await toYouDo(page);
    await btn(page, 'Sing along').click();
    await expect(btn(page, 'Stop')).toBeVisible();
    await page.waitForTimeout(1500);
    await hook(page, 'loseMic');
    await expect(page.getByText(LOST)).toBeVisible({ timeout: 3000 });
    await expect(btn(page, 'Sing along')).toHaveCount(0);
    await btn(page, 'Reconnect microphone').click();
    await expect(btn(page, 'Sing along')).toBeVisible();
    await btn(page, 'Sing along').click();
    await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 60000 });
  });

  test('sound paused before a run: the run button reports it and recovers', async ({ page }) => {
    await seed(page);
    await page.goto('/#/lesson/s1b-04?sim=perfect');
    await btn(page, 'Start').click();
    await expect(btn(page, 'Play')).toBeVisible();
    await hook(page, 'suspendAudio');
    // Play resumes the context, so this must still work.
    await btn(page, 'Play').click();
    await expect(btn(page, 'Stop')).toBeVisible();
    await expect(page.getByText(PAUSED)).toHaveCount(0);
  });
});

// ---- Layout -------------------------------------------------------------------------------------

const SIZES = [
  { name: 'laptop', width: 1280, height: 800, strict: true },
  { name: 'phone', width: 393, height: 852, strict: true },
  { name: 'phone with toolbars', width: 393, height: 660, strict: false },
];

type Box = { x: number; y: number; width: number; height: number };
const boxOf = async (l: Locator): Promise<Box | null> => ((await l.count()) ? l.first().boundingBox() : null);
const inside = (b: Box, w: number, h: number) =>
  b.x >= -1 && b.y >= -1 && b.x + b.width <= w + 1 && b.y + b.height <= h + 1;
const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1;

async function checkFits(page: Page, running: boolean, graded: boolean) {
  for (const size of SIZES) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.waitForTimeout(150);
    const where = `${size.name} ${running ? 'running' : 'idle'} ${graded ? 'graded' : 'I do'}`;
    const sel: Record<string, Locator> = {
      title: page.locator('.lesson-title'),
      steps: page.locator('.lesson-steps'),
      instruction: page.getByTestId('instruction'),
      beat: page.locator('.beat-indicator'),
      graph: page.getByTestId('pitch-graph'),
      piano: page.locator('.piano'),
      labels: page.getByTestId('note-labels'),
      strip: page.locator('.sequence-strip'),
      controls: page.locator('.lesson-controls'),
    };
    if (await page.getByTestId('now-singing').count()) sel.lyrics = page.getByTestId('now-singing');
    if (graded) sel.meter = page.getByTestId('note-guide');
    const boxes: Record<string, Box> = {};
    for (const [k, l] of Object.entries(sel)) {
      const b = await boxOf(l);
      expect(b, `${k} exists (${where})`).not.toBeNull();
      boxes[k] = b!;
    }
    // Never a sideways page scroll, never a strip that wraps during a run.
    const doc = await page.evaluate(() => ({
      sh: document.documentElement.scrollHeight,
      ch: document.documentElement.clientHeight,
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(doc.sw, `no sideways scroll (${where})`).toBeLessThanOrEqual(doc.cw);
    // S11: on the laptop the graph gives the guide room, down to 100 px (was 109).
    expect(boxes.graph.height).toBeGreaterThanOrEqual(100);
    expect(boxes.piano.height).toBeGreaterThanOrEqual(79);
    const stripRows = await page.locator('.sequence-chip').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
    expect(stripRows, `strip is one row (${where})`).toBe(1);

    if (size.strict) {
      expect(doc.sh, `no vertical page scroll (${where})`).toBeLessThanOrEqual(doc.ch);
      for (const [k, b] of Object.entries(boxes)) {
        expect(inside(b, size.width, size.height), `${k} inside window (${where}): ${JSON.stringify(b)}`).toBe(true);
      }
      const keys = Object.keys(boxes);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          expect(overlap(boxes[keys[i]], boxes[keys[j]]), `${keys[i]} overlaps ${keys[j]} (${where})`).toBe(false);
        }
      }
    } else {
      // Toolbars showing: graph, piano and the run button are in view without scrolling.
      for (const k of ['graph', 'piano', 'controls']) {
        expect(inside(boxes[k], size.width, size.height), `${k} in view (${where}): ${JSON.stringify(boxes[k])}`).toBe(true);
      }
      // Scrolled to the bottom, the controls bar covers nothing.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const strip = (await boxOf(sel.strip))!;
      const controls = (await boxOf(sel.controls))!;
      expect(strip.y + strip.height, `strip clear of controls (${where})`).toBeLessThanOrEqual(controls.y + 1);
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

for (const id of ['s1b-04', 's3-01', 's3-04']) {
  test(`run fits the window: ${id}`, async ({ page }) => {
    test.setTimeout(300_000);
    await seed(page);
    await page.goto(`/#/lesson/${id}?sim=perfect`);
    await btn(page, 'Start').click();
    await expect(btn(page, 'Play')).toBeVisible();
    await checkFits(page, false, false);
    await btn(page, 'Play').click();
    await expect(btn(page, 'Stop')).toBeVisible();
    await checkFits(page, true, false);
    await expect(btn(page, /^(Play|Sing along) again$/)).toBeVisible({ timeout: 120000 });
    await btn(page, /^Next: /).click();
    await checkFits(page, false, true);
    await btn(page, 'Sing along').click();
    await expect(btn(page, 'Stop')).toBeVisible();
    await page.waitForTimeout(500);
    await checkFits(page, true, true);
    await btn(page, 'Stop').click();
    await btn(page, /^Next: /).click();
    await checkFits(page, false, true);
    await btn(page, 'Start').click();
    await expect(btn(page, 'Stop')).toBeVisible();
    await page.waitForTimeout(1000);
    await checkFits(page, true, true);
    await expect(page.getByTestId('graph-legend').getByTestId('legend-you')).toBeVisible();
    await btn(page, 'Stop').click();
  });
}

test('legend: I do shows only "target"; You do and results show both', async ({ page }) => {
  test.setTimeout(180_000);
  await seed(page);
  await page.goto('/#/lesson/s1b-04?sim=perfect');
  await btn(page, 'Start').click();
  await expect(page.getByTestId('legend-target')).toHaveText('target');
  await expect(page.getByTestId('legend-you')).toHaveCount(0);
  await btn(page, 'Play').click();
  await expect(btn(page, /^(Play|Sing along) again$/)).toBeVisible({ timeout: 90000 });
  await btn(page, /^Next: /).click();
  await btn(page, /^Next: /).click();
  await expect(page.getByTestId('legend-you')).toHaveText('you');
  await btn(page, 'Start').click();
  await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 90000 });
  await expect(page.getByTestId('graph-legend')).toBeVisible();
  await expect(page.getByTestId('legend-target')).toBeVisible();
  await expect(page.getByTestId('legend-you')).toBeVisible();
});

test('results: verdict, score, pass mark and Try again in view at 393x852; one Home; Missed notes heading', async ({ page }) => {
  test.setTimeout(180_000);
  await seed(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/#/lesson/s3-04?sim=silent');
  await btn(page, 'Start').click();
  await btn(page, 'Play').click();
  await expect(btn(page, /^(Play|Sing along) again$/)).toBeVisible({ timeout: 120000 });
  await btn(page, /^Next: /).click();
  await btn(page, /^Next: /).click();
  await btn(page, 'Start').click();
  await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 150000 });
  for (const t of ['results-verdict', 'results-score', 'run-focus', 'results-actions']) {
    await expect(page.getByTestId(t)).toBeInViewport();
  }
  await expect(page.getByText(/pass mark/)).toBeInViewport();
  await expect(btn(page, 'Try again')).toBeInViewport();
  await expect(btn(page, 'Try again')).toHaveClass(/btn--primary/);
  await expect(page.locator('.lesson-header').getByRole('link', { name: 'Back to lessons' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Missed notes' })).toBeVisible();
  // Chips are not clipped on results either.
  const clipped = await page.locator('.sequence-chip__name, .sequence-chip__lyric').evaluateAll(
    (els) => els.filter((e) => e.scrollWidth > e.clientWidth).length,
  );
  expect(clipped).toBe(0);
  const pos = await page.getByTestId('results-actions').evaluate((el) => getComputedStyle(el).position);
  expect(pos).not.toBe('sticky');
});

test('chips are not clipped in the live strip at 393px (s3-04)', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/#/lesson/s3-04?sim=perfect');
  await btn(page, 'Start').click();
  const clipped = await page.locator('.sequence-chip__name, .sequence-chip__lyric').evaluateAll(
    (els) => els.filter((e) => e.scrollWidth > e.clientWidth).length,
  );
  expect(clipped).toBe(0);
});

test('piano sung key is "off" outside the lesson tolerance (flat40 on a t3 lesson)', async ({ page }) => {
  test.setTimeout(240_000);
  await seed(page);
  await page.goto('/#/lesson/s3-01?sim=flat40');
  await btn(page, 'Start').click();
  await btn(page, 'Play').click();
  await expect(btn(page, /^(Play|Sing along) again$/)).toBeVisible({ timeout: 120000 });
  await btn(page, /^Next: /).click();
  await btn(page, /^Next: /).click();
  await btn(page, 'Start').click();
  await expect(btn(page, 'Stop')).toBeVisible();
  // The lead-in is four clicks; wait until a note is sounding.
  await expect(page.locator('.piano-key--sung-off')).toHaveCount(1, { timeout: 20000 });
  let off = 0;
  let match = 0;
  for (let i = 0; i < 40; i++) {
    off += await page.locator('.piano-key--sung-off').count();
    match += await page.locator('.piano-key--sung-match').count();
    await page.waitForTimeout(100);
  }
  expect(off).toBeGreaterThan(0);
  expect(match).toBe(0);
});

// ---- Settings -----------------------------------------------------------------------------------

const stored = (extra: object = {}) => ({
  version: 1,
  range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 120 },
  progress: {},
  importedLessons: [],
  ...extra,
});

test('import prompt is boxed, in view; Merge is primary and Replace is danger', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.addInitScript((d) => {
    if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(d));
  }, stored());
  await page.goto('/#/settings');
  const incoming = stored({
    progress: {
      's1b-01': { passed: true, bestScore: 1, attempts: 2, lastAttemptAt: '2025-02-02' },
      's1b-02': { passed: false, bestScore: 0.5, attempts: 1, lastAttemptAt: '2025-02-02' },
    },
  });
  await page.getByTestId('import-file').setInputFiles({
    name: 'good.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(incoming)),
  });
  await expect(page.getByRole('heading', { name: 'Import progress' })).toBeInViewport();
  await expect(page.getByTestId('import-prompt')).toBeInViewport({ ratio: 0.9 });
  await expect(page.getByTestId('import-summary')).toContainText('1 lesson passed, 2 attempted');
  await expect(page.getByTestId('import-prompt').getByRole('button', { name: 'Merge' })).toHaveClass(/btn--primary/);
  await expect(page.getByTestId('import-prompt').getByRole('button', { name: 'Replace' })).toHaveClass(/btn--danger/);
  await expect(page.getByText('Replace deletes the range and progress on this device. This cannot be undone.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import progress' })).toBeFocused();
});

test('production build: Settings shows "Open the tuner" but not the other developer pages', async ({ page }) => {
  await page.addInitScript((d) => localStorage.setItem('tmts.v1', JSON.stringify(d)), stored());
  await page.goto('http://localhost:4173/#/settings');
  await expect(page.getByRole('link', { name: 'Open the tuner' })).toBeVisible();
  for (const p of ['piano', 'exercise', 'attempt']) {
    await expect(page.locator(`a[href*="/dev/${p}"]`)).toHaveCount(0);
  }
});

test('Home keeps ?sim= from the lesson screen', async ({ page }) => {
  await seed(page);
  await page.goto('/#/lesson/s1b-04?sim=perfect');
  await expect(page.getByRole('link', { name: 'Back to lessons' })).toHaveAttribute('href', /sim=perfect/);
});
