import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Andwell Innovation Command Center',
    version: 'andwell-innovation-standalone-bootstrap-2026-05-19-01',
    message: 'If this route returns this exact version, the active deployment is serving the latest command center build.',
    expectedServer: 'Node.js Next server',
    checkedAt: new Date().toISOString()
  });
}
