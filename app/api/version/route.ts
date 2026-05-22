import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Andwell Innovation Command Center',
    version: 'andwell-innovation-standalone-bootstrap-2026-05-19-01',
    message: 'If this route returns this exact version, Hostinger is running the GitHub main build through the patched standalone Node.js Next server.',
    expectedServer: 'server.js Hostinger Node server',
    checkedAt: new Date().toISOString()
  });
}
