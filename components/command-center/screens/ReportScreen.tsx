'use client';

import { FileText, Printer, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import type { ReviewableFinding } from '../model';
import { Button, EmptyState, formatDate, number } from '../ui';

export function ReportScreenView({ report, approvedItems, growthMap, matrix }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[]; growthMap: GrowthMap; matrix: AdvantageMatrix }) {
  if (!report) return <EmptyState title="Executive report ready" body="Build intelligence from public competitor sources to generate a leadership-ready output package." />;
  const topFindings = approvedItems.slice(0, 5);
  const topArea = growthMap.areas[0];
  return (
    <div className="cc-workspace cc-report-workspace">
      <section className="cc-report-canvas">
        <header className="cc-report-cover-page">
          <div>
            <p className="cc-section-label">Leadership output</p>
            <h2>Andwell Intelligence Report</h2>
            <p>{report.executiveSummary}</p>
          </div>
          <Button variant="primary" onClick={() => window.print()}><Printer size={16} /> Print Report</Button>
        </header>

        <section className="cc-report-kpi-band">
          <article><strong>{report.competitorsAnalyzed}</strong><span>Competitors analyzed</span></article>
          <article><strong>{number(report.pagesReviewed)}</strong><span>Public pages reviewed</span></article>
          <article><strong>{matrix.summary.capabilitiesMapped}</strong><span>Capabilities mapped</span></article>
          <article><strong>{approvedItems.length}</strong><span>Source-backed outputs</span></article>
          <article><strong>{formatDate(report.generatedAt)}</strong><span>Package date</span></article>
        </section>

        <section className="cc-report-two-col">
          <ReportSection title="Market signal" body={report.expertBrief?.marketPosture || `Public source evidence was reviewed across ${report.competitorsAnalyzed} competitors and ${report.pagesReviewed} pages.`} />
          <ReportSection title="Andwell opportunity" body={topArea ? `${topArea.area}: ${topArea.safeTalkTrack}` : 'The opportunity model is ready to strengthen as more public source material is added.'} />
          <ReportSection title="Advantage Matrix summary" body={`${matrix.summary.capabilitiesMapped} capabilities mapped, ${matrix.summary.advantageSignals} Andwell advantage signals, and ${matrix.summary.evidenceLimited} evidence-limited cells.`} />
          <ReportSection title="Growth Map summary" body={`${growthMap.summary.fieldFocusZones.join(', ') || 'Field focus zones will rank after additional source evidence.'}`} />
          <ReportSection title="Payer value angle" body={topArea ? `Payer value potential is scored at ${topArea.payerValuePotential} for ${topArea.area}; use guarded language and connect to complex care management.` : 'Payer value angle should remain tied to source-backed care complexity evidence.'} />
          <ReportSection title="Partnership opportunity" body={topArea ? `Partnership potential is scored at ${topArea.partnershipPotential}; focus on care transitions, post acute relationships, and high acuity community care fit.` : 'Partnership opportunities will strengthen with hospital, payer, and service area source detail.'} />
        </section>

        <section className="cc-report-section-premium">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Field guidance</p>
              <h3>Safe language for teams</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="cc-report-guidance-grid">
            {topFindings.map((item) => (
              <article key={item.id}>
                <strong>{item.serviceLine}</strong>
                <span>{item.competitorName}</span>
                <p>{item.safeSalesWording}</p>
                <small>Do not say: {item.avoidSaying}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="cc-report-section-premium">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Recommended next actions</p>
              <h3>Leadership moves</h3>
            </div>
            <FileText size={20} />
          </div>
          <div className="cc-report-action-list">
            {(report.recommendedActions?.length ? report.recommendedActions : [
              { id: 'matrix', label: 'Use Advantage Matrix in referral strategy', detail: 'Lead with source-backed capability strengths.', target: 'strategy', priority: 'High' as const },
              { id: 'map', label: 'Focus field activity by Growth Map signal', detail: 'Prioritize high-opportunity and evidence-confident areas.', target: 'strategy', priority: 'High' as const },
              { id: 'guardrails', label: 'Keep all claims inside evidence guardrails', detail: 'Avoid unsupported competitor absence or superiority claims.', target: 'strategy', priority: 'Medium' as const }
            ]).slice(0, 5).map((action) => (
              <article key={action.id}>
                <strong>{action.label}</strong>
                <p>{action.detail}</p>
                <span>{action.priority}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function ReportSection({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
