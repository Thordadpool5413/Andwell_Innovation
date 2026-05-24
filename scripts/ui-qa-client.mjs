import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, devices } from 'playwright';

const baseUrl = process.env.UI_QA_BASE_URL || 'http://127.0.0.1:4401';
const outDir = path.join(process.cwd(), '.codex-run', 'ui-qa');
const tabs = [
  'Build Intelligence',
  'Advantage Matrix',
  'Growth Map',
  'Intelligence Library',
  'Strategy',
  'AI Coach',
  'Executive Report'
];

async function runViewport(name, contextOptions) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const loc = msg.location();
      errors.push(`${msg.text()} @ ${loc.url || 'unknown'}`);
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);

  const shots = [];
  await page.screenshot({ path: path.join(outDir, `${name}-home.png`), fullPage: true });
  shots.push(`${name}-home.png`);

  for (const tab of tabs) {
    const menuButton = page.getByRole('button', { name: /open navigation/i }).first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click({ timeout: 5000 });
      await page.waitForTimeout(250);
    }
    const button = page.getByRole('button', { name: new RegExp(tab, 'i') }).first();
    await button.scrollIntoViewIfNeeded();
    try {
      await button.click({ timeout: 10000, force: true });
    } catch {
      await button.focus();
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(600);
    const safe = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await page.screenshot({ path: path.join(outDir, `${name}-${safe}.png`), fullPage: true });
    shots.push(`${name}-${safe}.png`);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await browser.close();
  return { name, overflow, errors, screenshots: shots };
}

await mkdir(outDir, { recursive: true });
const desktop = await runViewport('desktop', { viewport: { width: 1440, height: 1024 } });
const mobile = await runViewport('mobile', { ...devices['iPhone 13'] });
const report = { baseUrl, generatedAt: new Date().toISOString(), desktop, mobile };
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
