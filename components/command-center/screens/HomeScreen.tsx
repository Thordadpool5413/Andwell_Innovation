'use client';

import { ArrowRight, BarChart3, Brain, FileText, UploadCloud } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { CommandCenterState, ReviewableFinding, TabId } from '../model';
import { Badge, Button, Card, Metric, Notice, formatDate, number } from '../ui';

export function HomeScreen({
  state,
  approvedItems,
  nextAction,
  sourceText,
  setSourceText,
  scanBusy,
  scanMessage,
  onScan,
  onTab,
  matrix,
  growthMap,
  scanPercent
}: {
  state: CommandCenterState;
  approvedItems: ReviewableFinding[];
  nextAction: string;
  sourceText: string;
  setSourceText: (value: string) => void;
  scanBusy: boolean;
  scanMessage: string;
  onScan: () => void;
  onTab: (tab: TabId) => void;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
  scanPercent: number;
}) {
  const report = state.currentReport;
  const approvedPreview = approvedItems.slice(0, 3);
  const pagesReviewed = report?.pagesReviewed || 0;
  const sourceCount = report?.sourceHealth?.filter((source) => source.status === 'crawled' || source.status === 'accepted').length || state.competitors.length;
  const productCards = [
    {
      title: 'What',
      body: 'The system turns public market evidence into safe, usable Andwell growth intelligence.'
    },
    {
      title: 'Why',
      body: 'Andwell needs repeatable intelligence for partnerships, payer value, service positioning, and high-acuity community care growth.'
    },
    {
      title: 'How',
      body: 'The engine ingests sources, scrubs unsupported claims, maps evidence to capabilities, compares competitors, and produces leadership-ready outputs.'
    }
  ];

  return (
    <div className="cc-stack">
      <section className="cc-hero-panel cc-command-hero">
        <div>
          <span className="cc-hero-kicker">Andwell Innovation and Growth</span>
          <h2 className="cc-hero-quote">Innovation and Growth is where Andwell Health Partners turns vision into infrastructure. We are building the future of high acuity community care, creating post acute partnerships that make us essential to Maine, connecting complex services through technology, and developing the value based contracting model that allows us to take risk, deliver better outcomes, save payers money, and grow because we are built for the complexity others cannot manage</h2>
          <p>This intelligence engine converts public sources into scrubbed evidence, strategy, coaching language, and executive output in one guided workflow.</p>
          <div className="cc-action-row">
            <Button variant="primary" onClick={() => onTab('sources')}><UploadCloud size={16} /> Build Andwell Intelligence</Button>
            <Button onClick={() => onTab('strategy')}><BarChart3 size={16} /> View Strategy</Button>
            <Button onClick={() => onTab('report')}><FileText size={16} /> Executive Report</Button>
          </div>
        </div>
        <div className="cc-status-panel">
          <Badge tone="green">Trusted output engine</Badge>
          <strong>{report ? 'Intelligence package built' : 'Intelligence package ready'}</strong>
          <span>
            {report ? (
              <>
                Last build {formatDate(report.generatedAt)}
                <br />
                {pagesReviewed} pages reviewed across {sourceCount || report.competitorsAnalyzed} source{sourceCount === 1 ? '' : 's'}
              </>
            ) : 'Ready for source intelligence. Enter public competitor sources to generate the first package.'}
          </span>
          <div className="cc-status-list">
            <span>Evidence guardrails active</span>
            <span>Field guidance ready</span>
            <span>Executive output ready</span>
          </div>
          {state.scanStatus && state.scanStatus !== 'completed' ? (
            <div className="cc-live-progress">
              <strong>{state.scanStatus === 'running' ? 'Building intelligence package' : 'Source processing queued'}</strong>
              <div className="cc-progress"><span className="cc-progress-fill cc-progress-blue" style={{ width: `${scanPercent}%` }} /></div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="cc-metric-grid">
        <Metric label="Built outputs" value={approvedItems.length || 'Ready'} detail={approvedItems.length ? 'Trusted source-backed items' : 'Output engine ready to build'} tone="green" />
        <Metric label="Competitors compared" value={report?.competitorsAnalyzed || 'Ready'} detail="Capability comparison surface" tone="blue" />
        <Metric label="Growth areas" value={growthMap.summary.topGrowthAreas.length || 'Ready'} detail="Market opportunity ranking" tone="teal" />
        <Metric label="Guarded claims" value={report?.aiGovernance?.guardedUseCount ?? 'Ready'} detail="Safety language constraints" tone="amber" />
      </div>

      <div className="cc-dashboard-grid cc-dashboard-primary">
        <Card title="Build Intelligence cockpit" eyebrow="Primary workflow">
          <div className="cc-next-action">
            <Brain size={20} />
            <div>
              <strong>Build Andwell Intelligence</strong>
              <p>{nextAction}</p>
            </div>
          </div>
          <label className="cc-label" htmlFor="dashboard-source-input">Public competitor sources</label>
          <textarea
            id="dashboard-source-input"
            className="cc-textarea compact"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="https://competitor.org/services"
          />
          <div className="cc-action-row">
            <Button variant="primary" onClick={onScan} disabled={scanBusy}>
              <UploadCloud size={16} /> {scanBusy ? 'Building intelligence...' : 'Build Andwell Intelligence'}
            </Button>
            <Button onClick={() => onTab('sources')}>
              <ArrowRight size={15} /> Open Build Intelligence
            </Button>
          </div>
          {scanMessage ? <Notice title={scanBusy ? 'Intelligence build running' : 'Build status'} body={scanMessage} tone={scanBusy ? 'blue' : 'green'} /> : null}
        </Card>

        <Card title="Recent field-ready outputs" action={<Badge tone="blue">{approvedPreview.length} previewed</Badge>}>
          {approvedPreview.length ? (
            <div className="cc-priority-list">
              {approvedPreview.map((item, index) => (
                <div className="cc-priority-item" key={item.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.competitorName} | {item.serviceLine}</strong>
                    <p>{item.safeSalesWording}</p>
                  </div>
                  <Badge tone="teal">{item.evidenceStrength || 'Evidence-backed'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <Notice title="Output package ready" body="Build intelligence to populate field language, strategic angles, and leadership output previews." tone="blue" />
          )}
        </Card>
      </div>

      <div className="cc-product-grid">
        {productCards.map((item) => (
          <div key={item.title} className="cc-product-card">
            <span>{item.title}</span>
            <p>{item.body}</p>
          </div>
        ))}
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Advantage Matrix preview" eyebrow="Capability comparison">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Capabilities mapped</strong><p>{matrix.summary.capabilitiesMapped || 'Ready to compare Andwell capabilities'}</p></div>
            <div className="cc-list-item"><strong>Competitors compared</strong><p>{matrix.summary.competitorsCompared || 'Capability matrix ready to build'}</p></div>
            <div className="cc-list-item"><strong>Andwell advantages</strong><p>{matrix.summary.advantageSignals || 'Evidence guardrails active'}</p></div>
          </div>
        </Card>
        <Card title="Growth Map preview" eyebrow="Market opportunity">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Top growth areas</strong><p>{growthMap.summary.topGrowthAreas.join(', ') || 'Ready to map growth opportunities'}</p></div>
            <div className="cc-list-item"><strong>Saturated areas</strong><p>{growthMap.summary.saturatedAreas.join(', ') || 'Market opportunity engine ready'}</p></div>
            <div className="cc-list-item"><strong>Field focus zones</strong><p>{growthMap.summary.fieldFocusZones.join(', ') || 'Capability geography ready to build'}</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
