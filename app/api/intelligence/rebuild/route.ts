import { NextRequest, NextResponse } from 'next/server';
import { enrichProvidersWithFreeSources } from '../../../../lib/free-health-intel';
import { enrichReportIntelligence } from '../../../../lib/intelligence-policy';
import { getReport, saveReport } from '../../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { reportId?: string; save?: boolean };
    if (!body.reportId) return NextResponse.json({ error: 'reportId is required.' }, { status: 400 });
    const report = await getReport(body.reportId);
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const competitors = report.analyses.map((analysis) => ({ name: analysis.name, url: analysis.url, market: analysis.market }));
    const enrichment = await enrichProvidersWithFreeSources(competitors);
    const rebuilt = enrichReportIntelligence({
      ...report,
      providerEnrichment: enrichment.providerEnrichment,
      geographicSignals: enrichment.geographicSignals,
      externalDataSummary: enrichment.externalDataSummary
    }, report.sourceHealth || []);

    if (body.save !== false) await saveReport(rebuilt);
    return NextResponse.json({ ok: true, route: '/api/intelligence/rebuild', report: rebuilt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Intelligence rebuild failed.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/intelligence/rebuild',
    message: 'Intelligence rebuild route is active. Use POST with reportId to refresh provider and geography enrichment.'
  });
}
