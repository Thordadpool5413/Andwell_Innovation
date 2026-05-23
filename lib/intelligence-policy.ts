import type { Finding, IntelligenceReport, SourceHealth, SubserviceFinding } from './types';
import { projectLegacyReviewToGovernance } from './ai-governance';

export type ReviewablePolicyInput = Finding | SubserviceFinding;

export function evidenceStrengthFor(item: ReviewablePolicyInput) {
  if (!item.sourceUrl) return 'Missing' as const;
  if (item.confidence === 'High' && item.competitorStatus === 'Clearly offered') return 'Strong' as const;
  if (item.confidence === 'High' || item.confidence === 'Moderate') return 'Moderate' as const;
  if (item.evidenceExcerpt && !item.evidenceExcerpt.startsWith('No explicit public evidence')) return 'Weak' as const;
  return 'Missing' as const;
}

export function fieldRiskFor(item: ReviewablePolicyInput) {
  const strength = evidenceStrengthFor(item);
  const governance = projectLegacyReviewToGovernance(item);
  if (strength === 'Missing') return 'High' as const;
  if (item.competitorStatus === 'Not found publicly' || item.competitorStatus === 'Unclear' || governance.recommendedUse === 'Investigate first') return 'High' as const;
  if (item.competitorStatus === 'Mentioned only' || item.competitorStatus === 'Related but not equivalent' || governance.recommendedUse === 'Use with guardrails') return 'Medium' as const;
  return 'Low' as const;
}

export function recommendedReviewActionFor(item: ReviewablePolicyInput) {
  const strength = evidenceStrengthFor(item);
  const governance = projectLegacyReviewToGovernance(item);
  if (governance.recommendedUse === 'Avoid claim') return 'Reject' as const;
  if (strength === 'Strong' && governance.recommendedUse === 'Use confidently') return 'Approve' as const;
  if (strength === 'Missing') return 'Investigate' as const;
  if (item.competitorStatus === 'Clearly offered' && (strength === 'Strong' || strength === 'Moderate')) return 'Approve' as const;
  if (item.competitorStatus === 'Mentioned only' || item.competitorStatus === 'Related but not equivalent') return 'Edit' as const;
  if (item.competitorStatus === 'Not found publicly' || item.competitorStatus === 'Unclear') return 'Investigate' as const;
  return 'Edit' as const;
}

export function reviewReasonFor(item: ReviewablePolicyInput) {
  const strength = evidenceStrengthFor(item);
  const action = recommendedReviewActionFor(item);
  if (action === 'Approve') return 'Public evidence and confidence are strong enough for safe-language output.';
  if (action === 'Edit') return 'Evidence exists, but wording should stay careful because the public signal is partial, related, or not fully equivalent.';
  if (action === 'Reject') return 'The claim is not supported by reviewed evidence.';
  if (strength === 'Missing') return 'No reliable public source was captured, so the AI will keep this out of strong field language.';
  return 'The AI is keeping this finding guarded because the public evidence is limited.';
}

export function enrichFinding<T extends ReviewablePolicyInput>(item: T): T {
  const governance = projectLegacyReviewToGovernance(item);
  return {
    ...item,
    evidenceStrength: item.evidenceStrength || evidenceStrengthFor(item),
    recommendedReviewAction: item.recommendedReviewAction || recommendedReviewActionFor(item),
    reviewReason: item.reviewReason || reviewReasonFor(item),
    fieldRisk: item.fieldRisk || fieldRiskFor(item),
    aiReliability: item.aiReliability || governance.aiReliability,
    recommendedUse: item.recommendedUse || governance.recommendedUse,
    usageGuidance: item.usageGuidance || governance.usageGuidance
  };
}

export function calculateReportReadiness(input: {
  hasReport: boolean;
  highReliabilityCount: number;
  guardedUseCount: number;
  investigateCount: number;
  crawlWarningCount: number;
  sourceIssueCount: number;
  aiEnabled?: boolean;
}) {
  const blockers: string[] = [];
  const strengths: string[] = [];

  if (!input.hasReport) blockers.push('Run at least one AI intelligence build.');
  if (input.hasReport && !input.highReliabilityCount) blockers.push('Add stronger public evidence so the intelligence engine can produce stronger field guidance.');
  if (input.guardedUseCount > 0) blockers.push(`Guardrails are active on ${input.guardedUseCount} finding${input.guardedUseCount === 1 ? '' : 's'}.`);
  if (input.investigateCount > 0) blockers.push(`${input.investigateCount} finding${input.investigateCount === 1 ? '' : 's'} need stronger source evidence before direct field use.`);
  if (input.crawlWarningCount > 0) blockers.push(`${input.crawlWarningCount} crawl warning${input.crawlWarningCount === 1 ? '' : 's'} handled with caution.`);
  if (input.sourceIssueCount > 0) blockers.push(`Check ${input.sourceIssueCount} skipped or rejected source${input.sourceIssueCount === 1 ? '' : 's'}.`);

  if (input.highReliabilityCount > 0) strengths.push(`${input.highReliabilityCount} high-reliability finding${input.highReliabilityCount === 1 ? '' : 's'} available for direct field use.`);
  if (input.guardedUseCount === 0 && input.investigateCount === 0 && input.hasReport) strengths.push('No high-risk governance flags in the latest build.');
  if (input.crawlWarningCount === 0 && input.hasReport) strengths.push('No crawl warnings in the latest report.');
  if (input.aiEnabled) strengths.push('AI enrichment was available for this scan.');

  const evidenceScore = input.highReliabilityCount ? 30 : 0;
  const reviewScore = input.guardedUseCount === 0 && input.investigateCount === 0 ? 26 : input.investigateCount < 5 ? 16 : input.investigateCount < 25 ? 8 : 3;
  const crawlScore = input.crawlWarningCount === 0 ? 18 : input.crawlWarningCount < 3 ? 10 : 4;
  const sourceScore = input.sourceIssueCount === 0 ? 14 : input.sourceIssueCount < 3 ? 8 : 3;
  const base = input.hasReport ? 12 : 0;
  const score = Math.min(100, base + evidenceScore + reviewScore + crawlScore + sourceScore);
  const status: 'Ready' | 'Draft' | 'Blocked' = !input.hasReport || !input.highReliabilityCount || input.investigateCount > 0 ? 'Blocked' : blockers.length ? 'Draft' : 'Ready';
  const nextAction = !input.hasReport
    ? 'Run the first AI intelligence build so the workspace has real public evidence.'
    : input.investigateCount
      ? `Strengthen source coverage for ${input.investigateCount} investigate-first finding${input.investigateCount === 1 ? '' : 's'}.`
      : input.guardedUseCount
        ? `Use guarded language for ${input.guardedUseCount} limited-evidence finding${input.guardedUseCount === 1 ? '' : 's'}.`
      : !input.highReliabilityCount
        ? 'Add stronger source evidence so the AI can build strategy, coaching, and report outputs.'
        : input.crawlWarningCount || input.sourceIssueCount
          ? 'Use the report with source coverage context where the crawler found limited access.'
          : 'AI-built strategy, coaching, and executive report outputs are available.';

  return {
    score,
    status,
    blockers,
    strengths,
    nextAction,
    approvedEvidenceCount: input.highReliabilityCount,
    openReviewCount: input.guardedUseCount + input.investigateCount,
    crawlWarningCount: input.crawlWarningCount,
    sourceIssueCount: input.sourceIssueCount,
    highReliabilityCount: input.highReliabilityCount,
    guardedUseCount: input.guardedUseCount,
    investigateCount: input.investigateCount
  };
}

export function recommendedActionsFor(report: IntelligenceReport) {
  const readiness = report.readiness || calculateStoredReadiness(report);
  const actions = [];
  if (readiness.guardedUseCount + readiness.investigateCount > 0) {
    actions.push({
      id: 'apply-ai-guardrails',
      label: 'Apply AI guardrails',
      detail: `${readiness.guardedUseCount + readiness.investigateCount} finding${readiness.guardedUseCount + readiness.investigateCount === 1 ? '' : 's'} should stay in guarded wording.`,
      target: 'coach' as const,
      priority: 'High' as const
    });
  }
  if (!readiness.highReliabilityCount) {
    actions.push({
      id: 'add-source-evidence',
      label: 'Add stronger sources',
      detail: 'Add direct service pages so the AI can build stronger strategy, coaching, and report outputs.',
      target: 'sources' as const,
      priority: 'High' as const
    });
  }
  if (readiness.crawlWarningCount || readiness.sourceIssueCount) {
    actions.push({
      id: 'check-source-health',
      label: 'Check source health',
      detail: 'Some sources were skipped, rejected, or partially crawled. Add cleaner public URLs for stronger output.',
      target: 'sources' as const,
      priority: 'Medium' as const
    });
  }
  if (!actions.length) {
    actions.push({
      id: 'use-ai-built-intelligence',
      label: 'Use AI-built intelligence',
      detail: 'Move into strategy, AI coaching, or the executive report with source-backed safe wording.',
      target: 'strategy' as const,
      priority: 'Medium' as const
    });
  }
  return actions;
}

export function calculateStoredReadiness(report: IntelligenceReport, overrides?: { highReliabilityCount?: number; guardedUseCount?: number; investigateCount?: number }) {
  const allItems = [...report.allFindings, ...report.allSubserviceFindings];
  const highReliabilityCount = overrides?.highReliabilityCount ?? allItems.filter((item) => projectLegacyReviewToGovernance(item).aiReliability === 'High').length;
  const guardedUseCount = overrides?.guardedUseCount ?? allItems.filter((item) => projectLegacyReviewToGovernance(item).recommendedUse === 'Use with guardrails').length;
  const investigateCount = overrides?.investigateCount ?? allItems.filter((item) => projectLegacyReviewToGovernance(item).recommendedUse === 'Investigate first' || projectLegacyReviewToGovernance(item).recommendedUse === 'Avoid claim').length;
  const sourceIssueCount = (report.sourceHealth || []).filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped').length;
  return calculateReportReadiness({
    hasReport: true,
    highReliabilityCount,
    guardedUseCount,
    investigateCount,
    crawlWarningCount: report.crawlErrors?.length || 0,
    sourceIssueCount,
    aiEnabled: report.aiEnabled
  });
}

export function calculateAIGovernanceSummary(report: IntelligenceReport) {
  const items = [...report.allFindings, ...report.allSubserviceFindings];
  const reliabilityScore = items.length
    ? Math.round(
      items.reduce((sum, item) => {
        const projected = projectLegacyReviewToGovernance(item);
        return sum + (projected.aiReliability === 'High' ? 100 : projected.aiReliability === 'Medium' ? 65 : 30);
      }, 0) / items.length
    )
    : 0;

  const highReliabilityCount = items.filter((item) => projectLegacyReviewToGovernance(item).aiReliability === 'High').length;
  const guardedUseCount = items.filter((item) => projectLegacyReviewToGovernance(item).recommendedUse === 'Use with guardrails').length;
  const investigateCount = items.filter((item) => projectLegacyReviewToGovernance(item).recommendedUse === 'Investigate first').length;

  const riskFlags: string[] = [];
  if (guardedUseCount > 0) riskFlags.push(`${guardedUseCount} finding${guardedUseCount === 1 ? '' : 's'} require guarded wording.`);
  if (investigateCount > 0) riskFlags.push(`${investigateCount} finding${investigateCount === 1 ? '' : 's'} should be investigated before field use.`);
  const crawlWarnings = report.crawlErrors?.length || 0;
  if (crawlWarnings > 0) riskFlags.push(`${crawlWarnings} crawl warning${crawlWarnings === 1 ? '' : 's'} affected evidence coverage.`);

  const usageGuidance = !items.length
    ? 'Build intelligence from public sources to generate AI governance guidance.'
    : guardedUseCount || investigateCount
      ? 'Use source-backed language and follow AI guardrails for partial evidence areas.'
      : 'Outputs are source-backed and ready for standard field usage.';

  const recommendedNextAction = !items.length
    ? 'Add sources and run intelligence build.'
    : investigateCount > 0
      ? 'Refresh source coverage for investigate-first findings.'
      : guardedUseCount > 0
        ? 'Use guarded wording for limited-evidence findings in coaching and strategy.'
        : 'Proceed with strategy, coaching, and executive outputs.';

  return {
    aiReliabilityScore: reliabilityScore,
    usageGuidance,
    riskFlags,
    recommendedNextAction,
    highReliabilityCount,
    guardedUseCount,
    investigateCount
  };
}

export function enrichReportIntelligence(report: IntelligenceReport, sourceHealth: SourceHealth[] = report.sourceHealth || []): IntelligenceReport {
  const analyses = report.analyses.map((analysis) => {
    const findings = analysis.findings.map(enrichFinding);
    const subserviceFindings = analysis.subserviceFindings.map(enrichFinding);
    return {
      ...analysis,
      findings: findings.map((finding) => ({
        ...finding,
        subserviceFindings: finding.subserviceFindings.map(enrichFinding)
      })),
      subserviceFindings
    };
  });
  const allFindings = analyses.flatMap((analysis) => analysis.findings);
  const allSubserviceFindings = analyses.flatMap((analysis) => analysis.subserviceFindings);
  const withFindings = {
    ...report,
    analyses,
    allFindings,
    allSubserviceFindings,
    sourceHealth
  };
  const readiness = calculateStoredReadiness(withFindings);
  const aiGovernance = calculateAIGovernanceSummary(withFindings);
  return {
    ...withFindings,
    readiness,
    aiGovernance,
    recommendedActions: recommendedActionsFor({ ...withFindings, readiness })
  };
}
