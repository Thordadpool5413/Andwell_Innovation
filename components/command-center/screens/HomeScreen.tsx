'use client';

import { BarChart3, FileText, Map, ShieldCheck, UploadCloud } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { CommandCenterState, ReviewableFinding } from '../model';
import { userCopy } from '../copy';
import { Badge, Card, Notice, formatDate } from '../ui';

export function HomeScreen({
  state,
  approvedItems,
  nextAction,
  matrix,
  growthMap,
  scanPercent
}: {
  state: CommandCenterState;
  approvedItems: ReviewableFinding[];
  nextAction: string;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
  scanPercent: number;
}) {
  const report = state.currentReport;
  const approvedPreview = approvedItems.slice(0, 3);
  const pagesReviewed = report?.pagesReviewed || 0;
  const sourceCount = report?.sourceHealth?.filter((source) => source.status === 'crawled' || source.status === 'accepted').length || state.competitors.length;
  const processRail = [
    'Reading public sources',
    'Extracting service evidence',
    'Scrubbing unsupported claims',
    'Connecting evidence to Andwell capabilities',
    'Building capability comparison',
    'Mapping growth opportunities',
    'Building field-safe language',
    'Preparing executive output'
  ];
  const topGrowth = growthMap.summary.topGrowthAreas.slice(0, 3);
  const topSaturated = growthMap.summary.saturatedAreas.slice(0, 3);

  return (
    <div className="cc-stack">
      <section className="cc-hero-panel cc-command-hero">
        <div>
          <span className="cc-hero-kicker">Andwell Innovation and Growth</span>
          <h2 className="cc-hero-quote">Innovation and Growth is where Andwell Health Partners turns vision into infrastructure. We are building the future of high acuity community care, creating post acute partnerships that make us essential to Maine, connecting complex services through technology, and developing the value based contracting model that allows us to take risk, deliver better outcomes, save payers money, and grow because we are built for the complexity others cannot manage</h2>
          <p>The system turns public evidence into trusted growth intelligence for capability positioning, geographic opportunity, field language, and leadership decisions.</p>
          <div className="cc-static-pills">
            <span><UploadCloud size={15} /> Build Intelligence</span>
            <span><ShieldCheck size={15} /> Advantage Matrix</span>
            <span><Map size={15} /> Growth Map</span>
          </div>
        </div>
        <div className="cc-status-panel">
          <Badge tone="green">Trusted output engine</Badge>
          <strong>{report ? 'Latest intelligence package active' : 'Intelligence package ready to build'}</strong>
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
      <Card title="How the system works" eyebrow="AI-owned process">
        <div className="cc-process-rail">
          {processRail.map((step, index) => (
            <div key={step} className="cc-process-step">
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="cc-dashboard-grid cc-dashboard-primary">
        <Card title={userCopy.home.latestPackageTitle} eyebrow="Primary workflow">
          <div className="cc-next-action">
            <strong>Workflow command center</strong>
            <p>{nextAction}</p>
          </div>
          <Notice
            title={userCopy.home.processingLocationNoticeTitle}
            body={userCopy.home.processingLocationNoticeBody}
            tone="blue"
          />
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

      <div className="cc-dashboard-grid">
        <Card title="Advantage Matrix preview" eyebrow="Capability comparison">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Capabilities mapped</strong><p>{matrix.summary.capabilitiesMapped || userCopy.home.matrixFallbackCapabilities}</p></div>
            <div className="cc-list-item"><strong>Competitors compared</strong><p>{matrix.summary.competitorsCompared || userCopy.home.matrixFallbackCompetitors}</p></div>
            <div className="cc-list-item"><strong>Andwell advantages</strong><p>{matrix.summary.advantageSignals || userCopy.home.matrixFallbackAdvantages}</p></div>
          </div>
        </Card>
        <Card title="Growth Map preview" eyebrow="Market opportunity">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Top growth areas</strong><p>{topGrowth.join(', ') || userCopy.home.mapFallbackGrowth}</p></div>
            <div className="cc-list-item"><strong>Saturated areas</strong><p>{topSaturated.join(', ') || userCopy.home.mapFallbackSaturation}</p></div>
            <div className="cc-list-item"><strong>Field focus zones</strong><p>{growthMap.summary.fieldFocusZones.join(', ') || userCopy.home.mapFallbackField}</p></div>
          </div>
        </Card>
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Field guidance preview" eyebrow="What teams can use now">
          {approvedPreview.length ? (
            <div className="cc-list">
              {approvedPreview.map((item) => (
                <div className="cc-list-item" key={`guidance-${item.id}`}>
                  <strong>{item.competitorName} | {item.serviceLine}</strong>
                  <p>{item.safeSalesWording}</p>
                </div>
              ))}
            </div>
          ) : (
            <Notice title="Field guidance ready" body="Build intelligence to generate safe talk tracks, questions to ask, and strategic angles." tone="blue" />
          )}
        </Card>
        <Card title="Executive output preview" eyebrow="Leadership summary">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Executive summary</strong><p>{report?.executiveSummary || 'Build intelligence to generate the latest executive summary package.'}</p></div>
            <div className="cc-list-item"><strong>Strategy next move</strong><p>{nextAction}</p></div>
            <div className="cc-list-item"><strong>Report package</strong><p>{report ? 'Leadership output package is available now.' : 'Executive report engine ready to build.'}</p></div>
          </div>
          <div className="cc-static-pills">
            <span><BarChart3 size={15} /> Strategy available</span>
            <span><FileText size={15} /> Executive report available</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
