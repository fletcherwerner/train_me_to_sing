import { expect, test } from '@playwright/test';

test('range assessment flow with sim=range:45,64', async ({ page }) => {
  // Navigate with range simulation: low=45 (A2), high=64 (E4)
  // The app should redirect to /range because no range is set
  await page.goto('/#/range?sim=range:45,64');

  // Step 1: Intro
  await expect(page.getByRole('heading', { name: 'Vocal Range Assessment' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

  // Click Start
  await page.getByRole('button', { name: 'Start' }).click();

  // Step 2: Lowest — find it (with Record button)
  await expect(page.getByText('Sing your lowest comfortable note and hold it.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Piano keyboard' })).toBeVisible();

  // The synthetic source outputs 45 (A2) until "Use this" is clicked
  // Wait for the note name to appear (A2)
  await page.waitForSelector('.range-note-name', { timeout: 5000 });
  await expect(page.locator('.range-note-name')).toHaveText('A2');

  // Click Record to start the countdown
  await page.getByRole('button', { name: 'Record' }).click();

  // Step 3: Lowest — recording window
  // Wait for countdown to finish (3s countdown + 3s recording = ~6s)
  await page.waitForSelector('.range-result-label', { timeout: 10000 });

  // Step 4: Lowest result — should show A2 (45)
  await expect(page.getByText('Lowest note: A2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use this' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

  // Click "Use this" (switches synthetic source to 64/E4)
  await page.getByRole('button', { name: 'Use this' }).click();

  // Step 5: Highest — find it (with Record button)
  await expect(page.getByText('Now sing your highest comfortable note and hold it.')).toBeVisible();

  // The synthetic source now outputs 64 (E4)
  await page.waitForSelector('.range-note-name', { timeout: 5000 });
  await expect(page.locator('.range-note-name')).toHaveText('E4');

  // Click Record
  await page.getByRole('button', { name: 'Record' }).click();

  // Wait for recording to finish (~6s)
  await page.waitForSelector('.range-result-label', { timeout: 10000 });

  // Step 6: Highest result — should show E4 (64)
  await expect(page.getByText('Highest note: E4')).toBeVisible();

  // Click Continue
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 7: Confirm screen
  await expect(page.getByText('Your range: A2 – E4 (19 semitones)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Redo' })).toBeVisible();

  // Click Save
  await page.getByRole('button', { name: 'Save' }).click();

  // Step 8: Should be redirected to home
  await expect(page.getByText('Your range:')).toBeVisible();
  await expect(page.getByText('A2 – E4')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Redo range test' })).toBeVisible();
});

test('range assessment: stays silent during recording window', async ({ page }) => {
  // Navigate with range simulation
  await page.goto('/#/range?sim=range:45,64');

  // Start the flow
  await page.getByRole('button', { name: 'Start' }).click();

  // Click Record
  await page.getByRole('button', { name: 'Record' }).click();

  // During the recording window, the progress bar should be visible
  await expect(page.locator('.range-progress-fill')).toBeVisible();

  // Wait for the result
  await page.waitForSelector('.range-result-label', { timeout: 10000 });
});
