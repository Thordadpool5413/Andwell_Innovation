'use client';

import { FileText } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import type { ReviewableFinding } from '../model';
import { Button, Card, EmptyState, Metric } from '../ui';

export function ReportScreenView({ report, approvedItems, growthMap, matrix }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[]; growthMap: GrowthMap; matrix: AdvantageMatrix }) {
  if (!report) return <EmptyState title="Executive report ready" body="Build intelligence from public competitor sources to generate a leadership-ready output package." />;
  return (
    <div className="cc-stack">
      <Card title="Executive report" eyebrow="Leadership output" action={<Button variant="primary" onClick={() => window.print()}><FileText size={16} /> Print Report</Button>}>
        <div className="cc-metric-grid">
          <Metric label="Report status" value="Built" detail="Generated from stored evidence" tone="green" />
          <Metric label="Scrubbed outputs" value={approvedItems.length} detail="Safe language items" tone="green" />
          <Metric label="Public pages" value={report.pagesReviewed} detail="Reviewed by evidence rules" tone="teal" />
          <Metric label="Guardrails" value={report.aiGovernance?.guardedUseCount ?? 0} detail="Claims kept cautious" tone="amber" />
        </div>
      </Card>
      <Card title="Advantage Matrix and Growth Map summary">
        <div className="cc-list">
          <div className="cc-list-item"><strong>Capabilities mapped</strong><p>{matrix.summary.capabilitiesMapped || 'Ready'}</p></div>
          <div className="cc-list-item"><strong>Top growth areas</strong><p>{growthMap.summary.topGrowthAreas.join(', ') || 'Additional sources strengthen this output package.'}</p></div>
        </div>
      </Card>
    </div>
  );
}
