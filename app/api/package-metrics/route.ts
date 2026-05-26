import { NextResponse } from 'next/server';
import { materializeReportIntelligence } from '../../../lib/report-materialization';
import { readStore } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const store = await readStore();
    const materializedReports = store.reports.slice(0, 25).map(materializeReportIntelligence);
    const computed = materializedReports.map((report) => report.packageMetrics).filter(Boolean);
    const stored = store.packageMetrics || [];
    const byReport = new Map([...stored, ...computed].map((metric) => [metric!.reportId, metric!]));
    const trends = [...byReport.values()].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)).slice(0, 25);

    return NextResponse.json({
      ok: true,
      route: '/api/package-metrics',
      latest: trends[0] || null,
      trends,
      checkedAt
    });
  } catch {
    return NextResponse.json({
      ok: false,
      route: '/api/package-metrics',
      error: 'Package metrics service temporarily unavailable.',
      checkedAt
    }, { status: 500 });
  }
}
