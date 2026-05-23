import { NextRequest, NextResponse } from 'next/server';
import { enrichProvidersWithFreeSources } from '../../../../lib/free-health-intel';
import { getReport, readStore } from '../../../../lib/store';
import type { CompetitorInput } from '../../../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { reportId?: string; competitors?: CompetitorInput[] };
    const report = body.reportId ? await getReport(body.reportId) : null;
    const store = await readStore();
    const competitors = body.competitors?.length
      ? body.competitors
      : report?.analyses.map((analysis) => ({ name: analysis.name, url: analysis.url, market: analysis.market }))
        || store.competitors;
    if (!competitors.length) {
      return NextResponse.json({ error: 'No competitors available for geographic enrichment.' }, { status: 400 });
    }
    const payload = await enrichProvidersWithFreeSources(competitors.slice(0, 25));
    return NextResponse.json({
      ok: true,
      route: '/api/enrich/geography',
      geographicSignals: payload.geographicSignals,
      externalDataSummary: payload.externalDataSummary
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Geographic enrichment failed.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/enrich/geography',
    message: 'Geographic enrichment is active with Census geocoder and free provider-source location signals.'
  });
}
