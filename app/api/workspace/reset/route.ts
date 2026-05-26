import { NextRequest, NextResponse } from 'next/server';
import { resetWorkspaceStore } from '../../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isLocalRequest(req: NextRequest) {
  const host = req.headers.get('host') || '';
  return host.startsWith('127.0.0.1') || host.startsWith('localhost') || host.startsWith('[::1]');
}

function resetEnabled(req: NextRequest) {
  return process.env.CIH_ENABLE_WORKSPACE_RESET === 'true' || process.env.NODE_ENV !== 'production' || isLocalRequest(req);
}

export async function POST(req: NextRequest) {
  if (!resetEnabled(req)) {
    return NextResponse.json(
      {
        ok: false,
        route: '/api/workspace/reset',
        error: 'Workspace reset is not enabled for this environment.',
        checkedAt: new Date().toISOString()
      },
      { status: 403 }
    );
  }

  try {
    const store = await resetWorkspaceStore();
    return NextResponse.json({
      ok: true,
      cleared: {
        competitors: store.competitors.length,
        reports: store.reports.length,
        scanJobs: store.scanJobs.length,
        evidenceItems: store.evidenceItems.length,
        sourceSnapshots: store.sourceSnapshots.length,
        packageMetrics: store.packageMetrics.length,
        marketSignals: store.marketSignals.length
      },
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        route: '/api/workspace/reset',
        error: error instanceof Error ? error.message : 'Workspace reset failed.',
        checkedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
