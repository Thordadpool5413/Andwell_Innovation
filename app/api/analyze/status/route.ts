import { NextRequest, NextResponse } from 'next/server';
import { getReport, getScanJob } from '../../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
    const job = await getScanJob(jobId);
    if (!job) return NextResponse.json({ error: 'Scan job not found.' }, { status: 404 });
    const report = job.reportId ? await getReport(job.reportId) : null;
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
