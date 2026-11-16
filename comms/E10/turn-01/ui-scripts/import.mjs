import { chromium } from 'playwright';
import fs from 'node:fs';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/E10/turn-01/screenshots';
const b = await chromium.launch();
for (const [name, vp] of [['laptop', { width: 1280, height: 800 }], ['phone', { width: 393, height: 852 }]]) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, acceptDownloads: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(appUrl() + '/#/settings');
  await p.waitForSelector('[data-testid=export-button]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-testid=export-button]')]);
  const f = `/tmp/exp-${name}.json`;
  await dl.saveAs(f);
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(name, dl.suggestedFilename());
  fs.writeFileSync('/tmp/bad.json', '{"nope":1}');
  await p.setInputFiles('[data-testid=import-file]', '/tmp/bad.json');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/import-invalid-${name}.png`, fullPage: true });
  j.range = { lowMidi: 40, highMidi: 60, assessedAt: '2026-11-01T00:00:00Z' };
  j.progress = { l1: { passed: true, bestScore: 0.9, attempts: 2, lastAttemptAt: '2026-11-02T00:00:00Z' } };
  fs.writeFileSync('/tmp/good.json', JSON.stringify(j));
  await p.setInputFiles('[data-testid=import-file]', '/tmp/good.json');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/import-summary-${name}.png`, fullPage: true });
  const m = p.getByRole('button', { name: /merge/i });
  if (await m.count()) {
    await m.click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/import-merged-${name}.png`, fullPage: true });
  }
  console.log(name, 'scrollW', await p.evaluate(() => document.documentElement.scrollWidth));
  await ctx.close();
}
await b.close();
