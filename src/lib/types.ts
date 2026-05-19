export type Lens = "executive" | "sales-leader" | "sales-rep" | "admin"
export type PersistenceBackend = "json" | "supabase" | "mongodb"
export type ReviewStatus = "pending" | "approved" | "edited" | "rejected"
export type ThreatLevel = "low" | "medium" | "high" | "critical"

export interface ServiceLine { id: string; name: string; description: string }
export interface SubService { id: string; serviceId: string; name: string; description: string; evidenceIds: string[] }

export interface Competitor {
  id: string; name: string; website: string; url?: string
  addedAt: string; lastCrawled: string | null
  status: "pending" | "crawling" | "complete" | "error"
  maineCounties: string[]; threatLevel: ThreatLevel
  mainePresence?: string; lastScraped?: string
}

export interface CrawlResult {
  url: string; pagesScraped: number
  servicesFound: string[]; subservicesFound: string[]
  maineMentions: { page: string; snippet: string }[]
  rawContent: string; summary?: string; countiesMentioned?: string[]
}

export interface Finding {
  id: string; competitorId: string; serviceId: string; subServiceId: string
  evidence: string; source: string; date: string
  confidence: "confirmed" | "likely" | "possible" | "not-found"
  reviewStatus: ReviewStatus; reviewNote?: string
}

export interface Evidence {
  id: string; competitorId: string; source: string; snippet: string
  date: string; relevance: number; maineRelevance: boolean
  serviceId?: string; subServiceId?: string; confidence?: string
}

export interface ServiceScore {
  serviceId: string; competitorId: string
  overlapScore: number; subserviceDepth: number; differentiationScore: number
}

export interface CompetitorProfile {
  competitorId: string; serviceScores: ServiceScore[]
  executiveSummary: string; threatLevel: ThreatLevel
  evidenceStrength: number; reviewRisk: number
}

export interface BattlecardOld {
  id: string; competitorId: string; competitorName: string
  strengths: string[]; weaknesses: string[]; andwellAdvantage: string[]
  winRate: number; lastUpdated: string; maineMarketShare: number
}

export interface Battlecard {
  competitorId: string; competitorName: string
  leadWith: string[]; questions: string[]
  safeWording: string[]; whatNotToSay: string[]
  winRate: number; maineMarketShare: number
}

export interface GapFinding {
  serviceId: string; subServiceId: string
  serviceName: string; subServiceName: string
  opportunity: string; competitorGap: string
  andwellStrength: string; priority: "high" | "medium" | "low"
}

export interface Report {
  id: string; title: string; type: "competitive" | "growth" | "board" | "gap"
  createdAt: string; summary: string; findings?: string[]
  exportFormats?: string[]
}

export interface ReviewDecision {
  id: string; findingId: string; status: ReviewStatus
  comment: string; reviewedAt: string; reviewer: string
}

export interface AskMessage {
  role: "user" | "assistant"; content: string
  sources?: { competitor: string; snippet: string }[]
}

export interface Message { role: "user" | "assistant"; content: string }

export interface ScrapeResult {
  summary: string; servicesFound: string[]
  maineMentions: { page: string; snippet: string }[]
  countiesMentioned: string[]
}

export interface ExportData {
  competitors: Competitor[]; findings: Finding[]
  reports: Report[]; battlecards: Battlecard[]; gaps: GapFinding[]
}

export interface MaineCounty {
  name: string; population: number; over65Percent: number
  medianIncome: number; ruralPercent: number; homeHealthAgencies: number
}

export interface CountyDemand {
  county: string; state: string; population: number
  homeHealthDemand: number; mobileWoundDemand: number; therapyCareDemand: number
  competitionIntensity: "low" | "medium" | "high"; priorityScore: number
}

export interface GrowthScenario {
  id: string; name: string; serviceLine: string
  counties: string[]; projectedRevenue: number
  staffingRequired: number; timelineMonths: number; confidence: number
}

export interface LaunchPlanStep {
  week: number; action: string; owner: string
  status: "pending" | "in-progress" | "complete"
}

export interface CatalogItem {
  id: string; name: string; description: string
  category: string; evidence: string[]
}
