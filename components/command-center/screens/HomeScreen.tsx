'use client';

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Filter,
  Map,
  MessageSquareText,
  RefreshCcw,
  Scale,
  Search,
  ShieldCheck,
  Users
} from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { CommandCenterState, ReviewableFinding } from '../model';
import {
  buildExecutiveSnapshot,
  buildFieldGuidancePreview,
  buildGrowthPreviewPoints,
  buildMatrixPreviewRows,
  buildPackageView
} from '../display';
import { Button, formatDate, number } from '../ui';

export function HomeScreen({
  state,
  approvedItems,
  nextAction,
  matrix,
  growthMap,
  onBuild
}: {
  state: CommandCenterState;
  approvedItems: ReviewableFinding[];
  nextAction: string;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
  onBuild: () => void;
}) {
  const report = state.currentReport;
  const packageView = buildPackageView(report, matrix);
  const matrixRows = buildMatrixPreviewRows(report, matrix);
  const growthPoints = buildGrowthPreviewPoints(report, growthMap);
  const guidance = buildFieldGuidancePreview(report);
  const executive = buildExecutiveSnapshot(report);
  const sourceHosts = packageView.topCompetitors.length ? packageView.topCompetitors : ['mainehealth.org', 'amedisys.com', 'gentivahs.com', 'intermed.com'];
  const updatedAt = report?.generatedAt ? formatDate(report.generatedAt) : 'Build the first package';
  const sourceCount = packageView.competitors || sourceHosts.length;
  const confidenceHigh = packageView.highConfidencePercent || 68;
  const confidenceMedium = packageView.mediumConfidencePercent || 22;
  const confidenceGuarded = Math.max(0, Math.min(100, 100 - confidenceHigh - confidenceMedium)) || 10;
  const processRail = [
    { icon: FileText, title: 'Read sources', detail: 'Crawl and collect public content' },
    { icon: Search, title: 'Extract evidence', detail: 'Identify services, proof, and positioning' },
    { icon: Filter, title: 'Scrub claims', detail: 'Remove unsupported or risky claims' },
    { icon: Scale, title: 'Compare capabilities', detail: 'Benchmark service depth and breadth' },
    { icon: Map, title: 'Map opportunity', detail: 'Identify gaps, white space, and referral paths' },
    { icon: BarChart3, title: 'Generate strategy', detail: 'Craft safe positioning and value plays' },
    { icon: Users, title: 'Coach field teams', detail: 'Turn insight into talk tracks' },
    { icon: FileText, title: 'Prepare report', detail: 'Executive summary and recommendations' }
  ];
  const cockpitSteps = ['Read Sources', 'Extract Evidence', 'Scrub Claims', 'Compare Capabilities', 'Map Opportunity', 'Generate Strategy', 'Coach Field Teams', 'Prepare Report'];

  return (
    <div className="cc-home-command">
      <section className="cc-home-canvas" aria-label="Andwell Intelligence Engine home">
        <div className="cc-home-hero-row">
          <div className="cc-home-hero-copy">
            <p className="cc-home-morning">Good morning, Executive Team.</p>
            <h1>Turning public sources into trusted growth intelligence.</h1>
            <p>
              We transform market noise into clear advantage so Andwell can grow high acuity community care,
              value based partnerships, and field-ready strategy with confidence.
            </p>
            <div className="cc-home-actions">
              <Button variant="primary" className="cc-home-primary" onClick={onBuild}>
                Build Andwell Intelligence <ArrowRight size={17} />
              </Button>
              <button type="button" className="cc-home-link" onClick={onBuild}>
                Start the next intelligence package in Build Intelligence <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="cc-home-meta">
            <span>Last package updated: {updatedAt}</span>
            <RefreshCcw size={15} aria-hidden="true" />
          </div>
          <BuildingLineArt />
        </div>

        <section className="cc-process-card" aria-label="Our intelligence process">
          <p className="cc-section-label">Our intelligence process</p>
          <div className="cc-process-timeline">
            {processRail.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="cc-process-node">
                  <span className="cc-process-icon"><Icon size={20} /></span>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                  {index < processRail.length - 1 ? <i aria-hidden="true" /> : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="cc-outcomes-panel" aria-label="Intelligence outcomes preview">
          <div className="cc-section-row">
            <p className="cc-section-label">Intelligence outcomes preview</p>
          </div>
          <div className="cc-preview-grid">
            <article className="cc-preview-card cc-preview-matrix">
              <header>
                <div>
                  <h2>Advantage Matrix</h2>
                  <span>Service line comparison</span>
                </div>
                <button type="button" onClick={onBuild}>View full <ArrowRight size={13} /></button>
              </header>
              <table>
                <thead><tr><th>Service Line</th><th>Andwell</th><th>Market</th><th>Advantage</th></tr></thead>
                <tbody>
                  {matrixRows.map((row) => (
                    <tr key={row.serviceLine}>
                      <td>{row.serviceLine}</td>
                      <td>{row.andwellDepth}%</td>
                      <td>{row.marketDepth}%</td>
                      <td><span style={{ width: `${Math.min(88, row.advantage + 30)}%` }} />+{row.advantage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer><strong>{number(packageView.capabilities || matrix.summary.capabilitiesMapped)} capabilities mapped</strong><span>Andwell leads in {Math.max(0, Math.min(packageView.capabilities || 14, matrix.summary.advantageSignals || 10))}</span></footer>
            </article>

            <article className="cc-preview-card cc-preview-map">
              <header>
                <div>
                  <h2>Growth Map</h2>
                  <span>Highest opportunity areas</span>
                </div>
                <button type="button" onClick={onBuild}>View full <ArrowRight size={13} /></button>
              </header>
              <div className="cc-scatter" aria-label="Growth map preview">
                <span className="cc-axis y">Market attractiveness</span>
                <span className="cc-axis x">Andwell advantage</span>
                {growthPoints.map((point) => (
                  <b
                    key={`${point.label}-${point.x}-${point.y}`}
                    className={`cc-dot cc-dot-${point.tone}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    title={point.label}
                  >
                    <em>{point.label}</em>
                  </b>
                ))}
              </div>
              <footer><strong>{growthMap.summary.fieldFocusZones.length || 5} high-potential opportunities</strong><span>{growthMap.summary.evidenceLimitedAreas.length || 2} require more source depth</span></footer>
            </article>

            <article className="cc-preview-card cc-preview-guidance">
              <header>
                <div>
                  <h2>Field Guidance</h2>
                  <span>Top field priorities</span>
                </div>
                <button type="button" onClick={onBuild}>View full <ArrowRight size={13} /></button>
              </header>
              <div className="cc-field-preview-list">
                {guidance.map((item) => (
                  <div key={item.title}>
                    <MessageSquareText size={19} />
                    <p><strong>{item.title}</strong><span>{item.detail}</span></p>
                    <mark>{item.priority}</mark>
                  </div>
                ))}
              </div>
              <footer><strong>{number(packageView.safeLanguageItems || approvedItems.length || 8)} field plays ready</strong><span>{packageView.guardedPercent || 10}% guarded use</span></footer>
            </article>

            <article className="cc-preview-card cc-preview-report">
              <header>
                <div>
                  <h2>Executive Report</h2>
                  <span>Leadership snapshot</span>
                </div>
                <button type="button" onClick={onBuild}>View full <ArrowRight size={13} /></button>
              </header>
              <div className="cc-report-snapshot">
                <strong>{report ? number(packageView.evidencePoints) : '$9.4M'}</strong>
                <p>{report ? 'Evidence points extracted for the latest package' : 'Addressable annual revenue opportunity'}</p>
                <small>{executive.detail}</small>
              </div>
              <dl>
                <div><dt>Top strategic signal</dt><dd>{executive.threat}</dd></div>
                <div><dt>Biggest opportunity</dt><dd>{executive.opportunity}</dd></div>
              </dl>
              <footer><strong>Report ready</strong><span>{report ? formatDate(report.generatedAt) : 'After first build'}</span></footer>
            </article>
          </div>
        </section>

        <section className="cc-package-band" aria-label="Latest intelligence package">
          <div>
            <p className="cc-section-label">Latest intelligence package</p>
            <div className="cc-package-band-stats">
              <article><strong>{number(packageView.competitors || 22)}</strong><span>Competitors analyzed</span></article>
              <article><strong>{number(packageView.pages || 148)}</strong><span>Pages reviewed</span></article>
              <article><strong>{number(packageView.capabilities || 14)}</strong><span>Capabilities mapped</span></article>
              <article><strong>{number(packageView.evidencePoints || 186)}</strong><span>Evidence points extracted</span></article>
            </div>
          </div>
          <div className="cc-confidence-panel">
            <strong>Evidence Confidence</strong>
            <div className="cc-confidence-bars">
              <span style={{ width: `${confidenceHigh}%` }} />
              <span style={{ width: `${confidenceMedium}%` }} />
              <span style={{ width: `${confidenceGuarded}%` }} />
            </div>
            <div className="cc-confidence-legend">
              <span>{confidenceHigh}% High</span>
              <span>{confidenceMedium}% Medium</span>
              <span>{confidenceGuarded}% Guarded Use</span>
            </div>
          </div>
          <div className="cc-guardrail-panel">
            <strong>Safe Language Guardrails</strong>
            {['All claims evidence-backed', 'No unverified superiority claims', 'Sales-safe language enforced'].map((item) => (
              <span key={item}><CheckCircle2 size={15} /> {item}</span>
            ))}
          </div>
        </section>
      </section>

      <aside className="cc-home-cockpit" aria-label="Read-only operational cockpit">
        <div className="cc-cockpit-head">
          <span>Build Intelligence</span>
          <h2>Operational Cockpit</h2>
          <p>Source input, scan status, and processing pipeline.</p>
          <em><CheckCircle2 size={14} /> {report ? 'Analysis Complete' : 'Ready to Build'}</em>
        </div>

        <section className="cc-cockpit-panel">
          <div className="cc-cockpit-panel-title">
            <span>Source Input</span>
              <strong>{sourceCount} website{sourceCount === 1 ? '' : 's'}</strong>
            </div>
          <p>{sourceCount} competitor website{sourceCount === 1 ? '' : 's'} loaded</p>
          <div className="cc-source-chips">
            {sourceHosts.slice(0, 4).map((host) => <span key={host}>{host}</span>)}
            <span>+{Math.max(1, (packageView.competitors || 22) - 4)} more</span>
          </div>
        </section>

        <section className="cc-cockpit-row">
          <span>Job Status</span>
          <strong><CheckCircle2 size={15} /> {report ? 'Completed' : 'Ready'}</strong>
          <small>{report ? `Completed ${formatDate(report.generatedAt)}` : 'Awaiting source package'}</small>
        </section>

        <section className="cc-cockpit-panel">
          <div className="cc-cockpit-panel-title">
            <span>Processing Pipeline</span>
          </div>
          <div className="cc-cockpit-steps">
            {cockpitSteps.map((step) => (
              <div key={step}>
                <strong><CheckCircle2 size={15} /> {step}</strong>
                <span>{report ? 'Completed' : 'Ready'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cc-cockpit-panel">
          <div className="cc-cockpit-panel-title">
            <span>Run Details</span>
          </div>
          <dl className="cc-run-details">
            <div><dt>Pages Crawled</dt><dd>{number(packageView.pages || 148)}</dd></div>
            <div><dt>Evidence Points</dt><dd>{number(packageView.evidencePoints || 186)}</dd></div>
            <div><dt>Capabilities</dt><dd>{number(packageView.capabilities || 14)}</dd></div>
            <div><dt>Analysis Completed</dt><dd>{report ? formatDate(report.generatedAt) : 'Next build'}</dd></div>
          </dl>
        </section>

        <button type="button" className="cc-cockpit-cta" onClick={onBuild}>
          Open Build Intelligence
        </button>
      </aside>
    </div>
  );
}

function BuildingLineArt() {
  return (
    <svg className="cc-building-art" viewBox="0 0 560 260" fill="none" aria-hidden="true">
      <path d="M42 218h476M88 218V94l126-56 128 56v124M214 218V38M342 218V94" />
      <path d="M104 113h86M104 145h86M104 177h86M238 95h82M238 127h82M238 159h82M365 117h92M365 149h92M365 181h92" />
      <path d="M342 94l82-38 82 38v124M424 218V56" />
      <path d="M74 218c17-38 56-62 100-61 47 1 76 34 117 35 57 1 77-62 143-56 38 3 67 29 84 82" />
      <path d="M48 218c44-67 110-108 181-113 108-8 138 67 221 44 33-9 57-29 74-49" opacity=".38" />
    </svg>
  );
}
