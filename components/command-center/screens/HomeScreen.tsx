'use client';

import type { ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  FileText,
  Filter,
  Map,
  MessageSquareText,
  Scale,
  Search,
  ShieldCheck,
  Users
} from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { CommandCenterState, ReviewableFinding, TabId } from '../model';
import {
  buildExecutiveSnapshot,
  buildFieldGuidancePreview,
  buildGrowthPreviewPoints,
  buildMatrixPreviewRows,
  buildPackageView
} from '../display';
import { Button, Notice, formatDate, number } from '../ui';

export function HomeScreen({
  state,
  approvedItems,
  matrix,
  growthMap,
  onBuild,
  onNavigate
}: {
  state: CommandCenterState;
  approvedItems: ReviewableFinding[];
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
  onBuild: () => void;
  onNavigate: (tab: TabId) => void;
}) {
  const report = state.currentReport;
  const hasReport = Boolean(report);
  const packageView = buildPackageView(report, matrix);
  const matrixRows = hasReport ? buildMatrixPreviewRows(report, matrix) : [];
  const growthPoints = hasReport ? buildGrowthPreviewPoints(report, growthMap) : [];
  const guidance = hasReport ? buildFieldGuidancePreview(report) : [];
  const executive = buildExecutiveSnapshot(report);
  const confidenceHigh = packageView.highConfidencePercent;
  const confidenceMedium = packageView.mediumConfidencePercent;
  const confidenceGuarded = Math.max(0, Math.min(100, 100 - confidenceHigh - confidenceMedium));
  const processRail = [
    { icon: FileText, title: 'Read sources', detail: 'Collect public competitor content' },
    { icon: Search, title: 'Extract evidence', detail: 'Identify services, proof, and positioning' },
    { icon: Filter, title: 'Scrub claims', detail: 'Remove unsupported or risky claims' },
    { icon: Scale, title: 'Compare capabilities', detail: 'Benchmark service depth and breadth' },
    { icon: Map, title: 'Map opportunity', detail: 'Connect capability signals to market opportunity' },
    { icon: BarChart3, title: 'Generate strategy', detail: 'Create safe growth plays and value angles' },
    { icon: Users, title: 'Coach field teams', detail: 'Turn insight into talk tracks' },
    { icon: FileText, title: 'Prepare report', detail: 'Package leadership-ready output' }
  ];

  return (
    <div className="cc-home-command cc-home-command-single">
      <section className="cc-home-canvas" aria-label="Andwell Intelligence Engine home">
        <div className="cc-home-hero-row cc-home-hero-row-clean">
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
            </div>
          </div>
          <div className="cc-home-meta cc-home-meta-readonly">
            <span>Latest package</span>
            <strong>{hasReport && report ? formatDate(report.generatedAt) : 'Build intelligence from public sources first.'}</strong>
          </div>
          <BuildingLineArt />
        </div>

        {!hasReport ? (
          <Notice
            title="Evidence intelligence ready"
            body="Build intelligence from public sources first."
            tone="amber"
          />
        ) : null}

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
            <span className="cc-readonly-note">Read-only previews. Build Intelligence creates the package.</span>
          </div>
          <div className="cc-preview-grid cc-preview-grid-balanced">
            <article className="cc-preview-card cc-preview-matrix">
              <header>
                <div>
                  <h2>Advantage Matrix</h2>
                  <span>Capability comparison</span>
                </div>
                <button type="button" onClick={() => onNavigate('matrix')}>Open <ArrowRight size={13} /></button>
              </header>
              {hasReport ? (
                <>
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
                  <footer>
                    <strong>{number(packageView.capabilities)} capabilities mapped</strong>
                    <span>{number(matrix.summary.advantageSignals)} advantage signals</span>
                  </footer>
                </>
              ) : (
                <OutcomeReadyState
                  icon={<Scale size={22} />}
                  title="Capability comparison ready"
                  body="The matrix will compare Andwell capabilities against public competitor evidence after the first build."
                />
              )}
            </article>

            <article className="cc-preview-card cc-preview-map">
              <header>
                <div>
                  <h2>Growth Map</h2>
                  <span>Market opportunity</span>
                </div>
                <button type="button" onClick={() => onNavigate('map')}>Open <ArrowRight size={13} /></button>
              </header>
              {hasReport ? (
                <>
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
                  <footer>
                    <strong>{number(growthMap.summary.fieldFocusZones.length)} field focus zones</strong>
                    <span>{number(growthMap.summary.evidenceLimitedAreas.length)} evidence-limited areas</span>
                  </footer>
                </>
              ) : (
                <OutcomeReadyState
                  icon={<Map size={22} />}
                  title="Market opportunity ready"
                  body="Growth areas, saturation signals, and field focus zones will populate from the completed source package."
                />
              )}
            </article>

            <article className="cc-preview-card cc-preview-guidance">
              <header>
                <div>
                  <h2>Field Guidance</h2>
                  <span>Safe talk tracks</span>
                </div>
                <button type="button" onClick={() => onNavigate('strategy')}>Open <ArrowRight size={13} /></button>
              </header>
              {hasReport ? (
                <>
                  <div className="cc-field-preview-list">
                    {guidance.map((item) => (
                      <div key={item.title}>
                        <MessageSquareText size={19} />
                        <p><strong>{item.title}</strong><span>{item.detail}</span></p>
                        <mark>{item.priority}</mark>
                      </div>
                    ))}
                  </div>
                  <footer>
                    <strong>{number(packageView.safeLanguageItems || approvedItems.length)} field plays ready</strong>
                    <span>{number(packageView.guardedPercent)}% guarded use</span>
                  </footer>
                </>
              ) : (
                <OutcomeReadyState
                  icon={<MessageSquareText size={22} />}
                  title="Field guidance ready"
                  body="Safe referral language and what-not-to-say guardrails will appear after public evidence is processed."
                />
              )}
            </article>

            <article className="cc-preview-card cc-preview-report">
              <header>
                <div>
                  <h2>Executive Report</h2>
                  <span>Leadership output</span>
                </div>
                <button type="button" onClick={() => onNavigate('report')}>Open <ArrowRight size={13} /></button>
              </header>
              {hasReport ? (
                <>
                  <div className="cc-report-snapshot">
                    <strong>{number(packageView.evidencePoints)}</strong>
                    <p>Evidence points extracted for the latest package</p>
                    <small>{executive.detail}</small>
                  </div>
                  <dl>
                    <div><dt>Top strategic signal</dt><dd>{executive.threat}</dd></div>
                    <div><dt>Biggest opportunity</dt><dd>{executive.opportunity}</dd></div>
                  </dl>
                  <footer><strong>Report available</strong><span>{report ? formatDate(report.generatedAt) : ''}</span></footer>
                </>
              ) : (
                <OutcomeReadyState
                  icon={<FileText size={22} />}
                  title="Leadership output ready"
                  body="The executive report will summarize market signal, Andwell opportunity, field guidance, and next moves."
                />
              )}
            </article>
          </div>
        </section>

        {hasReport ? (
          <section className="cc-package-band" aria-label="Latest intelligence package">
            <div>
              <p className="cc-section-label">Latest intelligence package</p>
              <div className="cc-package-band-stats">
                <article><strong>{number(packageView.competitors)}</strong><span>Competitors analyzed</span></article>
                <article><strong>{number(packageView.pages)}</strong><span>Pages reviewed</span></article>
                <article><strong>{number(packageView.capabilities)}</strong><span>Capabilities mapped</span></article>
                <article><strong>{number(packageView.evidencePoints)}</strong><span>Evidence points extracted</span></article>
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
                <span key={item}><ShieldCheck size={15} /> {item}</span>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}

function OutcomeReadyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="cc-outcome-ready">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{body}</p>
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
