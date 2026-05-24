import { NextRequest, NextResponse } from 'next/server';
import { calculateAIGovernanceSummary } from '../../../lib/intelligence-policy';
import { getReport, readStore } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const report = await getReport(id);
      if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
      return NextResponse.json({ report });
    }
    const store = await readStore();
    const reports = (store.reports || []).map((report) => {
      const safeGovernance = report.aiGovernance || calculateAIGovernanceSummary(report);
      return {
        id: report.id,
        generatedAt: report.generatedAt,
        competitorsAnalyzed: report.competitorsAnalyzed ?? 0,
        pagesReviewed: report.pagesReviewed ?? 0,
        serviceLinesMapped: report.serviceLinesMapped ?? 0,
        subservicesMapped: report.subservicesMapped ?? 0,
        matchedServiceFindings: report.matchedServiceFindings ?? 0,
        potentialAndwellAdvantages: report.potentialAndwellAdvantages ?? 0,
        aiGovernance: safeGovernance,
        guardrailCount: safeGovernance.guardedUseCount ?? 0,
        competitors: Array.isArray(report.analyses) ? report.analyses.map((analysis) => analysis?.name || 'Competitor') : [],
        executiveSummary: report.executiveSummary || 'Executive summary is being generated from the current source package.'
      };
    });
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        route: '/api/reports',
        error: 'Reports service temporarily unavailable.',
        checkedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
