const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:3000';

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: path.join(
      process.env.LOCALAPPDATA,
      'ms-playwright/chromium-1208/chrome-win64/chrome.exe'
    ),
    headless: true,
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Dashboard (unauthenticated — redirects to login)
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login-page.png'), fullPage: true });
  console.log('1/7 Login page');

  // 2. Register page
  await page.goto(`${BASE}/auth/register`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-register-page.png'), fullPage: true });
  console.log('2/7 Register page');

  // 3. Register validation errors
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-register-validation.png'), fullPage: true });
  console.log('3/7 Register validation');

  // 4. Register a test user
  await page.goto(`${BASE}/auth/register`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="name"]', 'Назар Степаненко');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Password123');
  await page.fill('input[name="confirmPassword"]', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Should redirect to dashboard
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-dashboard.png'), fullPage: true });
  console.log('4/7 Dashboard');

  // 5. Accounts page
  await page.goto(`${BASE}/accounts`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-accounts.png'), fullPage: true });
  console.log('5/7 Accounts');

  // 6. Transactions page
  await page.goto(`${BASE}/transactions`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-transactions.png'), fullPage: true });
  console.log('6/7 Transactions');

  // 7. Mobile view (navbar collapsed)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-mobile-dashboard.png'), fullPage: true });
  console.log('7/7 Mobile dashboard');

  await browser.close();
  console.log('\nAll screenshots saved to docs/screenshots/');
}

main().catch(err => { console.error(err); process.exit(1); });
