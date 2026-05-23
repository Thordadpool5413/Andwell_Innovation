import { NextResponse } from 'next/server';
import { readStore } from '../../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await readStore();
  const latest = store.reports[0] || null;
  const summary = latest?.externalDataSummary || null;
  return NextResponse.json({
    ok: true,
    route: '/api/intelligence/sources',
    message: 'External healthcare intelligence sources are configured for enrichment workflows.',
    data: {
      providersEnriched: summary?.providersEnriched || 0,
      providerMatches: summary?.providerMatches || 0,
      geographicSignals: summary?.geographicSignals || 0,
      lastEnrichedAt: summary?.lastEnrichedAt || null,
      sourceCatalog: [
        { id: 'cms_hospice', label: 'CMS Hospice General Information', free: true },
        { id: 'cms_home_health', label: 'CMS Home Health National Data', free: true },
        { id: 'nppes', label: 'NPPES NPI Registry', free: true },
        { id: 'census_geocoder', label: 'US Census Geocoder', free: true }
      ]
    },
    checkedAt: new Date().toISOString()
  });
}
