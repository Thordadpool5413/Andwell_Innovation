import { NextRequest, NextResponse } from 'next/server';
import { getRuntimeAnalyzeJob } from '../../../../lib/analyze-job-registry';
import { getReport, getScanJob } from '../../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
    const job = await getScanJob(jobId) || getRuntimeAnalyzeJob(jobId);
    if (!job) {
      const match = jobId.match(/^scan_(\d+)_/);
      const createdMs = match ? Number(match[1]) : 0;
      const isRecentScan = Number.isFinite(createdMs) && Date.now() - createdMs < 2 * 60 * 1000;
      if (isRecentScan) {
        return NextResponse.json({
          jobId,
          status: 'queued',
          createdAt: new Date(createdMs).toISOString(),
          inputSummary: { competitors: 0, maxPagesPerSite: 0, useAI: false },
          progress: { done: 0, total: 0 },
          warnings: ['The intelligence build is initializing.'],
          errors: [],
          timing: { elapsedMs: Math.max(0, Date.now() - createdMs), perCompetitorMs: {} },
          report: null
        });
      }
      return NextResponse.json({ error: 'Scan job not found.' }, { status: 404 });
    }
    const runtimeReport = 'report' in job ? job.report : null;
    const report = runtimeReport || (job.reportId ? await getReport(job.reportId) : null);
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      endedAt: job.endedAt,
      inputSummary: job.inputSummary,
      progress: job.progress,
      warnings: job.warnings,
      errors: job.errors,
      timing: job.timing,
      report
    });
  } catch {
    return NextResponse.json({
      ok: false,
      route: '/api/analyze/status',
      error: 'Analysis status service temporarily unavailable.',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}
