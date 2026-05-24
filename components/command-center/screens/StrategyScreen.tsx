'use client';

import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import { Button, Card, EmptyState, Metric, number } from '../ui';

export function StrategyScreenView({ report, onBuild, matrix, growthMap }: { report: IntelligenceReport | null; onBuild: () => void; matrix: AdvantageMatrix; growthMap: GrowthMap }) {
  if (!report) {
    return <EmptyState title="Strategy builder ready" body="Enter public sources and build intelligence to generate growth plays, field guidance, and leadership strategy outputs." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />;
  }
  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Competitors" value={report.competitorsAnalyzed} detail="Analyzed in latest report" tone="blue" />
        <Metric label="Pages reviewed" value={number(report.pagesReviewed)} detail="Public evidence pages" tone="teal" />
        <Metric label="Matched services" value={report.matchedServiceFindings} detail="Clearly offered by competitors" tone="green" />
        <Metric label="Evidence guardrails" value={report.aiGovernance?.guardedUseCount ?? 0} detail="Claims kept in safe language" tone="amber" />
      </div>
      <Card title="Matrix and map strategy signals" eyebrow="What and where">
        <div className="cc-list">
          <div className="cc-list-item"><strong>Capability comparison</strong><p>{matrix.summary.capabilitiesMapped} capabilities mapped across {matrix.summary.competitorsCompared || 'active'} competitors.</p></div>
          <div className="cc-list-item"><strong>Top growth opportunities</strong><p>{growthMap.summary.topGrowthAreas.join(', ') || 'Run source intake to rank growth areas.'}</p></div>
          <div className="cc-list-item"><strong>Field focus zones</strong><p>{growthMap.summary.fieldFocusZones.join(', ') || 'Growth map ready to build from source evidence.'}</p></div>
        </div>
      </Card>
    </div>
  );
}
