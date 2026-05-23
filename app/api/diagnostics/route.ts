import { NextResponse } from 'next/server';
import { calculateAIGovernanceSummary, calculateStoredReadiness } from '../../../lib/intelligence-policy';
import { readStore } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await readStore();
  const latest = store.reports[0] || null;
  const readiness = latest ? calculateStoredReadiness(latest) : null;
  const aiGovernance = latest ? calculateAIGovernanceSummary(latest) : null;
  return NextResponse.json({
    ok: true,
    route: '/api/diagnostics',
    message: 'Next.js API routes are active.',
    data: {
      competitors: store.competitors.length,
      reports: store.reports.length,
      catalogOverrides: store.catalogOverrides.length,
      latestReportId: latest?.id || null,
      latestReportGeneratedAt: latest?.generatedAt || null,
      readiness,
      aiGovernance,
      externalDataSummary: latest?.externalDataSummary || null,
      recentScanJobs: store.scanJobs.slice(0, 10).map((job) => ({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        endedAt: job.endedAt || null,
        progress: job.progress,
        warningCount: job.warnings.length,
        errorCount: job.errors.length
      })),
      sourceHealth: latest?.sourceHealth?.map((source) => ({
        url: source.url || source.input,
        status: source.status,
        reason: source.reason,
        pagesReviewed: source.pagesReviewed || 0
      })) || []
    },
    checkedAt: new Date().toISOString()
  });
}
