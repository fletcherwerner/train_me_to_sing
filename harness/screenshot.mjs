#!/usr/bin/env node
// Captures screenshots of app routes at laptop and iPhone sizes for the UI reviewer.
// Requires the dev server (node harness/dev-server.mjs start) and @playwright/test installed (from E01).
// The address comes from --base, else $APP_URL, else the server dev-server.mjs started, else https://localhost:5173.
//
// node harness/screenshot.mjs --out comms/E03/turn-01/screenshots --routes "/,/range" \
//   [--range 45,64] [--sim perfect] [--dark] [--base <url>] [--wait 800]

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { appUrl } from './lib/app-url.mjs';

const VIEWPORTS = {
  laptop: { width: 1280, height: 800 },
  phone: { width: 393, height: 852 },
};

function parseArgs(argv) {
  const args = { base: appUrl(), routes: '/', wait: '800' };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[name] = true;
    } else {
      args[name] = next;
      i++;
    }
  }
  return args;
}

function slug(route) {
  const s = route.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '');
  return s || 'home';
}

const args = parseArgs(process.argv.slice(2));
if (!args.out) {
  console.error('Missing --out <directory>');
  process.exit(1);
}

const routes = String(args.routes).split(',').map((r) => r.trim()).filter(Boolean);
await mkdir(args.out, { recursive: true });

// Matches StoredData in planning/01-architecture.md.
let seed = null;
if (args.range) {
  const [lowMidi, highMidi] = String(args.range).split(',').map(Number);
  seed = JSON.stringify({
    version: 1,
    range: { lowMidi, highMidi, assessedAt: new Date().toISOString() },
    settings: { latencyOffsetMs: 0 },
    progress: {},
    importedLessons: [],
  });
}

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});

let failed = false;
for (const [label, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
    colorScheme: args.dark ? 'dark' : 'light',
    isMobile: label === 'phone',
    hasTouch: label === 'phone',
    deviceScaleFactor: label === 'phone' ? 3 : 1,
  });
  if (seed) {
    await context.addInitScript((value) => {
      if (!window.localStorage.getItem('tmts.v1')) window.localStorage.setItem('tmts.v1', value);
    }, seed);
  }
  const page = await context.newPage();
  page.on('pageerror', (err) => console.error(`[${label}] page error: ${err.message}`));

  for (const route of routes) {
    // The sim option is a query string, which must come before the hash.
    const query = args.sim ? `?sim=${encodeURIComponent(args.sim)}` : '';
    const url = `${args.base}/${query}#${route.startsWith('/') ? route : `/${route}`}`;
    const file = path.join(args.out, `${slug(route)}-${label}${args.dark ? '-dark' : ''}.png`);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(Number(args.wait));
      await page.screenshot({ path: file, fullPage: true });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      console.log(`${file}${overflow ? '  (horizontal overflow detected)' : ''}`);
    } catch (err) {
      failed = true;
      console.error(`Failed ${url}: ${err.message}`);
    }
  }
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
