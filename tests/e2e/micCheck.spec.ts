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

const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const size of [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
]) {
  test(`mic check shows the level and catches the held note (${size.name})`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await seed(page);
    await page.goto('/#/?sim=const:60');
    await page.getByTestId('home-mic-check').click();
    await expect(page.getByRole('heading', { name: 'Mic check' })).toBeVisible();
    await expect(page.getByText('None yet.')).toBeVisible();

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByTestId('mic-status')).toHaveText('We can hear you.');
    await expect(page.getByTestId('mic-now')).toHaveText('C4');
    const level = Number(await page.getByTestId('mic-level').getAttribute('aria-valuenow'));
    expect(level).toBeGreaterThan(50);
    await expect(page.getByTestId('mic-last')).toHaveText('C4', { timeout: 5000 });
    expect(await noSideScroll(page)).toBe(true);

    // The caught note stays after Stop.
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByTestId('mic-level')).toHaveCount(0);
    await expect(page.getByTestId('mic-last')).toHaveText('C4');
    await expect(page.getByTestId('mic-caught').locator('li')).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText('None yet.')).toBeVisible();
  });
}

test('settings links to the mic check', async ({ page }) => {
  await seed(page);
  await page.goto('/#/settings');
  await page.getByRole('link', { name: 'Mic check' }).click();
  await expect(page.getByRole('heading', { name: 'Mic check' })).toBeVisible();
});
