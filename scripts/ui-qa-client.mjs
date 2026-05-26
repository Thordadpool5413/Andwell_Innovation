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
const forbiddenUserModeTerms = [
  'Service check needed',
  'System Health',
  'HTTP 500',
  'HTTP 504',
  'ENOENT',
  '/var/task/.data',
  'not JSON preview',
  'OpenAI unavailable',
  'fallback mode',
  'No report',
  'Needs review',
  'Review queue',
  'Analysis in progress',
  'Competitor Intake',
  'Run Competitive Scan'
];

async function visibleText(page) {
  return page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
}

async function assertNoForbiddenTerms(page, screen) {
  const text = await visibleText(page);
  const hits = forbiddenUserModeTerms.filter((term) => text.includes(term));
  return hits.map((term) => `${screen}: forbidden term "${term}" is visible`);
}

async function assertNoBuildControlsOutsideBuild(page, screen) {
  if (screen === 'Build Intelligence') return [];
  const text = await visibleText(page);
  const problems = [];
  if (/add competitor websites|paste one competitor per line|run scan/i.test(text)) {
    problems.push(`${screen}: build/source-entry language is visible outside Build Intelligence`);
  }
  const sourceTextareas = await page.locator('textarea').evaluateAll((nodes) => nodes.filter((node) => {
    const placeholder = node.getAttribute('placeholder') || '';
    const label = node.getAttribute('aria-label') || '';
    return /source|website|competitor url|public url/i.test(`${placeholder} ${label}`);
  }).length).catch(() => 0);
  if (sourceTextareas > 0) problems.push(`${screen}: source textarea is visible outside Build Intelligence`);
  return problems;
}

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
  const failures = [];
  await page.screenshot({ path: path.join(outDir, `${name}-home.png`), fullPage: true });
  shots.push(`${name}-home.png`);
  failures.push(...await assertNoForbiddenTerms(page, 'Home'));
  failures.push(...await assertNoBuildControlsOutsideBuild(page, 'Home'));

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
    failures.push(...await assertNoForbiddenTerms(page, tab));
    failures.push(...await assertNoBuildControlsOutsideBuild(page, tab));
    if (tab === 'AI Coach') {
      const question = page.getByRole('button', { name: /what should leadership know/i }).first();
      if (await question.isVisible().catch(() => false)) {
        await question.click({ timeout: 5000 }).catch(() => undefined);
        await page.waitForTimeout(800);
      }
      const coachText = await visibleText(page);
      const required = ['Direct answer', 'Evidence basis', 'Safe language', 'Recommended next move'];
      const missing = required.filter((item) => !coachText.includes(item));
      if (missing.length) failures.push(`${tab}: coach answer structure missing ${missing.join(', ')}`);
    }
    if (tab === 'Executive Report') {
      const printButton = await page.getByRole('button', { name: /print report/i }).first().isVisible().catch(() => false);
      if (!printButton) failures.push(`${tab}: print report action is not visible`);
    }
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) failures.push(`${name}: document has horizontal overflow`);
  await browser.close();
  return { name, overflow, errors, failures, screenshots: shots };
}

await mkdir(outDir, { recursive: true });
const desktop = await runViewport('desktop', { viewport: { width: 1440, height: 1024 } });
const mobile = await runViewport('mobile', { ...devices['iPhone 13'] });
const report = { baseUrl, generatedAt: new Date().toISOString(), desktop, mobile };
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
if (desktop.errors.length || mobile.errors.length || desktop.failures.length || mobile.failures.length) process.exit(1);
