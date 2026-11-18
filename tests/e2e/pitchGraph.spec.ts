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

const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const size of [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
]) {
  test(`pitch graph during You do and on results (${size.name})`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await seed(page);
    await page.goto('/#/lesson/s1b-04?sim=perfect');
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    // I do: black only.
    const graph = page.getByTestId('pitch-graph');
    await expect(graph).toBeVisible();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    expect(await page.getByTestId('graph-target').count()).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    expect(await page.getByTestId('graph-sung').getAttribute('d')).toBe('');
    await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 25000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Sing along' }).click();
    await expect(page.getByTestId('practice-line')).toContainText('Practice run:', { timeout: 25000 });
    // We do: the finished run's graph shows, black and red.
    await expect(page.getByTestId('results-graph')).toBeVisible();
    await expect(page.getByTestId('results-graph').getByTestId('graph-sung')).toHaveAttribute('d', /^M/);
    expect(await noSideScroll(page)).toBe(true);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('results-graph')).toHaveCount(0);

    // You do: graph above the piano, black and red present, Stop visible.
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(page.getByTestId('graph-sung')).toHaveAttribute('d', /^M/, { timeout: 15000 });
    expect(await page.getByTestId('graph-target').count()).toBeGreaterThan(0);
    const gBox = await graph.boundingBox();
    const pBox = await page.locator('.piano').boundingBox();
    expect(gBox && pBox && gBox.y + gBox.height <= pBox.y + 1).toBe(true);
    // E13 B1: the graph shrinks (110 to 160 px) so the whole run fits in the window.
    expect(gBox!.height).toBeGreaterThanOrEqual(110);
    expect(gBox!.height).toBeLessThanOrEqual(160);
    await expect(page.getByRole('button', { name: 'Stop' })).toBeInViewport();
    expect(await noSideScroll(page)).toBe(true);

    // Results.
    await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('results-graph')).toBeVisible();
    await expect(page.getByTestId('results-graph').getByTestId('graph-sung')).toHaveAttribute('d', /^M/);
    expect(await noSideScroll(page)).toBe(true);
  });
}
