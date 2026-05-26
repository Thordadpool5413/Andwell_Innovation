import { NextRequest, NextResponse } from 'next/server';
import { materializeReportIntelligence } from '../../../lib/report-materialization';
import { readStore } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const checkedAt = new Date().toISOString();
  try {
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId') || undefined;
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 100)));
    const store = await readStore();
    const report = reportId
      ? store.reports.find((item) => item.id === reportId)
      : store.reports[0];
    const materialized = report ? materializeReportIntelligence(report) : null;
    const baseItems = reportId
      ? store.evidenceItems.filter((item) => item.reportId === reportId)
      : store.evidenceItems;
    const sourceItems = baseItems.length ? baseItems : materialized?.evidenceItems || [];
    const evidenceItems = sourceItems
      .filter((item) => {
        if (!query) return true;
        return `${item.competitorName} ${item.serviceLine} ${item.subservice || ''} ${item.excerpt} ${item.safeLanguage}`.toLowerCase().includes(query);
      })
      .slice(0, limit);

    return NextResponse.json({
      ok: true,
      route: '/api/evidence',
      reportId: materialized?.id || reportId || null,
      total: sourceItems.length,
      evidenceItems,
      checkedAt
    });
  } catch {
    return NextResponse.json({
      ok: false,
      route: '/api/evidence',
      error: 'Evidence service temporarily unavailable.',
      checkedAt
    }, { status: 500 });
  }
}
