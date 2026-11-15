import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';

const V = { laptop: { width: 1280, height: 800 }, phone: { width: 393, height: 852 } };
const seed = JSON.stringify({ version: 1, range: { lowMidi: 45, highMidi: 64, assessedAt: new Date().toISOString() }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });

const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });

for (const [label, v] of Object.entries(V)) {
  const c = await b.newContext({ viewport: v, ignoreHTTPSErrors: true, isMobile: label === 'phone', hasTouch: label === 'phone', deviceScaleFactor: label === 'phone' ? 2 : 1 });
  await c.addInitScript((s) => { if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', s); }, seed);
  const p = await c.newPage();
  const url = `${appUrl()}#/dev/attempt`;
  await p.goto(url, { waitUntil: 'networkidle' });

  console.log(`\n=== ${label} (${v.width}x${v.height}) ===`);

  // Check overflow
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('Horizontal overflow:', overflow);

  // Get all text content
  const bodyText = await p.evaluate(() => document.body.innerText);
  console.log('\n--- Body text ---');
  console.log(bodyText);

  // Get accessibility tree
  const snapshot = await p.accessibility.snapshot();
  console.log('\n--- Accessibility tree ---');
  console.log(JSON.stringify(snapshot, null, 2));

  // Check for specific elements
  const elements = await p.evaluate(() => {
    const results = [];
    // Find all interactive elements
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim().substring(0, 100);
      if (rect.width > 0 && rect.height > 0 && text) {
        results.push({
          tag,
          text: text.substring(0, 80),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          borderRadius: computed.borderRadius,
          display: computed.display,
          position: computed.position,
          visibility: computed.visibility,
          opacity: computed.opacity,
          ariaLabel: el.getAttribute('aria-label'),
          dataTestId: el.getAttribute('data-testid'),
          className: el.className?.substring?.(0, 50) || ''
        });
      }
    }
    return results;
  });

  console.log('\n--- All elements with bounding boxes ---');
  for (const el of elements) {
    console.log(`${el.tag} [${el.width}x${el.height}] pos=(${el.x},${el.y}) text="${el.text}" fontSize=${el.fontSize} color=${el.color} bg=${el.backgroundColor} aria=${el.ariaLabel} data=${el.dataTestId}`);
  }

  // Check for piano keyboard
  const pianoKeys = await p.evaluate(() => {
    const keys = document.querySelectorAll('[class*="key"], [class*="piano"], [class*="note"]');
    return Array.from(keys).map(k => ({
      tag: k.tagName,
      text: (k.textContent || '').trim().substring(0, 30),
      width: Math.round(k.getBoundingClientRect().width),
      height: Math.round(k.getBoundingClientRect().height),
      className: k.className?.substring?.(0, 50) || ''
    }));
  });
  console.log('\n--- Piano keys ---');
  console.log(JSON.stringify(pianoKeys, null, 2));

  // Check for range markers
  const rangeMarkers = await p.evaluate(() => {
    const markers = document.querySelectorAll('[class*="range"], [class*="marker"], [class*="limit"]');
    return Array.from(markers).map(m => ({
      tag: m.tagName,
      text: (m.textContent || '').trim().substring(0, 50),
      width: Math.round(m.getBoundingClientRect().width),
      height: Math.round(m.getBoundingClientRect().height),
      className: m.className?.substring?.(0, 50) || ''
    }));
  });
  console.log('\n--- Range markers ---');
  console.log(JSON.stringify(rangeMarkers, null, 2));

  // Check for exercise dropdown
  const selects = await p.evaluate(() => {
    const sels = document.querySelectorAll('select');
    return Array.from(sels).map(s => ({
      text: (s.textContent || '').trim().substring(0, 50),
      width: Math.round(s.getBoundingClientRect().width),
      height: Math.round(s.getBoundingClientRect().height),
      className: s.className?.substring?.(0, 50) || ''
    }));
  });
  console.log('\n--- Select elements ---');
  console.log(JSON.stringify(selects, null, 2));

  // Check for buttons
  const buttons = await p.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"], a');
    return Array.from(btns).map(b => ({
      text: (b.textContent || '').trim().substring(0, 50),
      width: Math.round(b.getBoundingClientRect().width),
      height: Math.round(b.getBoundingClientRect().height),
      className: b.className?.substring?.(0, 50) || '',
      tag: b.tagName
    }));
  });
  console.log('\n--- Buttons/links ---');
  console.log(JSON.stringify(buttons, null, 2));

  await c.close();
}

await b.close();
