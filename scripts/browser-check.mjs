import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const executablePath = process.env.BROWSER_BIN || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!executablePath) throw new Error('Set BROWSER_BIN to installed Chromium browser');
const url = process.env.DSH_WEB_URL || 'http://127.0.0.1:11567';
const output = path.resolve(root, process.env.BROWSER_CHECK_OUTPUT || 'artifacts/browser-check');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const report = { kind: 'real-gui', url, authenticated: false, entryFound: false, panelOpened: false, pageErrors: [], consoleErrors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text().slice(0, 300)); });
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    report.httpStatus = response?.status();
    await page.locator('body').waitFor();
    await page.waitForFunction(() => document.body.innerText.trim().length > 0, { timeout: 10000 }).catch(() => {});
    report.title = await page.title();
    report.visibleText = (await page.locator('body').innerText()).slice(0, 1200);
    const entry = page.getByRole('button', { name: '剧本工具', exact: true }).or(page.getByText('剧本工具', { exact: true })).first();
    report.entryFound = await entry.isVisible().catch(() => false);
    if (report.entryFound) {
      await entry.click();
      report.panelOpened = await page.getByRole('heading', { name: /^(剧本工具|剧本工作台)$/ }).isVisible().catch(() => false);
      report.authenticated = report.panelOpened;
    }
    if (!report.panelOpened) report.blockedReason = /token|令牌|认证|登录|unauth|forbidden|访问码/i.test(report.visibleText) || [401,403].includes(report.httpStatus) ? 'Authentication required; no account credentials were accessed.' : 'Plugin entry/panel was not observable in this fresh browser context.';
    await page.screenshot({ path: path.join(output, 'real-gui.png'), fullPage: true });
  } catch (error) { report.blockedReason = error.message; }
} finally { await browser.close(); }
await writeFile(path.join(output, 'real-gui-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.pageErrors.length) process.exitCode = 1;
