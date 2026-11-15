import { chromium } from '@playwright/test';
const out = 'comms/E03/turn-01/screenshots/';
const VP = { laptop: { width: 1280, height: 800 }, phone: { width: 393, height: 852 } };
const b = await chromium.launch();
async function run(name, vp, sim, dark, fail) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light', hasTouch: name.startsWith('phone') });
  const page = await ctx.newPage();
  const s = async (n) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: out + name + '-' + n + '.png' });
    const m = await page.evaluate(() => [document.documentElement.scrollWidth > innerWidth, document.documentElement.scrollHeight - innerHeight]);
    console.log(name, n, 'hscroll', m[0], 'vover', m[1]);
  };
  await page.goto('https://localhost:5173/#/?sim=' + sim);
  await s('1-intro');
  await page.getByRole('button', { name: 'Start' }).click();
  await s('2-find');
  await page.getByRole('button', { name: 'Record' }).click();
  await page.waitForTimeout(1300); await s('3-countdown');
  await page.waitForTimeout(3000); await s('3b-recording');
  if (fail) { await page.waitForTimeout(3500); await s('4-fail'); await ctx.close(); return; }
  await page.getByRole('button', { name: 'Use this' }).waitFor({ timeout: 8000 }); await s('4-result');
  await page.getByRole('button', { name: 'Use this' }).click();
  await s('5-find-high');
  await page.getByRole('button', { name: 'Record' }).click();
  await page.getByRole('button', { name: 'Use this' }).waitFor({ timeout: 12000 }); await s('6-result-high');
  await page.getByRole('button', { name: 'Use this' }).click();
  await s('7-confirm');
  for (let i = 0; i < 14; i++) await page.getByRole('button', { name: 'Raise the low note' }).click();
  await s('8-confirm-warn');
  await page.getByRole('button', { name: 'Save' }).click();
  await s('9-home');
  await ctx.close();
}
await run('laptop', VP.laptop, 'range:45,64');
await run('phone', VP.phone, 'range:45,64');
await run('phone-dark', VP.phone, 'range:45,64', true);
await run('laptop-dark', VP.laptop, 'range:45,64', true);
await run('phone-silent', VP.phone, 'silent', false, true);
await b.close();
