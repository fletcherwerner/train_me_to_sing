// Check tuner page text content at both sizes
import { chromium } from 'playwright';

const sizes = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
];

const urls = [
  'https://localhost:5173/#/dev/tuner?sim=perfect',
  'https://localhost:5173/#/dev/tuner?sim=const%3A60.3',
  'https://localhost:5173/#/dev/tuner',
];

for (const size of sizes) {
  console.log(`\n=== ${size.name} (${size.width}x${size.height}) ===`);
  const browser = await chromium.launch({
    args: [`--window-size=${size.width},${size.height}`],
  });
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    ignoreHTTPSErrors: true,
  });

  for (const url of urls) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(500);

      // Get all text content
      const text = await page.evaluate(() => document.body.innerText);
      console.log(`\n--- ${url.split('?')[1] ? url.split('?')[1].split('&')[0] : 'no sim'} ---`);
      console.log(text.substring(0, 2000));

      // Check specific elements
      const noteText = await page.locator('.tuner-note').first().textContent().catch(() => 'NOT FOUND');
      console.log(`tuner-note text: ${noteText}`);

      const centsText = await page.locator('.cents-meter').first().textContent().catch(() => 'NOT FOUND');
      console.log(`cents-meter text: ${centsText}`);

      const errorText = await page.locator('.tuner-error').first().textContent().catch(() => 'NOT FOUND');
      console.log(`tuner-error text: ${errorText}`);

      const silenceText = await page.locator('.tuner-silence').first().textContent().catch(() => 'NOT FOUND');
      console.log(`tuner-silence text: ${silenceText}`);

      // Check font sizes
      const noteStyle = await page.locator('.tuner-note').first().evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`tuner-note font-size: ${noteStyle}`);

      const startBtn = await page.locator('button').first().textContent().catch(() => 'NOT FOUND');
      console.log(`first button text: ${startBtn}`);

      // Accessibility tree
      const snapshot = await page.accessibility.snapshot();
      const roles = snapshot.children?.map(n => `${n.role}: ${n.name || n.value || ''}`).slice(0, 30) || [];
      console.log(`Accessibility roles: ${JSON.stringify(roles)}`);

    } catch (e) {
      console.log(`Error for ${url}: ${e.message}`);
    }
  }

  await browser.close();
}
