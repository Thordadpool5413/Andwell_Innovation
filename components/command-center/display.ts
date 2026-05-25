import type { AdvantageMatrix, GrowthMap } from '../../lib/intelligence-views';
import type { IntelligenceReport } from '../../lib/types';

export type IntelligencePackageView = {
  hasReport: boolean;
  packageLabel: string;
  generatedAt?: string;
  competitors: number;
  pages: number;
  capabilities: number;
  evidencePoints: number;
  safeLanguageItems: number;
  highConfidencePercent: number;
  mediumConfidencePercent: number;
  guardedPercent: number;
  topCompetitors: string[];
  strongestCapabilities: string[];
};

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export function buildPackageView(report: IntelligenceReport | null, matrix: AdvantageMatrix): IntelligencePackageView {
  const allItems = report ? [...report.allFindings, ...report.allSubserviceFindings] : [];
  const strong = allItems.filter((item) => item.evidenceStrength === 'Strong' || item.confidence === 'High').length;
  const moderate = allItems.filter((item) => item.evidenceStrength === 'Moderate' || item.confidence === 'Moderate').length;
  const guarded = allItems.filter((item) => item.recommendedUse === 'Use with guardrails' || item.recommendedUse === 'Investigate first').length;

  return {
    hasReport: Boolean(report),
    packageLabel: report ? 'Latest intelligence package' : 'Intelligence engine ready',
    generatedAt: report?.generatedAt,
    competitors: report?.competitorsAnalyzed || 0,
    pages: report?.pagesReviewed || 0,
    capabilities: matrix.summary.capabilitiesMapped || 0,
    evidencePoints: allItems.length,
    safeLanguageItems: allItems.filter((item) => item.safeSalesWording).length,
    highConfidencePercent: percent(strong, allItems.length),
    mediumConfidencePercent: percent(moderate, allItems.length),
    guardedPercent: percent(guarded, allItems.length),
    topCompetitors: report?.analyses.slice(0, 4).map((analysis) => analysis.name) || [],
    strongestCapabilities: report?.allFindings
      .filter((finding) => finding.competitorStatus === 'Not found publicly' || finding.recommendedUse === 'Use confidently')
      .slice(0, 5)
      .map((finding) => finding.serviceLine) || []
  };
}

export function buildOutcomePreview(report: IntelligenceReport | null, matrix: AdvantageMatrix, growthMap: GrowthMap) {
  const packageView = buildPackageView(report, matrix);
  return [
    {
      title: 'Advantage Matrix',
      detail: report
        ? `${matrix.summary.capabilitiesMapped} capabilities compared across ${matrix.summary.competitorsCompared} competitors.`
        : 'Capability comparison surface is ready for the first intelligence package.',
      meta: report ? `${matrix.summary.advantageSignals} advantage signals` : 'Baseline loaded'
    },
    {
      title: 'Growth Map',
      detail: report
        ? `${growthMap.summary.fieldFocusZones.slice(0, 3).join(', ') || 'Market areas ranked from source evidence.'}`
        : 'Market opportunity engine is ready to connect source and geography signals.',
      meta: report ? `${growthMap.areas.length} market areas` : 'Opportunity model loaded'
    },
    {
      title: 'Field Guidance',
      detail: report
        ? `${packageView.safeLanguageItems} safe language items generated for field conversations.`
        : 'Field-ready talk tracks will appear after the first intelligence build.',
      meta: report ? `${packageView.guardedPercent}% guarded-use signals` : 'Guardrails active'
    },
    {
      title: 'Executive Report',
      detail: report
        ? 'Leadership-ready summary, market signal, field guidance, and recommended next actions are available.'
        : 'Executive output is prepared once public source evidence is processed.',
      meta: report ? `${packageView.pages} pages reviewed` : 'Report model loaded'
    }
  ];
}
