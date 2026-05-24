import type { CompetitorInput, EvidenceStrength, FieldRisk, Finding, IntelligenceReport, ReviewStatus, SourceHealth, SubserviceFinding } from '../../lib/types';
import type { CatalogOverride } from '../../lib/store';

export type TabId = 'dashboard' | 'sources' | 'matrix' | 'map' | 'library' | 'strategy' | 'coach' | 'report' | 'system';

export type ApiStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ServiceHealthStatus = 'ok' | 'degraded' | 'down';
export type ServiceHealthKey = 'reports' | 'competitors' | 'catalog' | 'runtime' | 'analyze';
export type ServiceHealthItem = {
  status: ServiceHealthStatus;
  httpStatus?: number;
  lastError?: string;
  checkedAt?: string;
};

export type ReportSummary = {
  id: string;
  generatedAt: string;
  competitorsAnalyzed: number;
  pagesReviewed: number;
  serviceLinesMapped: number;
  subservicesMapped: number;
  matchedServiceFindings: number;
  potentialAndwellAdvantages: number;
  guardrailCount?: number;
  competitors: string[];
  executiveSummary: string;
};

export type CatalogItem = {
  category: string;
  serviceLine: string;
  description: string;
  subservices: string[];
  safeLanguage: string;
  avoid: string;
  evidence: string;
  override: CatalogOverride | null;
};

export type RuntimeInfo = {
  ok: boolean;
  route: string;
  nodeVersion: string;
  nextRuntime: string;
  persistence: {
    supabaseConfigured: boolean;
    mongoConfigured: boolean;
    localJsonFallback: boolean;
  };
  ai: {
    configured: boolean;
    model: string;
    transport: string;
  };
  limits: {
    crawlMaxPagesPerSite: number;
    analyzeConcurrency: number;
    maxCompetitorsPerScan: number;
  };
  checkedAt: string;
};

export type AnalyzeHealth = {
  ok: boolean;
  aiConfigured: boolean;
  analyzeConcurrency: number;
  crawlMaxPagesPerSiteLimit: number;
  message: string;
};

export type AskResponse = {
  answer: string;
  confidence: string;
  reportId?: string;
  questionTerms?: string[];
  nextBestActions: string[];
  evidence: Array<{
    smartScore?: number;
    competitorName: string;
    serviceLine: string;
    subservice?: string | null;
    status: string;
    confidence: string;
    sourceUrl?: string;
    sourceTitle?: string;
    evidenceExcerpt: string;
    safeSalesWording: string;
    reviewStatus?: ReviewStatus;
    evidenceStrength?: EvidenceStrength;
    recommendedActionSignal?: string;
    governanceReason?: string;
    // Compatibility fields for legacy stored payloads.
    recommendedReviewAction?: string;
    reviewReason?: string;
    fieldRisk?: FieldRisk;
    aiReliability?: string;
    recommendedUse?: string;
    usageGuidance?: string;
    recommendedAction: string;
  }>;
};

export type CommandCenterState = {
  status: ApiStatus;
  error: string;
  competitors: CompetitorInput[];
  reports: ReportSummary[];
  currentReport: IntelligenceReport | null;
  catalog: CatalogItem[];
  analyzeHealth: AnalyzeHealth | null;
  runtime: RuntimeInfo | null;
  serviceHealth: Record<ServiceHealthKey, ServiceHealthItem>;
  scanJobId?: string | null;
  scanStatus?: 'queued' | 'running' | 'completed' | 'failed' | 'timed_out' | null;
  scanProgress?: { done: number; total: number } | null;
  scanWarnings?: string[];
};

export type ReviewableFinding = (Finding | SubserviceFinding) & {
  kind: 'service' | 'subservice';
};

export type ScanResult = {
  report: IntelligenceReport;
  warnings: string[];
};

export type SourcePreviewItem = SourceHealth & {
  raw: string;
  valid: boolean;
};
