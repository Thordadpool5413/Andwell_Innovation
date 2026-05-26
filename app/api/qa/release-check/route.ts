import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const forbiddenUserModeTerms = [
  'Service check needed',
  'System Health',
  'HTTP 500',
  'HTTP 504',
  'ENOENT',
  '/var/task/.data',
  'not JSON preview',
  'OpenAI unavailable',
  'fallback mode',
  'No report',
  'Needs review',
  'Review queue'
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/qa/release-check',
    expectedFingerprint: 'andwell-innovation-canonical-package-ui-recovery',
    requiredScripts: [
      'npm run typecheck',
      'npm run build:strict',
      'npm run build',
      'npm audit --omit=dev',
      'npm run qa:api',
      'npm run qa:ui'
    ],
    requiredScreens: [
      'Home',
      'Build Intelligence',
      'Advantage Matrix',
      'Growth Map',
      'Intelligence Library',
      'Strategy',
      'AI Coach',
      'Executive Report'
    ],
    forbiddenUserModeTerms,
    acceptanceCriteria: [
      'Home is read-only and matches the executive intelligence canvas design.',
      'Build Intelligence is the only processing surface.',
      'Completed scans hydrate Matrix, Growth Map, Library, Strategy, Coach, and Report.',
      'Controlled failures return JSON and render as user-safe recovery text.',
      'Browser QA captures desktop and mobile screenshots with no horizontal overflow.',
      'Leadership briefing export returns structured JSON.'
    ],
    checkedAt: new Date().toISOString()
  });
}
