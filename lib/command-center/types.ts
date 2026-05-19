import type { IntelligenceReport } from '../types';

export type View = 'dashboard' | 'growth' | 'board' | 'launch' | 'expert' | 'ai' | 'prompt' | 'intake' | 'matrix' | 'battlecards' | 'reports' | 'ask' | 'catalog' | 'diagnostics';
export type RoleView = 'Executive' | 'Sales Leader' | 'Sales Rep' | 'Admin';
export type MatrixFilter = 'all' | 'salesReady' | 'review' | 'advantage' | 'matched';
export type ReportSummary = { id: string; generatedAt: string; competitorsAnalyzed: number; pagesReviewed: number; potentialAndwellAdvantages: number; humanReviewItems: number; competitors: string[]; executiveSummary: string };
export type ApiCheck = { route: string; ok: boolean; status: number; message: string; preview?: string };
export type AnyAnalysis = NonNullable<IntelligenceReport['analyses']>[number];
export type AskEvidence = { type: string; smartScore?: number; competitorName: string; serviceLine: string; subservice?: string | null; status: string; confidence: string; sourceUrl?: string; sourceTitle?: string; evidenceExcerpt: string; safeSalesWording: string; reviewStatus: string; recommendedAction?: string };
export type AskResponse = { answer: string; confidence: string; reportId?: string; questionTerms?: string[]; nextBestActions?: string[]; evidence?: AskEvidence[] };
