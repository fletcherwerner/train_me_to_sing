import { chromium } from 'playwright';
import fs from 'node:fs';
import { appUrl } from '../../../../harness/lib/app-url.mjs';

const out = new URL('../screenshots/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const at = '2025-01-01T00:00:00.000Z';
const seedData = (progress) => ({
  version: 1,
  range: { lowMidi: 45, highMidi: 64, assessedAt: at },
  settings: { latencyOffsetMs: 0 },
  progress,
  importedLessons: [],
});
const prog = {
  's1-02': { passed: true, bestScore: 1, attempts: 2, lastAttemptAt: at },
  's2-01': { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: at },
  's1b-01': { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: at, level: 'prove' },
  's1b-02': { passed: false, bestScore: 0.9, attempts: 1, lastAttemptAt: at, level: 'practise' },
  's1b-03': { passed: false, bestScore: 0.6, attempts: 1, lastAttemptAt: at },
};
const sizes = [
  ['laptop', 1280, 800, false],
  ['phone', 393, 852, false],
  ['phone-dark', 393, 852, true],
];
const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
for (const [sfx, w, h, dark] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await page.addInitScript(([p]) => {
    if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(p));
  }, [seedData(prog)]);
  const base = appUrl();
  const shot = async (name) => {
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + name + '-' + sfx + '.png', fullPage: true });
  };
  const sw = async (name) =>
    console.log(sfx, name, 'noSideScroll', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  const start = () => page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.goto(base + '/#/');
  await shot('home');
  await sw('home');
  await page.goto(base + '/#/lesson/s1a-02?sim=perfect');
  await shot('match-intro');
  if (dark) {
    await page.goto(base + '/#/lesson/s1b-04?sim=perfect');
    await start();
    await page.waitForTimeout(500);
    await shot('b04-ido');
    await ctx.close();
    continue;
  }
  await page.getByTestId('run-button').click();
  await page.waitForTimeout(3500);
  await shot('match-run');
  await sw('match-run');
  await page.getByTestId('results-score').waitFor({ timeout: 70000 });
  await shot('match-results');
  await sw('match-results');
  await page.goto(base + '/#/lesson/s1a-03?sim=silent');
  await shot('match3-intro');
  await page.getByTestId('run-button').click();
  await page.getByTestId('results-score').waitFor({ timeout: 150000 });
  await shot('match3-silent-results');
  await page.goto(base + '/#/lesson/s1b-04?sim=perfect');
  await shot('b04-intro');
  await start();
  await shot('b04-ido');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Repeat' }).waitFor({ timeout: 25000 });
  await shot('b04-ido-done');
  await page.getByRole('button', { name: 'Next' }).click();
  await shot('b04-wedo');
  await page.getByRole('button', { name: 'Sing along' }).click();
  await page.getByTestId('practice-line').waitFor({ timeout: 25000 });
  await shot('b04-wedo-done');
  await page.getByRole('button', { name: 'Next' }).click();
  await shot('b04-youdo-learn');
  await start();
  await page.waitForTimeout(6500);
  await shot('b04-learn-run');
  await page.getByTestId('results-verdict').waitFor({ timeout: 40000 });
  await shot('b04-learn-results');
  await sw('learn-results');
  await page.getByTestId('advance-level').click();
  await shot('b04-practise-start');
  await start();
  await page.waitForTimeout(7000);
  await shot('b04-practise-run');
  await sw('practise-run');
  await page.getByTestId('results-verdict').waitFor({ timeout: 40000 });
  await shot('b04-practise-results');
  await page.getByTestId('advance-level').click();
  await shot('b04-prove-start');
  await start();
  await page.waitForTimeout(7000);
  await shot('b04-prove-run');
  await sw('prove-run');
  await page.getByTestId('results-verdict').waitFor({ timeout: 40000 });
  await shot('b04-prove-results');
  console.log(sfx, 'echo button count at prove results', await page.getByTestId('echo-button').count());
  await ctx.close();
}
await browser.close();
