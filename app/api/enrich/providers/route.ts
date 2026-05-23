import { NextRequest, NextResponse } from 'next/server';
import { enrichProvidersWithFreeSources } from '../../../../lib/free-health-intel';
import { readStore } from '../../../../lib/store';
import type { CompetitorInput } from '../../../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { competitors?: CompetitorInput[] };
    const store = await readStore();
    const competitors = (body.competitors && body.competitors.length ? body.competitors : store.competitors).slice(0, 25);
    if (!competitors.length) {
      return NextResponse.json({ error: 'Add at least one competitor source before running provider enrichment.' }, { status: 400 });
    }
    const payload = await enrichProvidersWithFreeSources(competitors);
    return NextResponse.json({ ok: true, route: '/api/enrich/providers', ...payload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Provider enrichment failed.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/enrich/providers',
    message: 'Provider enrichment is active with free healthcare sources (CMS hospice/home health + NPPES + Census geocoder).'
  });
}
