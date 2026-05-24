import { NextResponse } from 'next/server';
import { isAIExtractionConfigured, getAITransportDiagnostics } from '../../../lib/ai-extractor';
import { isMongoConfigured } from '../../../lib/mongodb';
import { isSupabaseConfigured } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

export async function GET() {
  try {
    const ai = getAITransportDiagnostics();
    return NextResponse.json({
      ok: true,
      route: '/api/runtime',
      nodeVersion: process.version,
      nextRuntime: 'nodejs',
      persistence: {
        supabaseConfigured: isSupabaseConfigured(),
        mongoConfigured: isMongoConfigured(),
        localJsonFallback: true
      },
      ai: {
        configured: isAIExtractionConfigured(),
        model: ai.model,
        transport: ai.transport
      },
      limits: {
        crawlMaxPagesPerSite: Math.max(4, Math.min(35, numberFromEnv('CRAWL_MAX_PAGES_PER_SITE', 8))),
        analyzeConcurrency: Math.max(1, Math.min(8, numberFromEnv('ANALYZE_CONCURRENCY', 8))),
        maxCompetitorsPerScan: Math.max(1, Math.min(25, numberFromEnv('ANALYZE_MAX_COMPETITORS', 25)))
      },
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      route: '/api/runtime',
      error: error instanceof Error ? error.message : 'Runtime diagnostics unavailable.',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}
