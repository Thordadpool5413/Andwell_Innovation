import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const baseUrl = process.env.API_SMOKE_BASE_URL || process.env.UI_QA_BASE_URL || 'http://127.0.0.1:4401';
const outDir = path.join(process.cwd(), '.codex-run', 'api-smoke');

const checks = [
  { route: '/api/health' },
  { route: '/api/version' },
  { route: '/api/runtime' },
  { route: '/api/diagnostics' },
  { route: '/api/reports' },
  { route: '/api/competitors' },
  { route: '/api/catalog' },
  { route: '/api/analyze' },
  { route: '/api/analyze/status', expectedStatuses: [400, 404] },
  { route: '/api/ask', method: 'POST', body: { question: 'What should leadership know?' } },
  { route: '/api/evidence' },
  { route: '/api/package-metrics' },
  { route: '/api/export/briefing' },
  { route: '/api/qa/release-check' }
];

async function runCheck(check) {
  const startedAt = Date.now();
  const url = `${baseUrl}${check.route}`;
  try {
    const response = await fetch(url, {
      method: check.method || 'GET',
      headers: {
        accept: 'application/json',
        ...(check.body ? { 'content-type': 'application/json' } : {})
      },
      body: check.body ? JSON.stringify(check.body) : undefined
    });
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const isJson = contentType.includes('application/json');
    let parsed = null;
    if (isJson && text) parsed = JSON.parse(text);
    const expectedStatuses = check.expectedStatuses || [200];
    const statusOk = expectedStatuses.includes(response.status);
    return {
      route: check.route,
      ok: statusOk && isJson,
      status: response.status,
      isJson,
      elapsedMs: Date.now() - startedAt,
      preview: isJson ? parsed : text.slice(0, 120)
    };
  } catch (error) {
    return {
      route: check.route,
      ok: false,
      status: 0,
      isJson: false,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

await mkdir(outDir, { recursive: true });
const results = [];
for (const check of checks) {
  results.push(await runCheck(check));
}
const report = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  ok: results.every((item) => item.ok),
  results
};
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
