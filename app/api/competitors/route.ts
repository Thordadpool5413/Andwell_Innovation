import { NextRequest, NextResponse } from 'next/server';
import { deleteCompetitor, readStore, saveCompetitors } from '../../../lib/store';
import { parseAllowedHostPatterns, validatePublicHttpUrl } from '../../../lib/url-safety';
import type { CompetitorInput } from '../../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

function sanitizeCompetitor(competitor: CompetitorInput): CompetitorInput | null {
  const result = validatePublicHttpUrl(normalizeUrl(competitor.url.trim()), parseAllowedHostPatterns(process.env.CRAWL_ALLOWED_HOSTS));
  if (!result.ok || !result.url) return null;
  return {
    ...competitor,
    url: result.url,
    name: competitor.name?.trim() || undefined,
    market: competitor.market?.trim() || 'Evidence limited',
    notes: competitor.notes?.slice(0, 1000)
  };
}

export async function GET() {
  try {
    const store = await readStore();
    return NextResponse.json({ competitors: store.competitors });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      route: '/api/competitors',
      error: error instanceof Error ? error.message : 'Competitor service unavailable.',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { competitors?: CompetitorInput[] };
    const competitors = (body.competitors || [])
      .filter((competitor) => competitor.url?.trim())
      .slice(0, 100)
      .map(sanitizeCompetitor)
      .filter((competitor): competitor is CompetitorInput => Boolean(competitor));
    const store = await saveCompetitors(competitors);
    return NextResponse.json({ competitors: store.competitors });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      route: '/api/competitors',
      error: error instanceof Error ? error.message : 'Competitor update failed.',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { url?: string };
    const url = body.url?.trim();
    if (!url) return NextResponse.json({ error: 'url is required.' }, { status: 400 });
    const store = await deleteCompetitor(normalizeUrl(url));
    return NextResponse.json({ competitors: store.competitors });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      route: '/api/competitors',
      error: error instanceof Error ? error.message : 'Competitor deletion failed.',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}
