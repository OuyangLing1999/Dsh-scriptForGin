import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const executablePath = process.env.BROWSER_BIN || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!executablePath) throw new Error('Set BROWSER_BIN to installed Chromium browser');
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:2855', { waitUntil: 'domcontentloaded' });
  await page.locator('body').waitFor();
  await page.waitForFunction(() => document.body.innerText.trim().length > 0, { timeout: 10000 }).catch(() => {});
  console.log('initial page:', (await page.locator('body').innerText()).slice(0, 600));
  console.log('title:', await page.title());
  console.log('buttons:', await page.locator('button').evaluateAll((elements) => elements.map((e) => ({text:e.textContent?.slice(0,40),label:e.getAttribute('aria-label'),title:e.getAttribute('title')}))));
  console.log('page errors:', errors);
} finally { await browser.close(); }
