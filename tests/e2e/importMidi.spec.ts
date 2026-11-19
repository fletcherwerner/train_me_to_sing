import { expect, test } from '@playwright/test';

test.setTimeout(180_000);

const seed = {
  version: 1,
  range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 0 },
  progress: {},
  importedLessons: [],
};

test('sim=perfect: import the fixture, pass it, delete it with its progress', async ({ page }) => {
  await page.addInitScript((d) => {
    if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(d));
  }, seed);
  await page.goto('/#/?sim=perfect');
  await expect(page.getByTestId('my-songs')).toHaveCount(0);
  await page.getByTestId('import-midi-link').click();

  await page.getByTestId('midi-file').setInputFiles('tests/fixtures/c-major-scale.mid');
  await expect(page.getByTestId('track-0')).toContainText('Melody');
  await expect(page.getByTestId('track-0')).toContainText('8 notes');
  await expect(page.getByTestId('track-0-chords')).toHaveCount(0);
  await expect(page.getByTestId('import-title')).toHaveValue('c major scale');
  await expect(page.getByTestId('import-summary')).toContainText('8 notes, span 12 semitones');
  await expect(page.getByTestId('import-fit')).toHaveText('Fits your range');
  await page.getByTestId('import-title').fill('Test scale');
  await page.getByTestId('add-lesson').click();

  await expect(page.getByTestId('my-songs')).toContainText('Test scale');
  const row = page.getByTestId('my-songs').locator('a.home__row');
  await row.click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: /^(Play|Sing along) again$/ })).toBeVisible({ timeout: 40000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  await page.getByRole('button', { name: 'Next' }).click({ timeout: 40000 });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 60000 });
  await page.getByRole('link', { name: 'Back to lessons' }).first().click();
  await expect(page.getByTestId('my-songs')).toContainText('Passed');

  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!));
  const before = await stored();
  expect(before.importedLessons).toHaveLength(1);
  const id = before.importedLessons[0].id as string;
  expect(Object.keys(before.progress)).toContain(id);

  await page.getByTestId(`delete-${id}`).click();
  await page.getByTestId(`confirm-delete-${id}`).click();
  await expect(page.getByTestId('my-songs')).toHaveCount(0);
  const after = await stored();
  expect(after.importedLessons).toHaveLength(0);
  expect(Object.keys(after.progress)).not.toContain(id);
});

test('a file with chords shows the warning; bad files show an error', async ({ page }) => {
  await page.addInitScript((d) => {
    if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(d));
  }, seed);
  await page.goto('/#/import');
  await page.getByTestId('midi-file').setInputFiles({ name: 'bad.mid', mimeType: 'audio/midi', buffer: Buffer.from('nope') });
  await expect(page.getByTestId('midi-error')).toBeVisible();

  await page.getByTestId('midi-file').setInputFiles('tests/fixtures/two-tracks.mid');
  await expect(page.getByTestId('track-1-chords')).toBeVisible();
  await expect(page.getByTestId('track-0-chords')).toHaveCount(0);
  await page.getByTestId('select-1').click();
  await expect(page.getByTestId('add-lesson')).toBeVisible();
  await page.getByTestId('select-0').click();
  await page.getByTestId('import-start-bar').fill('1');
  await page.getByTestId('import-end-bar').fill('1');
  await expect(page.getByTestId('import-summary')).toContainText('4 notes');
});
