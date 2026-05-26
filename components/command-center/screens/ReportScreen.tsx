'use client';

import { useState } from 'react';
import { Copy, Download, FileText, Printer, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import { fetchBriefingExport } from '../api';
import type { ReviewableFinding } from '../model';
import { Button, EmptyState, formatDate, number } from '../ui';

export function ReportScreenView({ report, approvedItems, growthMap, matrix }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[]; growthMap: GrowthMap; matrix: AdvantageMatrix }) {
  const [exportState, setExportState] = useState('');

  if (!report) return <EmptyState title="Executive report ready" body="Build intelligence from public competitor sources to generate a leadership-ready output package." />;
  const topFindings = approvedItems.slice(0, 5);
  const topArea = growthMap.areas[0];

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
            <p>{report.executiveSummary}</p>
          </div>
          <div className="cc-report-actions">
            <Button variant="secondary" onClick={copyBriefing}><Copy size={16} /> Copy Briefing</Button>
            <Button variant="secondary" onClick={downloadBriefing}><Download size={16} /> Download JSON</Button>
            <Button variant="primary" onClick={() => window.print()}><Printer size={16} /> Print Report</Button>
            {exportState ? <span>{exportState}</span> : null}
          </div>
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
