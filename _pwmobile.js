const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Monthly History');
  await page.waitForTimeout(400);
  await page.locator('.monthly-breakdown').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'C:/Users/amjad/Desktop/calude/_mobile-history.png', fullPage: true });

  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
