'use client';

import { useState } from 'react';
import { Copy, Download, FileText, Printer, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import { fetchBriefingExport } from '../api';
import type { ReviewableFinding } from '../model';
import type { IntelligenceDisplayModel } from '../intelligence-display';
import { Button, EmptyState, formatDate, number } from '../ui';

export function ReportScreenView({
  report,
  approvedItems,
  growthMap,
  matrix,
  display
}: {
  report: IntelligenceReport | null;
  approvedItems: ReviewableFinding[];
  growthMap: GrowthMap;
  matrix: AdvantageMatrix;
  display: IntelligenceDisplayModel;
}) {
  const [exportState, setExportState] = useState('');

  if (!report) {
    return (
      <EmptyState
        title="Evidence intelligence ready"
        body="Build intelligence from public sources first."
        action={<Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print Report</Button>}
      />
    );
  }
  const topFindings = display.fieldGuidance.slice(0, 6);
  const topArea = display.territories[0];

  async function getBriefing() {
    const payload = await fetchBriefingExport(report?.id);
    if (!payload.briefing) throw new Error(payload.message || 'Briefing is not available yet.');
    return payload.briefing;
  }

  async function copyBriefing() {
    try {
      setExportState('Preparing briefing copy...');
      const briefing = await getBriefing();
      await navigator.clipboard.writeText(JSON.stringify(briefing, null, 2));
      setExportState('Briefing copied for leadership materials.');
    } catch {
      setExportState('Build a fresh intelligence package before exporting briefing content.');
    }
  }

  async function downloadBriefing() {
    try {
      setExportState('Preparing briefing download...');
      const briefing = await getBriefing();
      const blob = new Blob([JSON.stringify(briefing, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `andwell-briefing-${report?.id || 'latest'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportState('Briefing JSON downloaded.');
    } catch {
      setExportState('Build a fresh intelligence package before downloading briefing content.');
    }
  }

  return (
    <div className="cc-workspace cc-report-workspace">
      <section className="cc-report-canvas">
        <header className="cc-report-cover-page">
          <div>
            <p className="cc-section-label">Leadership output</p>
            <h2>Andwell Intelligence Report</h2>
            <p>{display.executive.summary}</p>
          </div>
          <div className="cc-report-actions">
            <Button variant="secondary" onClick={copyBriefing}><Copy size={16} /> Copy Briefing</Button>
            <Button variant="secondary" onClick={downloadBriefing}><Download size={16} /> Download JSON</Button>
            <Button variant="primary" onClick={() => window.print()}><Printer size={16} /> Print Report</Button>
            {exportState ? <span>{exportState}</span> : null}
          </div>
        </header>

        <section className="cc-report-kpi-band">
          <article><strong>{display.package.competitors}</strong><span>Competitors analyzed</span></article>
          <article><strong>{number(display.package.pages)}</strong><span>Public pages reviewed</span></article>
          <article><strong>{matrix.summary.capabilitiesMapped}</strong><span>Capabilities mapped</span></article>
          <article><strong>{number(display.package.evidencePoints)}</strong><span>Evidence items</span></article>
          <article><strong>{formatDate(report.generatedAt)}</strong><span>Package date</span></article>
        </section>

        <section className="cc-report-two-col">
          <ReportSection title="Market signal" body={display.executive.marketSignal} />
          <ReportSection title="Andwell opportunity" body={display.executive.andwellOpportunity} />
          <ReportSection title="Advantage Matrix summary" body={display.executive.matrixSummary} />
          <ReportSection title="Growth Map summary" body={display.executive.growthMapSummary} />
          <ReportSection title="Evidence reviewed" body={display.executive.evidenceReviewed} />
          <ReportSection title="Strategic implications" body={display.executive.strategicImplications} />
          <ReportSection title="Payer value angle" body={topArea ? `Payer value potential is scored at ${topArea.scores.payer} for ${topArea.area}; use guarded language and connect to complex care management.` : 'Payer value angle should remain tied to source-backed care complexity evidence.'} />
          <ReportSection title="Partnership opportunity" body={topArea ? `Partnership potential is scored at ${topArea.scores.partnership}; focus on care transitions, post acute relationships, and high acuity community care fit.` : 'Partnership opportunities will strengthen with hospital, payer, and service area source detail.'} />
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
                <strong>{item.capability}</strong>
                <span>{item.competitorName} | {item.marketArea}</span>
                <p>{item.safeTalkTrack}</p>
                <small>Do not say: {item.whatNotToSay}</small>
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
            {(display.executive.recommendedActions.length ? display.executive.recommendedActions.map((action, index) => ({ id: `${action.label}-${index}`, label: action.label, detail: action.detail, priority: action.priority })) : [
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
