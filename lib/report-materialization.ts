import { buildAdvantageMatrix, buildGrowthMap } from './intelligence-views';
import type {
  AIRecommendedUse,
  AIReliability,
  EvidenceItem,
  EvidenceStrength,
  FieldRisk,
  Finding,
  IntelligenceReport,
  MarketSignal,
  PackageMetrics,
  QualityCheck,
  SourceSnapshot,
  SubserviceFinding
} from './types';

const maxEvidenceItems = 1500;
const maxSourceSnapshots = 500;

function stableId(parts: Array<string | number | undefined>) {
  return parts
    .map((part) => String(part || 'none').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('_')
    .slice(0, 180);
}

function reliabilityFromConfidence(confidence: string | undefined): AIReliability {
  if (confidence === 'High') return 'High';
  if (confidence === 'Moderate') return 'Medium';
  return 'Low';
}

function recommendedUseFromFinding(finding: Pick<Finding | SubserviceFinding, 'confidence' | 'evidenceStrength' | 'fieldRisk' | 'recommendedUse'>): AIRecommendedUse {
  if (finding.recommendedUse) return finding.recommendedUse;
  if (finding.fieldRisk === 'High' || finding.evidenceStrength === 'Missing') return 'Investigate first';
  if (finding.confidence === 'High' && finding.evidenceStrength === 'Strong') return 'Use confidently';
  if (finding.confidence === 'Not found' || finding.confidence === 'Needs review') return 'Investigate first';
  return 'Use with guardrails';
}

function evidenceStrength(value: EvidenceStrength | undefined): EvidenceStrength {
  return value || 'Weak';
}

function fieldRisk(value: FieldRisk | undefined): FieldRisk {
  return value || 'Medium';
}

function buildFindingEvidence(report: IntelligenceReport, finding: Finding, competitorUrl?: string): EvidenceItem {
  return {
    id: stableId(['evidence', report.id, finding.id]),
    reportId: report.id,
    generatedAt: report.generatedAt,
    competitorName: finding.competitorName,
    competitorUrl,
    serviceLine: finding.serviceLine,
    evidenceStrength: evidenceStrength(finding.evidenceStrength),
    confidence: finding.confidence,
    sourceUrl: finding.sourceUrl,
    sourceTitle: finding.sourceTitle,
    excerpt: finding.evidenceExcerpt,
    safeLanguage: finding.safeSalesWording,
    avoidLanguage: finding.avoidSaying,
    aiReliability: finding.aiReliability || reliabilityFromConfidence(finding.confidence),
    recommendedUse: recommendedUseFromFinding(finding),
    fieldRisk: fieldRisk(finding.fieldRisk)
  };
}

function buildSubserviceEvidence(report: IntelligenceReport, finding: SubserviceFinding, competitorUrl?: string): EvidenceItem {
  return {
    id: stableId(['evidence', report.id, finding.id]),
    reportId: report.id,
    generatedAt: report.generatedAt,
    competitorName: finding.competitorName,
    competitorUrl,
    serviceLine: finding.serviceLine,
    subservice: finding.subservice,
    evidenceStrength: evidenceStrength(finding.evidenceStrength),
    confidence: finding.confidence,
    sourceUrl: finding.sourceUrl,
    sourceTitle: finding.sourceTitle,
    excerpt: finding.evidenceExcerpt,
    safeLanguage: finding.safeSalesWording,
    avoidLanguage: finding.avoidSaying,
    aiReliability: finding.aiReliability || reliabilityFromConfidence(finding.confidence),
    recommendedUse: recommendedUseFromFinding(finding),
    fieldRisk: fieldRisk(finding.fieldRisk)
  };
}

export function buildEvidenceItems(report: IntelligenceReport): EvidenceItem[] {
  const urlByCompetitor = new Map(report.analyses.map((analysis) => [analysis.name, analysis.url]));
  const findings = report.allFindings.map((finding) => buildFindingEvidence(report, finding, urlByCompetitor.get(finding.competitorName)));
  const subservices = report.allSubserviceFindings.map((finding) => buildSubserviceEvidence(report, finding, urlByCompetitor.get(finding.competitorName)));
  return [...findings, ...subservices]
    .filter((item) => item.excerpt || item.sourceUrl || item.safeLanguage)
    .slice(0, maxEvidenceItems);
}

export function buildSourceSnapshots(report: IntelligenceReport): SourceSnapshot[] {
  return report.analyses.flatMap((analysis) => (
    analysis.pagesReviewed.map((page, index) => ({
      id: stableId(['snapshot', report.id, analysis.id, index, page.url]),
      reportId: report.id,
      capturedAt: analysis.analyzedAt || report.generatedAt,
      competitorName: analysis.name,
      competitorUrl: analysis.url,
      pageUrl: page.url,
      title: page.title,
      excerpt: page.excerpt,
      textLength: page.text.length
    }))
  )).slice(0, maxSourceSnapshots);
}

export function buildMarketSignals(report: IntelligenceReport): MarketSignal[] {
  const matrix = buildAdvantageMatrix(report);
  const growthMap = buildGrowthMap(report, matrix);
  return growthMap.areas.map((area) => ({
    id: stableId(['market', report.id, area.area, area.signal]),
    reportId: report.id,
    generatedAt: report.generatedAt,
    areaName: area.area,
    signal: area.signal,
    growthOpportunityScore: area.growthOpportunityScore,
    saturationScore: area.saturationScore,
    andwellAdvantageScore: area.andwellAdvantageScore,
    evidenceConfidence: area.evidenceConfidence,
    fieldFocusPriority: area.fieldFocusPriority,
    competitors: area.competitors,
    capabilities: area.capabilities,
    safeTalkTrack: area.safeTalkTrack,
    nextMove: area.nextMove
  }));
}

function containsUnsafeSuperiority(text: string) {
  const normalized = text.toLowerCase();
  return [
    'andwell is better',
    'proves andwell wins',
    'competitor does not offer',
    'they cannot provide',
    'owns this market',
    'guaranteed growth'
  ].some((phrase) => normalized.includes(phrase));
}

export function buildQualityChecks(report: IntelligenceReport, evidenceItems = buildEvidenceItems(report), marketSignals = buildMarketSignals(report)): QualityCheck[] {
  const generatedAt = report.generatedAt;
  const missingCitationCount = evidenceItems.filter((item) => !item.sourceUrl && item.confidence !== 'Not found').length;
  const missingGuardrailCount = evidenceItems.filter((item) => !item.safeLanguage || !item.avoidLanguage).length;
  const unsafeClaimCount = [
    report.executiveSummary,
    ...evidenceItems.map((item) => `${item.safeLanguage} ${item.avoidLanguage}`)
  ].filter(containsUnsafeSuperiority).length;

  return [
    {
      id: stableId(['quality', report.id, 'evidence-package']),
      reportId: report.id,
      generatedAt,
      category: 'evidence',
      status: evidenceItems.length ? 'pass' : 'warning',
      severity: evidenceItems.length ? 'low' : 'medium',
      title: 'Evidence package created',
      detail: evidenceItems.length ? `${evidenceItems.length} source-backed evidence items are available.` : 'Additional public source material would strengthen the evidence package.'
    },
    {
      id: stableId(['quality', report.id, 'citations']),
      reportId: report.id,
      generatedAt,
      category: 'citations',
      status: missingCitationCount ? 'warning' : 'pass',
      severity: missingCitationCount ? 'medium' : 'low',
      title: 'Citation coverage checked',
      detail: missingCitationCount ? `${missingCitationCount} evidence items should be strengthened with direct source URLs.` : 'Evidence items include source context for recommendations.'
    },
    {
      id: stableId(['quality', report.id, 'guardrails']),
      reportId: report.id,
      generatedAt,
      category: 'field_language',
      status: missingGuardrailCount ? 'warning' : 'pass',
      severity: missingGuardrailCount ? 'medium' : 'low',
      title: 'Field language guardrails checked',
      detail: missingGuardrailCount ? `${missingGuardrailCount} evidence items need stronger safe-language guardrails.` : 'Safe language and what-not-to-say guidance are present.'
    },
    {
      id: stableId(['quality', report.id, 'claims']),
      reportId: report.id,
      generatedAt,
      category: 'claims',
      status: unsafeClaimCount ? 'fail' : 'pass',
      severity: unsafeClaimCount ? 'high' : 'low',
      title: 'Unsupported claim screen completed',
      detail: unsafeClaimCount ? `${unsafeClaimCount} output sections include language that should be rewritten before field use.` : 'No obvious unsupported superiority or absence claims were detected.'
    },
    {
      id: stableId(['quality', report.id, 'market-signals']),
      reportId: report.id,
      generatedAt,
      category: 'market_signal',
      status: marketSignals.length ? 'pass' : 'warning',
      severity: marketSignals.length ? 'low' : 'medium',
      title: 'Market signal package created',
      detail: marketSignals.length ? `${marketSignals.length} market signal areas are available for Growth Map and Strategy.` : 'Add public location or service-area sources to strengthen market signal history.'
    }
  ];
}

export function buildPackageMetrics(
  report: IntelligenceReport,
  evidenceItems = buildEvidenceItems(report),
  sourceSnapshots = buildSourceSnapshots(report),
  marketSignals = buildMarketSignals(report),
  qualityChecks = buildQualityChecks(report, evidenceItems, marketSignals)
): PackageMetrics {
  const highReliabilityCount = evidenceItems.filter((item) => item.aiReliability === 'High').length;
  const guardedUseCount = evidenceItems.filter((item) => item.recommendedUse === 'Use with guardrails').length;
  const investigateCount = evidenceItems.filter((item) => item.recommendedUse === 'Investigate first' || item.recommendedUse === 'Avoid claim').length;
  const failedChecks = qualityChecks.filter((check) => check.status === 'fail').length;
  const warningChecks = qualityChecks.filter((check) => check.status === 'warning').length;
  const evidenceScore = evidenceItems.length ? Math.min(35, Math.round(evidenceItems.length / 8)) : 0;
  const sourceScore = sourceSnapshots.length ? Math.min(25, Math.round(sourceSnapshots.length / 2)) : 0;
  const reliabilityScore = evidenceItems.length ? Math.round((highReliabilityCount / evidenceItems.length) * 25) : 0;
  const checkPenalty = failedChecks * 20 + warningChecks * 5;

  return {
    reportId: report.id,
    generatedAt: report.generatedAt,
    competitorsAnalyzed: report.competitorsAnalyzed,
    pagesReviewed: report.pagesReviewed,
    capabilitiesMapped: report.serviceLinesMapped,
    evidenceItems: evidenceItems.length,
    sourceSnapshots: sourceSnapshots.length,
    marketAreas: marketSignals.length,
    highReliabilityCount,
    guardedUseCount,
    investigateCount,
    qualityScore: Math.max(0, Math.min(100, 40 + evidenceScore + sourceScore + reliabilityScore - checkPenalty))
  };
}

export function materializeReportIntelligence(report: IntelligenceReport): IntelligenceReport {
  const evidenceItems = report.evidenceItems?.length ? report.evidenceItems : buildEvidenceItems(report);
  const sourceSnapshots = report.sourceSnapshots?.length ? report.sourceSnapshots : buildSourceSnapshots(report);
  const marketSignals = report.marketSignals?.length ? report.marketSignals : buildMarketSignals(report);
  const qualityChecks = report.qualityChecks?.length ? report.qualityChecks : buildQualityChecks(report, evidenceItems, marketSignals);
  const packageMetrics = report.packageMetrics || buildPackageMetrics(report, evidenceItems, sourceSnapshots, marketSignals, qualityChecks);

  return {
    ...report,
    evidenceItems,
    sourceSnapshots,
    marketSignals,
    qualityChecks,
    packageMetrics
  };
}
