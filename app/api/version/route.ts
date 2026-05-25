import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Andwell Innovation Command Center',
    version: 'andwell-innovation-visual-dataflow-recovery-2026-05-25-01',
    buildFingerprint: 'andwell-innovation-main-visual-dataflow-recovery',
    repository: 'Thordadpool5413/Andwell_Innovation',
    message: 'This fingerprint confirms the active deployment is serving the Andwell Innovation frontend and async intelligence workflow.',
    expectedServer: 'Node.js Next server',
    checkedAt: new Date().toISOString()
  });
}
