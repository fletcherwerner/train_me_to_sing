// Renders public/icons/icon.svg to the PNG icons. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
// Maskable: shrink artwork into the central safe zone on a full-bleed background.
const maskable = svg.replace(
  /<rect width="512" height="512" fill="#1f3a5f"\/>([\s\S]*)<\/svg>/,
  '<rect width="512" height="512" fill="#1f3a5f"/><g transform="translate(76.8 76.8) scale(0.7)">$1</g></svg>',
);
const jobs = [
  ['icon-192.png', svg, 192],
  ['icon-512.png', svg, 512],
  ['icon-maskable-512.png', maskable, 512],
  ['apple-touch-icon.png', svg, 180],
  // iOS app icon (Capacitor shell); opaque, 1024 px, as the asset catalog requires.
  ['../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', svg, 1024],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, markup, size] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
  writeFileSync(`public/icons/${name}`, await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } }));
}
// iOS launch screen: the icon centred on the icon's background colour (shown scaled by the storyboard).
const splashDir = 'ios/App/App/Assets.xcassets/Splash.imageset';
await page.setViewportSize({ width: 2732, height: 2732 });
await page.setContent(
  `<style>html,body{margin:0;background:#1f3a5f}svg{position:absolute;left:866px;top:866px;width:1000px;height:1000px}</style>${svg}`,
);
const splash = await page.screenshot({ clip: { x: 0, y: 0, width: 2732, height: 2732 } });
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  writeFileSync(`${splashDir}/${f}`, splash);
}
await browser.close();
