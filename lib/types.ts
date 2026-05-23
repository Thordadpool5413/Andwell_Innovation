export type Status = 'Clearly offered' | 'Mentioned only' | 'Related but not equivalent' | 'Not found publicly' | 'Unclear' | 'Needs human review';
export type Confidence = 'High' | 'Moderate' | 'Low' | 'Not found' | 'Needs review';
export type ReviewStatus = 'Sales usable with evidence' | 'Manager review suggested' | 'Needs human review' | 'Approved for sales use' | 'Rejected';
export type ThreatLevel = 'Low overlap' | 'Moderate overlap' | 'High overlap' | 'Strategic threat';
export type ExpertPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ExpertAudience = 'CEO' | 'COO' | 'Sales Leader' | 'Sales Rep' | 'Admin' | 'Marketing' | 'Clinical Leader';
export type EvidenceStrength = 'Strong' | 'Moderate' | 'Weak' | 'Missing';
export type RecommendedReviewAction = 'Approve' | 'Edit' | 'Reject' | 'Investigate';
export type FieldRisk = 'Low' | 'Medium' | 'High';
export type AIRecommendedUse = 'Use confidently' | 'Use with guardrails' | 'Investigate first' | 'Avoid claim';
export type AIReliability = 'High' | 'Medium' | 'Low';

export type CrawledPage = {
  url: string;
  title: string;
  text: string;
  excerpt: string;
};

export type CompetitorInput = {
  name?: string;
  url: string;
  market?: string;
  notes?: string;
};

export type SourceHealth = {
  input: string;
  url?: string;
  host?: string;
  status: 'accepted' | 'duplicate' | 'rejected' | 'skipped' | 'warning' | 'crawled';
  reason: string;
  qualityScore: number;
  pagesReviewed?: number;
  error?: string;
};

export type AIServiceLineDepth = {
  serviceLine: string;
  depthScore: number;
  evidenceStrength: 'Strong' | 'Moderate' | 'Weak' | 'Not found';
  summary: string;
  competitorAdvantages: string[];
  andwellAdvantages: string[];
  proofPoints: string[];
  referralCallsToAction: string[];
  reviewRisk: 'Low' | 'Medium' | 'High';
};

export type AISubserviceDepth = {
  serviceLine: string;
  subservice: string;
  status: Status;
  confidence: Confidence;
  evidenceExcerpt: string;
  sourceUrl?: string;
  safeSalesLanguage: string;
  doNotSayLanguage: string;
};

export type AISalesBattlecard = {
  serviceLine: string;
  leadWith: string;
  referralQuestion: string;
  objectionResponse: string;
  proofPoint: string;
  safeSalesLanguage: string;
  doNotSayLanguage: string;
};

export type AICompetitorExtraction = {
  providerName: string;
  aiModel: string;
  generatedAt: string;
  servicesMentioned: string[];
  benefitsMentioned: string[];
  claimsMade: string[];
  programsOffered: string[];
  proofPoints: string[];
  referralCallsToAction: string[];
  serviceLineDepth: AIServiceLineDepth[];
  subserviceDepth: AISubserviceDepth[];
  competitorAdvantages: string[];
  andwellAdvantages: string[];
  safeSalesLanguage: string[];
  doNotSayLanguage: string[];
  reviewRisks: string[];
  leadershipSummary: string;
  salesBattlecards: AISalesBattlecard[];
  rawConfidence: 'High' | 'Medium' | 'Low';
};

export type SubserviceFinding = {
  id: string;
  competitorId: string;
  competitorName: string;
  serviceLine: string;
  subservice: string;
  andwellStatus: Status;
  competitorStatus: Status;
  confidence: Confidence;
  sourceUrl?: string;
  sourceTitle?: string;
  evidenceExcerpt: string;
  matchedTerms: string[];
  aiInterpretation: string;
  safeSalesWording: string;
  avoidSaying: string;
  reviewStatus: ReviewStatus;
  evidenceStrength?: EvidenceStrength;
  recommendedReviewAction?: RecommendedReviewAction;
  reviewReason?: string;
  fieldRisk?: FieldRisk;
  aiReliability?: AIReliability;
  recommendedUse?: AIRecommendedUse;
  usageGuidance?: string;
};

export type Finding = {
  id: string;
  competitorId: string;
  competitorName: string;
  serviceLine: string;
  andwellStatus: Status;
  competitorStatus: Status;
  confidence: Confidence;
  sourceUrl?: string;
  sourceTitle?: string;
  evidenceExcerpt: string;
  aiInterpretation: string;
  matchLevel: string;
  andwellAdvantage: string;
  competitorAdvantage: string;
  safeSalesWording: string;
  avoidSaying: string;
  reviewStatus: ReviewStatus;
  evidenceStrength?: EvidenceStrength;
  recommendedReviewAction?: RecommendedReviewAction;
  reviewReason?: string;
  fieldRisk?: FieldRisk;
  aiReliability?: AIReliability;
  recommendedUse?: AIRecommendedUse;
  usageGuidance?: string;
  subserviceFindings: SubserviceFinding[];
  clearlyMatchedSubservices: number;
  totalSubservices: number;
  subserviceDepthScore: number;
};

export type CompetitorScore = {
  competitorId: string;
  competitorName: string;
  serviceLineMatchScore: number;
  subserviceDepthScore: number;
  andwellDifferentiationScore: number;
  competitorVisibilityScore: number;
  evidenceStrengthScore: number;
  reviewRiskScore: number;
  threatLevel: ThreatLevel;
  strongestMatches: string[];
  strongestAndwellAdvantages: string[];
  needsReview: string[];
  leadWith: string[];
  executiveReadout: string;
};

export type CompetitorAnalysis = {
  id: string;
  name: string;
  url: string;
  market: string;
  analyzedAt: string;
  pagesReviewed: CrawledPage[];
  findings: Finding[];
  subserviceFindings: SubserviceFinding[];
  score: CompetitorScore;
  aiExtraction?: AICompetitorExtraction;
  aiEnhanced?: boolean;
};

export type ExecutiveInsight = {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  audience: 'CEO' | 'COO' | 'Sales Leader' | 'Sales Rep' | 'Admin';
  summary: string;
  action: string;
};

export type ExpertRecommendation = {
  id: string;
  priority: ExpertPriority;
  audience: ExpertAudience;
  title: string;
  reasoning: string;
  action: string;
  safeLanguage: string;
  reviewRequired: boolean;
};

export type ExpertFieldPlay = {
  id: string;
  competitorName: string;
  serviceLine: string;
  scenario: string;
  leadWith: string;
  referralQuestion: string;
  objectionResponse: string;
  proofNeeded: string;
  avoidSaying: string;
};

export type ExpertWatchItem = {
  id: string;
  competitorName: string;
  signal: string;
  whyItMatters: string;
  nextCheck: string;
  priority: ExpertPriority;
};

export type ExpertBrief = {
  expertVersion: string;
  generatedAt: string;
  expertScore: number;
  marketPosture: string;
  expertSummary: string;
  leadershipDecision: string;
  salesCoachingPriority: string;
  fastestFieldMove: string;
  governanceWarning: string;
  strongestThreats: string[];
  bestOpportunities: string[];
  recommendations: ExpertRecommendation[];
  fieldPlays: ExpertFieldPlay[];
  watchlist: ExpertWatchItem[];
};

export type ReportReadiness = {
  score: number;
  status: 'Ready' | 'Draft' | 'Blocked';
  blockers: string[];
  strengths: string[];
  nextAction: string;
  approvedEvidenceCount: number;
  openReviewCount: number;
  highReliabilityCount: number;
  guardedUseCount: number;
  investigateCount: number;
  crawlWarningCount: number;
  sourceIssueCount: number;
};

export type AIGovernanceSummary = {
  aiReliabilityScore: number;
  usageGuidance: string;
  riskFlags: string[];
  recommendedNextAction: string;
  highReliabilityCount: number;
  guardedUseCount: number;
  investigateCount: number;
};

export type ProviderRegistryMatch = {
  source: 'cms_hospice' | 'cms_home_health' | 'nppes';
  providerName: string;
  confidence: number;
  npi?: string;
  ccn?: string;
  city?: string;
  state?: string;
  zip?: string;
  addressLine1?: string;
  phone?: string;
  taxonomy?: string[];
};

export type ProviderEnrichmentItem = {
  competitorUrl: string;
  competitorName: string;
  matches: ProviderRegistryMatch[];
  bestMatchConfidence: number;
  generatedAt: string;
};

export type GeographicSignal = {
  areaLabel: string;
  county?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  source: 'census_geocoder' | 'inferred';
};

export type ExternalDataSummary = {
  providersEnriched: number;
  providerMatches: number;
  geographicSignals: number;
  lastEnrichedAt: string;
};

export type RecommendedAction = {
  id: string;
  label: string;
  detail: string;
  target: 'sources' | 'review' | 'library' | 'strategy' | 'coach' | 'report' | 'system';
  priority: 'High' | 'Medium' | 'Low';
};

export type IntelligenceReport = {
  id: string;
  generatedAt: string;
  baselineProvider: 'Andwell Health Partners';
  competitorsAnalyzed: number;
  pagesReviewed: number;
  serviceLinesMapped: number;
  subservicesMapped: number;
  matchedServiceFindings: number;
  potentialAndwellAdvantages: number;
  humanReviewItems: number;
  executiveSummary: string;
  executiveInsights: ExecutiveInsight[];
  competitorScores: CompetitorScore[];
  analyses: CompetitorAnalysis[];
  allFindings: Finding[];
  allSubserviceFindings: SubserviceFinding[];
  crawlErrors: { url: string; error: string }[];
  aiEnabled?: boolean;
  aiModel?: string;
  aiLeadershipSummary?: string;
  analysisConcurrency?: number;
  crawlMaxPagesPerSite?: number;
  expertBrief?: ExpertBrief;
  sourceHealth?: SourceHealth[];
  readiness?: ReportReadiness;
  aiGovernance?: AIGovernanceSummary;
  recommendedActions?: RecommendedAction[];
  providerEnrichment?: ProviderEnrichmentItem[];
  geographicSignals?: GeographicSignal[];
  externalDataSummary?: ExternalDataSummary;
};

export type AnalyzeJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timed_out';

export type AnalyzeJob = {
  id: string;
  status: AnalyzeJobStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  inputSummary: {
    competitors: number;
    maxPagesPerSite: number;
    useAI: boolean;
  };
  progress: {
    done: number;
    total: number;
  };
  warnings: string[];
  errors: string[];
  reportId?: string;
  timing: {
    elapsedMs: number;
    perCompetitorMs: Record<string, number>;
  };
};
