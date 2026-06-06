import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('Response status:', response.status());
      console.log('Response headers:', response.headers());
      try {
        const text = await response.text();
        console.log('Response body text:', text);
      } catch (e) {
        console.log('Could not read body text:', e.message);
      }
    }
  });

  await page.goto('http://localhost:3000');
  
  // Try to find the login form
  try {
    await page.fill('input[type="email"]', 'admin@smartdispatch.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for network request to finish
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Login form interaction failed:', e.message);
  }

  await browser.close();
})();
