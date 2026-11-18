import { expect, test, type Page } from '@playwright/test';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { E2E_PROFILES_DIR } from './profilesDir';

test.setTimeout(180_000);
test.beforeAll(() => rmSync(E2E_PROFILES_DIR, { recursive: true, force: true }));

const go = (page: Page, hash: string) => page.evaluate((h) => (location.hash = h), hash);

async function createProfile(page: Page, name: string) {
  await page.getByTestId('profile-name').fill(name);
  await page.getByLabel('Start fresh').check();
  await page.getByTestId('profile-create').click();
  await expect(page.getByRole('heading', { name: 'Vocal Range Assessment' })).toBeVisible();
}

async function setRange(page: Page) {
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Lowest note: A2')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Use this' }).click();
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Highest note: E4')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Use this' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('home-range')).toContainText('A2 – E4');
}

test('profiles: Ana and Ben keep separate ranges and progress, saved to files', async ({ page }) => {
  await page.goto('/#/settings?sim=range:45,64');
  await expect(page.getByTestId('profile-active')).toContainText('No profile');

  // 1. Ana, start fresh, set a range.
  await createProfile(page, 'Ana');
  await setRange(page);
  await expect(page.getByTestId('home-profile')).toContainText('Ana');

  // 2. Pass a lesson with sim=perfect.
  await go(page, '#/lesson/s2-01?sim=perfect');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 30000 });

  // 3. Ben, start fresh: nothing passed.
  await go(page, '#/settings?sim=range:45,64');
  await createProfile(page, 'Ben');
  await setRange(page);
  await expect(page.getByTestId('home-profile')).toContainText('Ben');
  await expect(page.getByTestId('stage-2-count')).toHaveText('0 of 8 passed');

  // 4. Load Ana: range and passed lesson are back.
  await page.getByTestId('home-profile').click();
  await page.getByTestId('profile-ana').click();
  await expect(page.getByTestId('home-profile')).toContainText('Ana');
  await expect(page.getByTestId('home-range')).toContainText('A2 – E4');
  // One pass is "Passed once": mastery needs a second day in a new key (E15).
  await expect(page.getByTestId('stage-2-count')).toHaveText('0 of 8 passed');
  await expect(page.getByTestId('status-s2-01')).toContainText('Passed once');

  // 5. ana.json holds the passed lesson.
  const anaFile = path.join(E2E_PROFILES_DIR, 'ana.json');
  await expect.poll(() => existsSync(anaFile)).toBe(true);
  const ana = JSON.parse(readFileSync(anaFile, 'utf8'));
  expect(ana.data.progress['s2-01'].proofs).toHaveLength(1);
  expect(ana.data.range.lowMidi).toBe(45);
  const ben = JSON.parse(readFileSync(path.join(E2E_PROFILES_DIR, 'ben.json'), 'utf8'));
  expect(ben.data.progress).toEqual({});
});
