import type { AdvantageMatrix, GrowthMap, MarketArea, MatrixCell } from '../../lib/intelligence-views';
import type { EvidenceItem, Finding, IntelligenceReport, SubserviceFinding } from '../../lib/types';

export type EvidenceDigest = {
  id: string;
  competitorName: string;
  competitorUrl?: string;
  serviceLine: string;
  subservice?: string;
  confidence: string;
  evidenceStrength: string;
  recommendedUse: string;
  fieldRisk: string;
  sourceUrl?: string;
  sourceTitle?: string;
  excerpt: string;
  safeLanguage: string;
  avoidLanguage: string;
};

export type CompetitorEvidenceSummary = {
  name: string;
  rawName: string;
  url: string;
  pagesReviewed: number;
  serviceOverlapScore: number;
  subserviceDepthScore: number;
  andwellDifferentiationScore: number;
  threatLevel: string;
  strongestMatches: string[];
  strongestAdvantages: string[];
  evidenceCount: number;
  highConfidenceCount: number;
  sourcePages: { title: string; url: string; excerpt: string }[];
  evidence: EvidenceDigest[];
};

export type CapabilityEvidenceSummary = {
  capability: string;
  andwellBaseline: string;
  matches: number;
  related: number;
  advantages: number;
  evidenceLimited: number;
  evidenceCount: number;
  strongestCompetitors: string[];
  topEvidence: EvidenceDigest[];
  safeTalkTrack: string;
  avoidLanguage: string;
  cells: MatrixCell[];
};

export type MarketTerritoryView = {
  area: string;
  signal: MarketArea['signal'];
  x: number;
  y: number;
  priority: 'High' | 'Medium' | 'Evidence limited';
  scores: {
    growth: number;
    saturation: number;
    advantage: number;
    referral: number;
    partnership: number;
    payer: number;
    confidence: number;
    field: number;
  };
  competitors: string[];
  capabilities: string[];
  evidence: EvidenceDigest[];
  sourceToAdd: string;
  safeTalkTrack: string;
  avoidLanguage: string;
  nextMove: string;
};

export type FieldGuidanceView = {
  id: string;
  capability: string;
  competitorName: string;
  marketArea: string;
  priority: 'High' | 'Medium' | 'Guarded';
  evidenceBasis: string;
  safeTalkTrack: string;
  whatNotToSay: string;
  referralQuestion: string;
  nextMove: string;
  confidence: string;
  sourceUrl?: string;
};

export type ExecutiveOutputView = {
  summary: string;
  marketSignal: string;
  andwellOpportunity: string;
  matrixSummary: string;
  growthMapSummary: string;
  evidenceReviewed: string;
  strategicImplications: string;
  recommendedActions: { label: string; detail: string; priority: string }[];
};

export type IntelligenceDisplayModel = {
  hasReport: boolean;
  package: {
    generatedAt?: string;
    competitors: number;
    pages: number;
    capabilities: number;
    evidencePoints: number;
    sourceSnapshots: number;
    highConfidencePercent: number;
    mediumConfidencePercent: number;
    guardedPercent: number;
    qualityScore: number;
  };
  evidenceDigest: EvidenceDigest[];
  competitors: CompetitorEvidenceSummary[];
  capabilities: CapabilityEvidenceSummary[];
  territories: MarketTerritoryView[];
  fieldGuidance: FieldGuidanceView[];
  executive: ExecutiveOutputView;
};

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function clip(value: string | undefined, fallback: string, max = 180) {
  const clean = (value || fallback).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}...`;
}

function cleanCompetitorName(value: string | undefined) {
  return (value || 'Competitor')
    .replace(/\s*\|+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Competitor';
}

function cleanDisplayText(value: string | undefined, fallback: string, competitorName?: string) {
  const rawName = competitorName || '';
  const cleanName = cleanCompetitorName(rawName);
  const source = rawName
    ? (value || fallback).replace(new RegExp(rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cleanName)
    : (value || fallback);
  return clip(source
    .replace(/\s+\|\s+/g, ' | ')
    .replace(/\s*\|\s*([,.])/g, '$1')
    .replace(/\s*\|\s*$/g, ''), fallback, 340);
}

function titleCaseArea(value: string) {
  if (!value) return 'Evidence Limited';
  if (value.toLowerCase() === 'maine') return 'Maine Statewide';
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function confidenceRank(value: string) {
  if (value === 'High') return 4;
  if (value === 'Moderate') return 3;
  if (value === 'Low') return 2;
  return 1;
}

function evidenceFromReportItem(item: EvidenceItem): EvidenceDigest {
  return {
    id: item.id,
    competitorName: cleanCompetitorName(item.competitorName),
    competitorUrl: item.competitorUrl,
    serviceLine: item.serviceLine,
    subservice: item.subservice,
    confidence: item.confidence,
    evidenceStrength: item.evidenceStrength,
    recommendedUse: item.recommendedUse,
    fieldRisk: item.fieldRisk,
    sourceUrl: item.sourceUrl,
    sourceTitle: item.sourceTitle,
    excerpt: cleanDisplayText(item.excerpt, 'Source evidence is available for this output.', item.competitorName),
    safeLanguage: cleanDisplayText(item.safeLanguage, 'Use source-backed language and avoid overclaiming.', item.competitorName),
    avoidLanguage: cleanDisplayText(item.avoidLanguage, 'Do not make claims that are not supported by reviewed public sources.', item.competitorName)
  };
}

function evidenceFromFinding(report: IntelligenceReport, finding: Finding | SubserviceFinding): EvidenceDigest {
  const analysis = report.analyses.find((item) => item.name === finding.competitorName);
  return {
    id: finding.id,
    competitorName: cleanCompetitorName(finding.competitorName),
    competitorUrl: analysis?.url,
    serviceLine: finding.serviceLine,
    subservice: 'subservice' in finding ? finding.subservice : undefined,
    confidence: finding.confidence,
    evidenceStrength: finding.evidenceStrength || 'Weak',
    recommendedUse: finding.recommendedUse || 'Use with guardrails',
    fieldRisk: finding.fieldRisk || 'Medium',
    sourceUrl: finding.sourceUrl,
    sourceTitle: finding.sourceTitle,
    excerpt: cleanDisplayText(finding.evidenceExcerpt, 'Reviewed public source evidence is limited for this output.', finding.competitorName),
    safeLanguage: cleanDisplayText(finding.safeSalesWording, 'Use source-backed language and avoid overclaiming.', finding.competitorName),
    avoidLanguage: cleanDisplayText(finding.avoidSaying, 'Do not make claims that are not supported by reviewed public sources.', finding.competitorName)
  };
}

function buildEvidenceDigest(report: IntelligenceReport | null) {
  if (!report) return [];
  const materialized = report.evidenceItems?.map(evidenceFromReportItem) || [];
  const fallback = [...report.allFindings, ...report.allSubserviceFindings].map((item) => evidenceFromFinding(report, item));
  const items = materialized.length ? materialized : fallback;
  return items
    .filter((item) => item.excerpt || item.safeLanguage || item.sourceUrl)
    .sort((a, b) =>
      confidenceRank(b.confidence) - confidenceRank(a.confidence) ||
      (b.sourceUrl ? 1 : 0) - (a.sourceUrl ? 1 : 0) ||
      b.excerpt.length - a.excerpt.length
    );
}

function areaCoordinates(area: string, index: number) {
  const normalized = area.toLowerCase();
  const known: Record<string, { x: number; y: number }> = {
    cumberland: { x: 52, y: 63 },
    portland: { x: 46, y: 70 },
    'york county': { x: 39, y: 79 },
    york: { x: 39, y: 79 },
    bangor: { x: 67, y: 33 },
    midcoast: { x: 59, y: 49 },
    lewiston: { x: 49, y: 54 },
    auburn: { x: 48, y: 55 },
    'maine statewide': { x: 58, y: 58 },
    'evidence limited': { x: 78, y: 55 }
  };
  const matchKey = Object.keys(known).find((key) => normalized.includes(key));
  if (matchKey) return known[matchKey];
  return {
    x: 28 + ((index * 17) % 56),
    y: 30 + ((index * 19) % 45)
  };
}

function buildCompetitors(report: IntelligenceReport | null, evidence: EvidenceDigest[]): CompetitorEvidenceSummary[] {
  if (!report) return [];
  return report.analyses.map((analysis) => {
    const score = report.competitorScores.find((item) => item.competitorId === analysis.id || item.competitorName === analysis.name);
    const displayName = cleanCompetitorName(analysis.name);
    const competitorEvidence = evidence.filter((item) => item.competitorName === displayName);
    return {
      name: displayName,
      rawName: analysis.name,
      url: analysis.url,
      pagesReviewed: analysis.pagesReviewed.length,
      serviceOverlapScore: score?.serviceLineMatchScore || 0,
      subserviceDepthScore: score?.subserviceDepthScore || 0,
      andwellDifferentiationScore: score?.andwellDifferentiationScore || 0,
      threatLevel: score?.threatLevel || 'Evidence limited',
      strongestMatches: score?.strongestMatches?.slice(0, 5) || [],
      strongestAdvantages: score?.strongestAndwellAdvantages?.slice(0, 5) || [],
      evidenceCount: competitorEvidence.length,
      highConfidenceCount: competitorEvidence.filter((item) => item.confidence === 'High').length,
      sourcePages: analysis.pagesReviewed.slice(0, 5).map((page) => ({
        title: clip(page.title, 'Source page', 80),
        url: page.url,
        excerpt: clip(page.excerpt, 'Readable public source content was reviewed.', 180)
      })),
      evidence: competitorEvidence.slice(0, 8)
    };
  }).sort((a, b) => b.evidenceCount - a.evidenceCount);
}

function buildCapabilities(matrix: AdvantageMatrix, evidence: EvidenceDigest[]): CapabilityEvidenceSummary[] {
  return matrix.rows.map((row) => {
    const cells = row.cells;
    const topEvidence = evidence.filter((item) => item.serviceLine === row.capability).slice(0, 6);
    const firstCell = cells.find((cell) => cell.evidenceCount > 0) || cells[0];
    return {
      capability: row.capability,
      andwellBaseline: row.andwellBaseline,
      matches: cells.filter((cell) => cell.status === 'Confirmed match').length,
      related: cells.filter((cell) => cell.status === 'Related capability').length,
      advantages: cells.filter((cell) => cell.status === 'Andwell advantage').length,
      evidenceLimited: cells.filter((cell) => cell.status === 'Evidence limited' || cell.status === 'Not clearly found').length,
      evidenceCount: cells.reduce((sum, cell) => sum + cell.evidenceCount, 0),
      strongestCompetitors: cells
        .filter((cell) => cell.status === 'Confirmed match' || cell.status === 'Related capability')
        .slice(0, 5)
        .map((cell) => cell.competitorName),
      topEvidence,
      safeTalkTrack: clip(firstCell?.safeTalkTrack, `Lead with Andwell capability depth in ${row.capability}.`, 250),
      avoidLanguage: clip(firstCell?.avoidLanguage, 'Do not make unsupported competitor absence or superiority claims.', 220),
      cells
    };
  }).sort((a, b) => b.advantages - a.advantages || b.evidenceCount - a.evidenceCount);
}

function territoryEvidence(area: MarketArea, evidence: EvidenceDigest[]) {
  const areaWords = area.area.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
  const areaCompetitors = area.competitors.map(cleanCompetitorName);
  const byCompetitor = evidence.filter((item) => areaCompetitors.includes(item.competitorName));
  const byArea = evidence.filter((item) => areaWords.some((word) => `${item.excerpt} ${item.sourceTitle || ''} ${item.sourceUrl || ''}`.toLowerCase().includes(word)));
  const merged = [...byArea, ...byCompetitor];
  return Array.from(new Map(merged.map((item) => [item.id, item])).values()).slice(0, 8);
}

function buildTerritories(growthMap: GrowthMap, evidence: EvidenceDigest[]): MarketTerritoryView[] {
  return growthMap.areas.map((area, index) => {
    const coords = areaCoordinates(area.area, index);
    const selectedEvidence = territoryEvidence(area, evidence);
    return {
      area: titleCaseArea(area.area),
      signal: area.signal,
      x: coords.x,
      y: coords.y,
      priority: area.signal === 'Evidence Limited' ? 'Evidence limited' : area.fieldFocusPriority >= 65 ? 'High' : 'Medium',
      scores: {
        growth: area.growthOpportunityScore,
        saturation: area.saturationScore,
        advantage: area.andwellAdvantageScore,
        referral: area.referralSourcePotential,
        partnership: area.partnershipPotential,
        payer: area.payerValuePotential,
        confidence: area.evidenceConfidence,
        field: area.fieldFocusPriority
      },
      competitors: Array.from(new Set(area.competitors.map(cleanCompetitorName))),
      capabilities: area.capabilities,
      evidence: selectedEvidence,
      sourceToAdd: area.sourceToAdd,
      safeTalkTrack: area.safeTalkTrack,
      avoidLanguage: area.avoidLanguage,
      nextMove: area.nextMove
    };
  });
}

function buildFieldGuidance(report: IntelligenceReport | null, evidence: EvidenceDigest[], territories: MarketTerritoryView[]): FieldGuidanceView[] {
  if (!report) return [];
  return evidence.slice(0, 18).map((item, index) => {
    const territory = territories.find((area) => area.competitors.includes(item.competitorName)) || territories[index % Math.max(1, territories.length)];
    return {
      id: item.id,
      capability: item.serviceLine,
      competitorName: item.competitorName,
      marketArea: territory?.area || 'Evidence Limited',
      priority: item.confidence === 'High' ? 'High' : item.confidence === 'Moderate' ? 'Medium' : 'Guarded',
      evidenceBasis: item.excerpt,
      safeTalkTrack: item.safeLanguage,
      whatNotToSay: item.avoidLanguage,
      referralQuestion: `For ${item.serviceLine}, what patient complexity or access gap is hardest to solve right now?`,
      nextMove: territory?.nextMove || 'Use this source-backed language in field planning.',
      confidence: item.confidence,
      sourceUrl: item.sourceUrl
    };
  });
}

function buildExecutive(report: IntelligenceReport | null, matrix: AdvantageMatrix, growthMap: GrowthMap, territories: MarketTerritoryView[], evidence: EvidenceDigest[]): ExecutiveOutputView {
  if (!report) {
    return {
      summary: 'Evidence intelligence is ready to build from public sources.',
      marketSignal: 'Market signal will populate after the first source package.',
      andwellOpportunity: 'Andwell opportunity will be based on capability comparison and source-backed geography.',
      matrixSummary: 'Advantage Matrix will compare Andwell capabilities against competitor public evidence.',
      growthMapSummary: 'Growth Map will identify market opportunity, saturation, and field focus zones.',
      evidenceReviewed: 'No public sources have been processed yet.',
      strategicImplications: 'Build intelligence from public sources first.',
      recommendedActions: []
    };
  }
  const topTerritory = territories[0];
  const topCompetitor = report.competitorScores[0];
  return {
    summary: clip(report.aiLeadershipSummary || report.executiveSummary, 'Latest intelligence package is available.', 420),
    marketSignal: topCompetitor
      ? `${topCompetitor.competitorName} shows ${topCompetitor.threatLevel.toLowerCase()} with ${topCompetitor.serviceLineMatchScore}% service-line overlap and ${topCompetitor.subserviceDepthScore}% subservice depth.`
      : `${report.competitorsAnalyzed} competitors were reviewed across ${report.pagesReviewed} public pages.`,
    andwellOpportunity: topTerritory
      ? `${topTerritory.area}: ${topTerritory.safeTalkTrack}`
      : 'Use the strongest capability and evidence signals to focus field and leadership action.',
    matrixSummary: `${matrix.summary.capabilitiesMapped} capabilities mapped, ${matrix.summary.competitorsCompared} competitors compared, ${matrix.summary.advantageSignals} Andwell advantage signals, and ${matrix.summary.evidenceLimited} evidence-limited cells.`,
    growthMapSummary: `${growthMap.areas.length} market area${growthMap.areas.length === 1 ? '' : 's'} modeled: ${territories.slice(0, 5).map((area) => area.area).join(', ') || 'Evidence Limited'}.`,
    evidenceReviewed: `${report.pagesReviewed} public pages and ${evidence.length} source-backed evidence items are available.`,
    strategicImplications: report.expertBrief?.leadershipDecision || report.readiness?.nextAction || 'Use guarded, source-backed language for field and leadership planning.',
    recommendedActions: (report.recommendedActions || []).slice(0, 5).map((action) => ({
      label: action.label,
      detail: action.detail,
      priority: action.priority
    }))
  };
}

export function buildIntelligenceDisplayModel(report: IntelligenceReport | null, matrix: AdvantageMatrix, growthMap: GrowthMap): IntelligenceDisplayModel {
  const evidence = buildEvidenceDigest(report);
  const strong = evidence.filter((item) => item.evidenceStrength === 'Strong' || item.confidence === 'High').length;
  const moderate = evidence.filter((item) => item.evidenceStrength === 'Moderate' || item.confidence === 'Moderate').length;
  const guarded = evidence.filter((item) => item.recommendedUse === 'Use with guardrails' || item.recommendedUse === 'Investigate first').length;
  const territories = buildTerritories(growthMap, evidence);

  return {
    hasReport: Boolean(report),
    package: {
      generatedAt: report?.generatedAt,
      competitors: report?.competitorsAnalyzed || 0,
      pages: report?.pagesReviewed || 0,
      capabilities: matrix.summary.capabilitiesMapped || 0,
      evidencePoints: evidence.length,
      sourceSnapshots: report?.sourceSnapshots?.length || report?.analyses.reduce((sum, analysis) => sum + analysis.pagesReviewed.length, 0) || 0,
      highConfidencePercent: percent(strong, evidence.length),
      mediumConfidencePercent: percent(moderate, evidence.length),
      guardedPercent: percent(guarded, evidence.length),
      qualityScore: report?.packageMetrics?.qualityScore || report?.readiness?.score || 0
    },
    evidenceDigest: evidence,
    competitors: buildCompetitors(report, evidence),
    capabilities: buildCapabilities(matrix, evidence),
    territories,
    fieldGuidance: buildFieldGuidance(report, evidence, territories),
    executive: buildExecutive(report, matrix, growthMap, territories, evidence)
  };
}
