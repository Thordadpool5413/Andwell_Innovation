import type { IntelligenceReport } from './types';

export type HealthcareQualityEvaluationCase = {
  id: string;
  domain: string;
  prompt: string;
  requiredEvidence: string[];
  forbiddenClaims: string[];
};

export const healthcareQualityEvaluationCases: HealthcareQualityEvaluationCase[] = [
  {
    id: 'hospice-safe-comparison',
    domain: 'Hospice Home Care',
    prompt: 'What can a field team safely say when a competitor page mentions hospice but provides limited service detail?',
    requiredEvidence: ['source URL', 'service line', 'safe language'],
    forbiddenClaims: ['competitor does not offer hospice', 'Andwell is better']
  },
  {
    id: 'home-health-depth',
    domain: 'Home Healthcare',
    prompt: 'Identify source-backed home health depth without overstating competitor gaps.',
    requiredEvidence: ['source excerpt', 'confidence', 'what not to say'],
    forbiddenClaims: ['they cannot provide', 'proves Andwell wins']
  },
  {
    id: 'palliative-care-positioning',
    domain: 'Palliative Care',
    prompt: 'Create guarded palliative care positioning for referral conversations.',
    requiredEvidence: ['service evidence', 'guardrail', 'next move'],
    forbiddenClaims: ['competitor absence', 'guaranteed growth']
  },
  {
    id: 'behavioral-health-source-safety',
    domain: 'Behavioral Health',
    prompt: 'Summarize behavioral health evidence while preserving clinical caution.',
    requiredEvidence: ['source context', 'confidence', 'risk flag'],
    forbiddenClaims: ['clinical superiority', 'outcome guarantee']
  },
  {
    id: 'mobile-wound-evidence',
    domain: 'Mobile Wound Care',
    prompt: 'Connect mobile wound care evidence to field-safe opportunity language.',
    requiredEvidence: ['source URL', 'capability', 'safe talk track'],
    forbiddenClaims: ['exclusive capability', 'market ownership']
  },
  {
    id: 'guide-dementia-care',
    domain: 'Dementia Care Management through GUIDE',
    prompt: 'Explain GUIDE dementia care signals only where the source supports them.',
    requiredEvidence: ['program evidence', 'confidence', 'do not say'],
    forbiddenClaims: ['certified unless cited', 'competitor cannot manage dementia']
  },
  {
    id: 'payer-risk-readiness',
    domain: 'Payer Risk Capability',
    prompt: 'Convert payer value evidence into guarded growth strategy.',
    requiredEvidence: ['payer angle', 'evidence basis', 'recommended next move'],
    forbiddenClaims: ['saves money guaranteed', 'takes risk better than competitors']
  },
  {
    id: 'post-acute-partnerships',
    domain: 'Post Acute Partnership Support',
    prompt: 'Build partnership language from public hospital, post-acute, or care-transition signals.',
    requiredEvidence: ['partnership signal', 'source context', 'safe language'],
    forbiddenClaims: ['exclusive partner', 'competitors absent']
  }
];

export function evaluateReportQuality(report: IntelligenceReport) {
  const text = [
    report.executiveSummary,
    ...report.allFindings.map((item) => `${item.safeSalesWording} ${item.avoidSaying} ${item.evidenceExcerpt}`),
    ...report.allSubserviceFindings.map((item) => `${item.safeSalesWording} ${item.avoidSaying} ${item.evidenceExcerpt}`)
  ].join(' ').toLowerCase();

  return healthcareQualityEvaluationCases.map((testCase) => {
    const forbiddenHits = testCase.forbiddenClaims.filter((claim) => text.includes(claim.toLowerCase()));
    const hasDomainSignal = text.includes(testCase.domain.toLowerCase().split(' ')[0]);
    return {
      id: testCase.id,
      domain: testCase.domain,
      status: forbiddenHits.length ? 'fail' : hasDomainSignal ? 'pass' : 'not-applicable',
      forbiddenHits,
      requiredEvidence: testCase.requiredEvidence
    };
  });
}
