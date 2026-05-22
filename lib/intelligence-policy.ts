import type { Finding, IntelligenceReport, ReviewStatus, SourceHealth, SubserviceFinding } from './types';

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
  if (strength === 'Missing') return 'High' as const;
  if (item.competitorStatus === 'Not found publicly' || item.competitorStatus === 'Unclear' || item.reviewStatus === 'Needs human review') return 'High' as const;
  if (item.competitorStatus === 'Mentioned only' || item.competitorStatus === 'Related but not equivalent' || item.reviewStatus === 'Manager review suggested') return 'Medium' as const;
  return 'Low' as const;
}

export function recommendedReviewActionFor(item: ReviewablePolicyInput) {
  const strength = evidenceStrengthFor(item);
  if (item.reviewStatus === 'Rejected') return 'Reject' as const;
  if (strength === 'Strong' && item.reviewStatus === 'Sales usable with evidence') return 'Approve' as const;
  if (strength === 'Missing') return 'Investigate' as const;
  if (item.competitorStatus === 'Clearly offered' && (strength === 'Strong' || strength === 'Moderate')) return 'Approve' as const;
  if (item.competitorStatus === 'Mentioned only' || item.competitorStatus === 'Related but not equivalent') return 'Edit' as const;
  if (item.competitorStatus === 'Not found publicly' || item.competitorStatus === 'Unclear') return 'Investigate' as const;
  return 'Edit' as const;
}

export function reviewReasonFor(item: ReviewablePolicyInput) {
  const strength = evidenceStrengthFor(item);
  const action = recommendedReviewActionFor(item);
  if (action === 'Approve') return 'Public evidence and confidence are strong enough for approved safe-language review.';
  if (action === 'Edit') return 'Evidence exists, but wording should stay careful because the public signal is partial, related, or not fully equivalent.';
  if (action === 'Reject') return 'The claim is not supported by reviewed evidence.';
  if (strength === 'Missing') return 'No reliable public source was captured, so this should be checked before field or leadership use.';
  return 'This finding needs a human decision before it becomes approved intelligence.';
}

export function enrichFinding<T extends ReviewablePolicyInput>(item: T): T {
  return {
    ...item,
    evidenceStrength: item.evidenceStrength || evidenceStrengthFor(item),
    recommendedReviewAction: item.recommendedReviewAction || recommendedReviewActionFor(item),
    reviewReason: item.reviewReason || reviewReasonFor(item),
    fieldRisk: item.fieldRisk || fieldRiskFor(item)
  };
}

export function isApprovedReviewStatus(status: ReviewStatus | 'Needs edits') {
  return status === 'Approved for sales use' || status === 'Sales usable with evidence';
}

export function isOpenReviewStatus(status: ReviewStatus | 'Needs edits') {
  return !isApprovedReviewStatus(status) && status !== 'Rejected';
}

export function calculateReportReadiness(input: {
  hasReport: boolean;
  approvedEvidenceCount: number;
  openReviewCount: number;
  crawlWarningCount: number;
  sourceIssueCount: number;
  aiEnabled?: boolean;
}) {
  const blockers: string[] = [];
  const strengths: string[] = [];

  if (!input.hasReport) blockers.push('Run at least one competitor scan.');
  if (input.hasReport && !input.approvedEvidenceCount) blockers.push('Approve at least one evidence-backed finding.');
  if (input.openReviewCount > 0) blockers.push(`Resolve ${input.openReviewCount} open review item${input.openReviewCount === 1 ? '' : 's'}.`);
  if (input.crawlWarningCount > 0) blockers.push(`Review ${input.crawlWarningCount} crawl warning${input.crawlWarningCount === 1 ? '' : 's'}.`);
  if (input.sourceIssueCount > 0) blockers.push(`Check ${input.sourceIssueCount} skipped or rejected source${input.sourceIssueCount === 1 ? '' : 's'}.`);

  if (input.approvedEvidenceCount > 0) strengths.push(`${input.approvedEvidenceCount} approved finding${input.approvedEvidenceCount === 1 ? '' : 's'} available for safe use.`);
  if (input.openReviewCount === 0 && input.hasReport) strengths.push('No open review queue blockers.');
  if (input.crawlWarningCount === 0 && input.hasReport) strengths.push('No crawl warnings in the latest report.');
  if (input.aiEnabled) strengths.push('AI enrichment was available for this scan.');

  const evidenceScore = input.approvedEvidenceCount ? 30 : 0;
  const reviewScore = input.openReviewCount === 0 ? 26 : input.openReviewCount < 10 ? 16 : input.openReviewCount < 50 ? 8 : 3;
  const crawlScore = input.crawlWarningCount === 0 ? 18 : input.crawlWarningCount < 3 ? 10 : 4;
  const sourceScore = input.sourceIssueCount === 0 ? 14 : input.sourceIssueCount < 3 ? 8 : 3;
  const base = input.hasReport ? 12 : 0;
  const score = Math.min(100, base + evidenceScore + reviewScore + crawlScore + sourceScore);
  const status: 'Ready' | 'Draft' | 'Blocked' = !input.hasReport || !input.approvedEvidenceCount || input.openReviewCount > 0 ? 'Blocked' : blockers.length ? 'Draft' : 'Ready';
  const nextAction = !input.hasReport
    ? 'Run the first intelligence scan so the workspace has real public evidence.'
    : input.openReviewCount
      ? `Review ${input.openReviewCount} finding${input.openReviewCount === 1 ? '' : 's'} before leadership or field use.`
      : !input.approvedEvidenceCount
        ? 'Approve at least one evidence-backed finding to unlock strategy, coaching, and reports.'
        : input.crawlWarningCount || input.sourceIssueCount
          ? 'Use the report as a draft until source and crawl warnings are checked.'
          : 'Workspace is ready for strategy, coaching, and executive report use.';

  return {
    score,
    status,
    blockers,
    strengths,
    nextAction,
    approvedEvidenceCount: input.approvedEvidenceCount,
    openReviewCount: input.openReviewCount,
    crawlWarningCount: input.crawlWarningCount,
    sourceIssueCount: input.sourceIssueCount
  };
}

export function recommendedActionsFor(report: IntelligenceReport) {
  const readiness = report.readiness || calculateStoredReadiness(report);
  const actions = [];
  if (readiness.openReviewCount > 0) {
    actions.push({
      id: 'clear-review-queue',
      label: 'Triage review queue',
      detail: `Decide on ${readiness.openReviewCount} finding${readiness.openReviewCount === 1 ? '' : 's'} before publishing field language.`,
      target: 'review' as const,
      priority: 'High' as const
    });
  }
  if (!readiness.approvedEvidenceCount) {
    actions.push({
      id: 'approve-first-evidence',
      label: 'Approve first evidence',
      detail: 'Approve one strong finding so strategy, coaching, and report outputs can rely on trusted evidence.',
      target: 'review' as const,
      priority: 'High' as const
    });
  }
  if (readiness.crawlWarningCount || readiness.sourceIssueCount) {
    actions.push({
      id: 'review-source-health',
      label: 'Check source health',
      detail: 'Review skipped sources and crawl warnings before treating the scan as complete.',
      target: 'sources' as const,
      priority: 'Medium' as const
    });
  }
  if (!actions.length) {
    actions.push({
      id: 'use-approved-intelligence',
      label: 'Use approved intelligence',
      detail: 'Move into strategy, AI coaching, or the executive report with approved safe wording.',
      target: 'strategy' as const,
      priority: 'Medium' as const
    });
  }
  return actions;
}

export function calculateStoredReadiness(report: IntelligenceReport, overrides?: { approvedEvidenceCount?: number; openReviewCount?: number }) {
  const approvedEvidenceCount = overrides?.approvedEvidenceCount ?? report.allFindings.filter((item) => isApprovedReviewStatus(item.reviewStatus)).length + report.allSubserviceFindings.filter((item) => isApprovedReviewStatus(item.reviewStatus)).length;
  const openReviewCount = overrides?.openReviewCount ?? report.allFindings.filter((item) => isOpenReviewStatus(item.reviewStatus)).length + report.allSubserviceFindings.filter((item) => isOpenReviewStatus(item.reviewStatus)).length;
  const sourceIssueCount = (report.sourceHealth || []).filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped').length;
  return calculateReportReadiness({
    hasReport: true,
    approvedEvidenceCount,
    openReviewCount,
    crawlWarningCount: report.crawlErrors?.length || 0,
    sourceIssueCount,
    aiEnabled: report.aiEnabled
  });
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
  return {
    ...withFindings,
    readiness,
    recommendedActions: recommendedActionsFor({ ...withFindings, readiness })
  };
}
