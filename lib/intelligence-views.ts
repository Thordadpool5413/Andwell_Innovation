import { andwellCatalog } from './andwell';
import type { Confidence, EvidenceStrength, FieldRisk, IntelligenceReport } from './types';

export type MatrixStatus = 'Confirmed match' | 'Related capability' | 'Not clearly found' | 'Evidence limited' | 'Andwell advantage';
export type MatrixCell = {
  capability: string;
  competitorName: string;
  status: MatrixStatus;
  confidence: Confidence;
  evidenceCount: number;
  sourceSummary: string;
  safeTalkTrack: string;
  avoidLanguage: string;
  strategicAngle: string;
  fieldQuestion: string;
  nextMove: string;
  evidenceStrength: EvidenceStrength;
  fieldRisk: FieldRisk;
};

export type MatrixRow = { capability: string; andwellBaseline: string; cells: MatrixCell[] };
export type AdvantageMatrix = { rows: MatrixRow[]; competitors: string[]; summary: { capabilitiesMapped: number; competitorsCompared: number; advantageSignals: number; evidenceLimited: number; providerMatches: number; } };

export type GrowthSignal = 'High Growth Opportunity' | 'Competitive Battleground' | 'White Space Opportunity' | 'Partnership Opportunity' | 'Field Focus Zone' | 'Evidence Limited' | 'Over Saturated';
export type MarketArea = {
  area: string;
  signal: GrowthSignal;
  growthOpportunityScore: number;
  saturationScore: number;
  andwellAdvantageScore: number;
  referralSourcePotential: number;
  partnershipPotential: number;
  payerValuePotential: number;
  evidenceConfidence: number;
  fieldFocusPriority: number;
  competitors: string[];
  capabilities: string[];
  safeTalkTrack: string;
  avoidLanguage: string;
  nextMove: string;
  sourceToAdd: string;
};

export type GrowthMap = {
  areas: MarketArea[];
  summary: { topGrowthAreas: string[]; saturatedAreas: string[]; fieldFocusZones: string[]; partnershipAreas: string[]; evidenceLimitedAreas: string[]; geographicSignals: number; };
};

const locationHints = ['maine', 'auburn', 'scarborough', 'lewiston', 'portland', 'york', 'cumberland', 'bangor'];

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

function matrixStatusFromSignals(signal: { competitorStatus: string; confidence: Confidence; evidenceStrength?: EvidenceStrength; fieldRisk?: FieldRisk }): MatrixStatus {
  if (signal.competitorStatus === 'Clearly offered') return 'Confirmed match';
  if (signal.competitorStatus === 'Related but not equivalent') return 'Related capability';
  if (signal.competitorStatus === 'Mentioned only') return 'Evidence limited';
  if (signal.competitorStatus === 'Not found publicly') return 'Andwell advantage';
  return 'Not clearly found';
}

export function buildAdvantageMatrix(report: IntelligenceReport | null): AdvantageMatrix {
  if (!report) return { rows: [], competitors: [], summary: { capabilitiesMapped: andwellCatalog.length, competitorsCompared: 0, advantageSignals: 0, evidenceLimited: 0, providerMatches: 0 } };
  const competitors = report.analyses.map((a) => a.name);
  const rows: MatrixRow[] = andwellCatalog.map((cap) => {
    const cells: MatrixCell[] = report.analyses.map((analysis) => {
      const finding = analysis.findings.find((f) => f.serviceLine === cap.serviceLine);
      const status = finding ? matrixStatusFromSignals(finding) : 'Not clearly found';
      const evidenceCount = finding ? 1 + (finding.subserviceFindings?.filter((s) => s.sourceUrl).length || 0) : 0;
      return {
        capability: cap.serviceLine,
        competitorName: analysis.name,
        status,
        confidence: finding?.confidence || 'Low',
        evidenceCount,
        sourceSummary: finding?.evidenceExcerpt || 'Public source review did not clearly show this as a defined offering.',
        safeTalkTrack: finding?.safeSalesWording || `Andwell can lead with ${cap.serviceLine} when the referral need fits.`,
        avoidLanguage: finding?.avoidSaying || cap.avoid,
        strategicAngle: status === 'Andwell advantage' ? `Lead with Andwell visibility in ${cap.serviceLine}.` : `Position with service-fit language and source-backed evidence in ${cap.serviceLine}.`,
        fieldQuestion: `For ${cap.serviceLine}, what patient complexity is hardest to manage today?`,
        nextMove: status === 'Evidence limited' ? 'Add a direct competitor service page to strengthen confidence.' : 'Use current evidence package in strategy and field coaching.',
        evidenceStrength: finding?.evidenceStrength || 'Missing',
        fieldRisk: finding?.fieldRisk || 'Medium'
      };
    });
    return { capability: cap.serviceLine, andwellBaseline: cap.safeLanguage, cells };
  });
  const flat = rows.flatMap((r) => r.cells);
  return {
    rows,
    competitors,
    summary: {
      capabilitiesMapped: rows.length,
      competitorsCompared: competitors.length,
      advantageSignals: flat.filter((c) => c.status === 'Andwell advantage').length,
      evidenceLimited: flat.filter((c) => c.status === 'Evidence limited' || c.status === 'Not clearly found').length,
      providerMatches: report.externalDataSummary?.providerMatches || report.providerEnrichment?.reduce((sum, item) => sum + item.matches.length, 0) || 0
    }
  };
}

function inferAreaFromReportText(text: string) {
  const hit = locationHints.find((h) => text.toLowerCase().includes(h));
  if (!hit) return 'Evidence Limited';
  return hit === 'maine' ? 'Maine Statewide' : hit.charAt(0).toUpperCase() + hit.slice(1);
}

export function buildGrowthMap(report: IntelligenceReport | null, matrix: AdvantageMatrix): GrowthMap {
  if (!report) {
    return { areas: [{ area: 'Evidence Limited', signal: 'Evidence Limited', growthOpportunityScore: 60, saturationScore: 20, andwellAdvantageScore: 50, referralSourcePotential: 55, partnershipPotential: 58, payerValuePotential: 62, evidenceConfidence: 30, fieldFocusPriority: 45, competitors: [], capabilities: andwellCatalog.slice(0, 5).map((s) => s.serviceLine), safeTalkTrack: 'Add public competitor sources to build a stronger geographic intelligence package.', avoidLanguage: 'Do not claim market coverage without source evidence.', nextMove: 'Add competitor pages with location and service detail.', sourceToAdd: 'Competitor service area pages' }], summary: { topGrowthAreas: [], saturatedAreas: [], fieldFocusZones: [], partnershipAreas: [], evidenceLimitedAreas: ['Evidence Limited'], geographicSignals: 0 } };
  }

  const areaMap = new Map<string, MarketArea>();
  const signalByArea = new Map<string, number>();
  (report.geographicSignals || []).forEach((signal) => {
    signalByArea.set(signal.areaLabel, Math.max(signalByArea.get(signal.areaLabel) || 0, signal.confidence));
  });
  for (const analysis of report.analyses) {
    const text = `${analysis.market} ${analysis.url} ${analysis.findings.map((f) => f.evidenceExcerpt).join(' ')}`;
    const area = inferAreaFromReportText(text);
    const existing = areaMap.get(area);
    const capabilities = [...new Set(analysis.findings.map((f) => f.serviceLine).filter(Boolean))];
    const overlap = analysis.findings.filter((f) => f.competitorStatus === 'Clearly offered').length;
    const advantage = analysis.findings.filter((f) => f.competitorStatus === 'Not found publicly' || f.competitorStatus === 'Unclear').length;
    const growthOpportunityScore = clamp(55 + advantage * 4 - overlap * 2);
    const saturationScore = clamp(20 + overlap * 6);
    const evidenceConfidence = clamp(30 + analysis.findings.filter((f) => f.sourceUrl).length * 5);
    const geoConfidence = signalByArea.get(area) || 0;
    const candidate: MarketArea = {
      area,
      signal: area === 'Evidence Limited' ? 'Evidence Limited' : overlap > 8 ? 'Competitive Battleground' : growthOpportunityScore > 72 ? 'High Growth Opportunity' : 'Field Focus Zone',
      growthOpportunityScore,
      saturationScore,
      andwellAdvantageScore: clamp(45 + advantage * 5),
      referralSourcePotential: clamp(48 + capabilities.length * 3),
      partnershipPotential: clamp(50 + (analysis.findings.filter((f) => f.serviceLine.includes('Care') || f.serviceLine.includes('Partnership')).length * 4)),
      payerValuePotential: clamp(54 + (analysis.findings.filter((f) => f.serviceLine.includes('Value') || f.serviceLine.includes('Complex')).length * 5)),
      evidenceConfidence: clamp((evidenceConfidence + geoConfidence) / (geoConfidence ? 2 : 1)),
      fieldFocusPriority: clamp((growthOpportunityScore + (100 - saturationScore)) / 2),
      competitors: [analysis.name],
      capabilities,
      safeTalkTrack: `Current source evidence suggests ${area} is a practical focus area when the referral need aligns with Andwell capability depth.`,
      avoidLanguage: 'Do not claim guaranteed growth or competitor absence in this area.',
      nextMove: 'Use matrix-backed service differentiation and field-safe language in local outreach.',
      sourceToAdd: 'Competitor service-area or location pages'
    };
    if (!existing) areaMap.set(area, candidate);
    else {
      existing.competitors = [...new Set([...existing.competitors, analysis.name])];
      existing.capabilities = [...new Set([...existing.capabilities, ...capabilities])];
      existing.growthOpportunityScore = clamp((existing.growthOpportunityScore + candidate.growthOpportunityScore) / 2);
      existing.saturationScore = clamp((existing.saturationScore + candidate.saturationScore) / 2);
      existing.evidenceConfidence = clamp((existing.evidenceConfidence + candidate.evidenceConfidence) / 2);
    }
  }

  const areas = [...areaMap.values()].sort((a, b) => b.fieldFocusPriority - a.fieldFocusPriority);
  return {
    areas,
    summary: {
      topGrowthAreas: areas.filter((a) => a.growthOpportunityScore >= 70).slice(0, 4).map((a) => a.area),
      saturatedAreas: areas.filter((a) => a.saturationScore >= 70).slice(0, 4).map((a) => a.area),
      fieldFocusZones: areas.slice(0, 5).map((a) => a.area),
      partnershipAreas: areas.sort((a, b) => b.partnershipPotential - a.partnershipPotential).slice(0, 4).map((a) => a.area),
      evidenceLimitedAreas: areas.filter((a) => a.signal === 'Evidence Limited').map((a) => a.area),
      geographicSignals: report.externalDataSummary?.geographicSignals || report.geographicSignals?.length || 0
    }
  };
}
