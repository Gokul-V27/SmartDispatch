import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  
  page.on('response', async resp => {
    if (resp.url().includes('/api/')) {
      console.log('API Response:', resp.url(), resp.status());
    }
  });

  await page.goto('http://localhost:3000');
  
  try {
    await page.fill('input[type="email"]', 'admin@smartdispatch.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
  } catch(e) {}

  await browser.close();
})();
