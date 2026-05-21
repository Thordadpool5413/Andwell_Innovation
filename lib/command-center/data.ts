import type { View, RoleView } from './types';

export const nav: { key: View; label: string; note: string }[] = [
  { key: 'dashboard', label: 'Command Center', note: 'Executive snapshot' },
  { key: 'growth', label: 'Growth Command', note: 'Scenario intelligence' },
  { key: 'board', label: 'Board Room', note: 'Operating plan' },
  { key: 'launch', label: 'Launch Plan', note: 'Staffing and timeline' },
  { key: 'expert', label: 'Foremost Expert', note: 'Strategy brain' },
  { key: 'ai', label: 'Extracted Intelligence', note: 'AI evidence output' },
  { key: 'prompt', label: 'Methodology', note: 'Governed logic' },
  { key: 'intake', label: 'Competitor Intake', note: 'Add up to 25 URLs' },
  { key: 'matrix', label: 'Evidence Matrix', note: 'Filter and compare' },
  { key: 'battlecards', label: 'Battlecards', note: 'Field coaching' },
  { key: 'reports', label: 'Reports', note: 'Stored intelligence' },
  { key: 'ask', label: 'Ask the Hub', note: 'Evidence based answers' },
  { key: 'catalog', label: 'Andwell Catalog', note: 'Baseline truth' },
  { key: 'diagnostics', label: 'System Check', note: 'Deployment proof' },
  { key: 'growth-hub', label: 'Growth Plan', note: 'Full growth dashboard' }
];

export const roleGuidance: Record<RoleView, { headline: string; focus: string; action: string }> = {
  Executive: {
    headline: 'Leadership brief mode',
    focus: 'Prioritizes threat level, market signal, differentiation, and what needs a leadership decision.',
    action: 'Start with the Command Center, review the top threat, then export or share the executive readout.'
  },
  'Sales Leader': {
    headline: 'Coaching mode',
    focus: 'Prioritizes rep talk tracks, service line opportunities, manager review items, and practical follow up.',
    action: 'Use Battlecards and the Evidence Matrix to coach around safe positioning and specific referral situations.'
  },
  'Sales Rep': {
    headline: 'Field mode',
    focus: 'Prioritizes simple language, referral questions, objection responses, and what not to say.',
    action: 'Use Ask the Hub before calls and lead with verified Andwell depth rather than broad competitor claims.'
  },
  Admin: {
    headline: 'Governance mode',
    focus: 'Prioritizes diagnostics, route health, review risk, data freshness, and evidence quality.',
    action: 'Run System Check, review risky findings, and confirm the app is returning JSON after every deployment.'
  }
};
