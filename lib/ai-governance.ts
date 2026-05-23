import type {
  AIReliability,
  AIRecommendedUse,
  EvidenceStrength,
  FieldRisk,
  Finding,
  RecommendedReviewAction,
  ReviewStatus,
  SubserviceFinding
} from './types';

export type GovernanceProjection = {
  aiReliability: AIReliability;
  recommendedUse: AIRecommendedUse;
  usageGuidance: string;
};

function reliabilityFromRiskAndStrength(fieldRisk: FieldRisk, evidenceStrength: EvidenceStrength): AIReliability {
  if (fieldRisk === 'Low' && evidenceStrength === 'Strong') return 'High';
  if (fieldRisk === 'High' || evidenceStrength === 'Weak' || evidenceStrength === 'Missing') return 'Low';
  return 'Medium';
}

function recommendedUseFromSignals(input: {
  risk: FieldRisk;
  strength: EvidenceStrength;
  reviewAction?: RecommendedReviewAction;
  status: ReviewStatus;
}): AIRecommendedUse {
  if (input.reviewAction === 'Reject' || input.status === 'Rejected') return 'Avoid claim';
  if (input.risk === 'High' || input.reviewAction === 'Investigate') return 'Investigate first';
  if (input.strength === 'Strong' && (input.status === 'Sales usable with evidence' || input.status === 'Approved for sales use')) {
    return 'Use confidently';
  }
  return 'Use with guardrails';
}

export function projectLegacyReviewToGovernance(item: Finding | SubserviceFinding): GovernanceProjection {
  const risk = item.fieldRisk || 'Medium';
  const strength = item.evidenceStrength || 'Moderate';
  const aiReliability = item.aiReliability || reliabilityFromRiskAndStrength(risk, strength);
  const recommendedUse = item.recommendedUse || recommendedUseFromSignals({
    risk,
    strength,
    reviewAction: item.recommendedReviewAction,
    status: item.reviewStatus
  });

  const usageGuidance = item.usageGuidance || (() => {
    if (recommendedUse === 'Use confidently') return 'Source-backed and fit for direct field language.';
    if (recommendedUse === 'Use with guardrails') return 'Use cautious language and avoid absolute competitor claims.';
    if (recommendedUse === 'Investigate first') return 'Run a focused source refresh before field use.';
    return 'Do not use this claim in field messaging until stronger public evidence exists.';
  })();

  return { aiReliability, recommendedUse, usageGuidance };
}
