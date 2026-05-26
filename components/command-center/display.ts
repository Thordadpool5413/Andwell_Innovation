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

export type MatrixPreviewRow = {
  serviceLine: string;
  andwellDepth: number;
  marketDepth: number;
  advantage: number;
};

export type GrowthPreviewPoint = {
  label: string;
  x: number;
  y: number;
  tone: 'teal' | 'amber' | 'green';
};

export type FieldGuidancePreview = {
  title: string;
  detail: string;
  priority: 'High' | 'Medium';
};

export type ExecutiveSnapshot = {
  headline: string;
  detail: string;
  threat: string;
  opportunity: string;
};

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function clip(value: string | undefined, fallback: string, max = 118) {
  const clean = (value || fallback).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}...`;
}

export function buildPackageView(report: IntelligenceReport | null, matrix: AdvantageMatrix): IntelligencePackageView {
  const allItems = report ? [...report.allFindings, ...report.allSubserviceFindings] : [];
  const strong = allItems.filter((item) => item.evidenceStrength === 'Strong' || item.confidence === 'High').length;
  const moderate = allItems.filter((item) => item.evidenceStrength === 'Moderate' || item.confidence === 'Moderate').length;
  const guarded = allItems.filter((item) => item.recommendedUse === 'Use with guardrails' || item.recommendedUse === 'Investigate first').length;

  return {
    hasReport: Boolean(report),
    packageLabel: report ? 'Latest intelligence package' : 'Evidence intelligence ready',
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

export function buildMatrixPreviewRows(report: IntelligenceReport | null, matrix: AdvantageMatrix): MatrixPreviewRow[] {
  if (!report) return [];
  return matrix.rows.slice(0, 5).map((row) => {
    const matches = row.cells.filter((cell) => cell.status === 'Confirmed match' || cell.status === 'Related capability').length;
    const advantages = row.cells.filter((cell) => cell.status === 'Andwell advantage').length;
    const marketDepth = percent(matches, Math.max(1, row.cells.length));
    const andwellDepth = Math.max(76, Math.min(94, 80 + advantages * 3 + matches));
    return {
      serviceLine: clip(row.capability, row.capability, 22),
      andwellDepth,
      marketDepth,
      advantage: Math.max(8, andwellDepth - marketDepth)
    };
  });
}

export function buildGrowthPreviewPoints(report: IntelligenceReport | null, growthMap: GrowthMap): GrowthPreviewPoint[] {
  if (!report || !growthMap.areas.length) return [];
  return growthMap.areas.slice(0, 6).map((area, index) => ({
    label: clip(area.area, 'Market area', 22),
    x: Math.max(12, Math.min(88, area.andwellAdvantageScore)),
    y: Math.max(14, Math.min(86, 100 - area.saturationScore + index * 3)),
    tone: area.signal === 'Evidence Limited' ? 'amber' : area.growthOpportunityScore > 70 ? 'green' : 'teal'
  }));
}

export function buildFieldGuidancePreview(report: IntelligenceReport | null): FieldGuidancePreview[] {
  if (!report) return [];
  return report.allFindings.slice(0, 3).map((finding, index) => ({
    title: clip(`Lead with ${finding.serviceLine}`, finding.serviceLine, 58),
    detail: clip(
      `${finding.competitorName}: ${finding.usageGuidance || finding.safeSalesWording || finding.evidenceExcerpt}`,
      'Use source-backed language and stay within evidence guardrails.',
      118
    ),
    priority: index < 2 ? 'High' : 'Medium'
  }));
}

export function buildExecutiveSnapshot(report: IntelligenceReport | null): ExecutiveSnapshot {
  if (report) {
    const threat = report.competitorScores[0]?.competitorName || report.analyses[0]?.name || 'Market overlap';
    const opportunity = report.readiness?.nextAction || report.recommendedActions?.[0]?.label || 'Use matrix and map signals to focus the next growth move.';
    return {
      headline: clip(report.executiveSummary, 'Source-backed market intelligence package is available.', 120),
      detail: `${report.pagesReviewed} public pages reviewed across ${report.competitorsAnalyzed} competitors.`,
      threat: clip(threat, 'Market overlap', 42),
      opportunity: clip(opportunity, 'Use matrix and map signals to focus the next growth move.', 82)
    };
  }
  return {
    headline: 'Evidence intelligence ready',
    detail: 'Build intelligence from public sources first.',
    threat: 'Market signals will be ranked from public evidence.',
    opportunity: 'Growth opportunities appear after the first build.'
  };
}
