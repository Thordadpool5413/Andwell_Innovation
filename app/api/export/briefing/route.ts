import { NextRequest, NextResponse } from 'next/server';
import { buildAdvantageMatrix, buildGrowthMap } from '../../../../lib/intelligence-views';
import { materializeReportIntelligence } from '../../../../lib/report-materialization';
import { readStore } from '../../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const checkedAt = new Date().toISOString();
  try {
    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId') || undefined;
    const store = await readStore();
    const report = reportId ? store.reports.find((item) => item.id === reportId) : store.reports[0];
    if (!report) {
      return NextResponse.json({
        ok: true,
        route: '/api/export/briefing',
        briefing: null,
        message: 'Build intelligence to create a leadership briefing package.',
        checkedAt
      });
    }

    const materialized = materializeReportIntelligence(report);
    const matrix = buildAdvantageMatrix(materialized);
    const growthMap = buildGrowthMap(materialized, matrix);
    const topArea = growthMap.areas[0];
    const topEvidence = (materialized.evidenceItems || []).slice(0, 8);
    const briefing = {
      title: 'Andwell Intelligence Briefing',
      reportId: materialized.id,
      generatedAt: materialized.generatedAt,
      executiveSummary: materialized.executiveSummary,
      metrics: materialized.packageMetrics,
      matrixSummary: matrix.summary,
      growthMapSummary: growthMap.summary,
      fieldGuidance: topEvidence.map((item) => ({
        capability: item.serviceLine,
        competitor: item.competitorName,
        safeLanguage: item.safeLanguage,
        avoidLanguage: item.avoidLanguage,
        evidenceConfidence: item.confidence,
        recommendedUse: item.recommendedUse
      })),
      payerValueAngle: topArea
        ? `${topArea.area} has payer value potential scored at ${topArea.payerValuePotential}. Keep claims tied to source-backed care complexity and partnership fit.`
        : 'Payer value messaging should remain tied to source-backed complex care evidence.',
      partnershipOpportunity: topArea
        ? `${topArea.area} is the leading current partnership signal. Use care transitions, post acute relationships, and high-acuity community care fit as the framing.`
        : 'Partnership opportunity will strengthen as source evidence adds location and service-area context.',
      recommendedActions: materialized.recommendedActions || [],
      safeLanguageGuardrails: [
        'All claims should stay source-backed.',
        'Do not claim competitor absence from limited public evidence.',
        'Do not use superiority language unless a cited source directly supports it.',
        'Use guarded language when evidence confidence is limited.'
      ],
      canvaSections: [
        { type: 'cover', title: 'Andwell Intelligence Briefing', body: materialized.executiveSummary },
        { type: 'metrics', title: 'Package Metrics', body: materialized.packageMetrics },
        { type: 'matrix', title: 'Advantage Matrix Summary', body: matrix.summary },
        { type: 'map', title: 'Growth Map Summary', body: growthMap.summary },
        { type: 'field-guidance', title: 'Field Guidance', body: topEvidence },
        { type: 'next-actions', title: 'Recommended Next Actions', body: materialized.recommendedActions || [] }
      ]
    };

    return NextResponse.json({
      ok: true,
      route: '/api/export/briefing',
      briefing,
      checkedAt
    });
  } catch {
    return NextResponse.json({
      ok: false,
      route: '/api/export/briefing',
      error: 'Briefing export service temporarily unavailable.',
      checkedAt
    }, { status: 500 });
  }
}
