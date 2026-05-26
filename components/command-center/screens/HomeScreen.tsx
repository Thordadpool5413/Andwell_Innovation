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
import type { TabId } from '../model';
import type { IntelligenceDisplayModel } from '../intelligence-display';
import { Button, Notice, formatDate, number } from '../ui';

export function HomeScreen({
  display,
  onBuild,
  onNavigate
}: {
  display: IntelligenceDisplayModel;
  onBuild: () => void;
  onNavigate: (tab: TabId) => void;
}) {
  const hasReport = display.hasReport;
  const confidenceGuarded = Math.max(0, Math.min(100, 100 - display.package.highConfidencePercent - display.package.mediumConfidencePercent));
  const topCapabilities = display.capabilities.slice(0, 5);
  const topTerritories = display.territories.slice(0, 5);
  const fieldGuidance = display.fieldGuidance.slice(0, 3);
  const evidenceDigest = display.evidenceDigest.slice(0, 4);
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
              We transform market evidence into clear advantage so Andwell can grow high acuity community care,
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
            <strong>{hasReport ? formatDate(display.package.generatedAt) : 'Build intelligence from public sources first.'}</strong>
          </div>
          <BuildingLineArt />
        </div>

        {!hasReport ? <Notice title="Evidence intelligence ready" body="Build intelligence from public sources first." tone="amber" /> : null}

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

        <section className="cc-home-intel-summary" aria-label="Source evidence summary">
          <div>
            <p className="cc-section-label">Evidence summary</p>
            <h2>{hasReport ? 'Latest package intelligence' : 'Evidence package will appear here after the first build.'}</h2>
          </div>
          {hasReport ? (
            <div className="cc-home-evidence-grid">
              {evidenceDigest.map((item) => (
                <article key={`home-evidence-${item.id}`}>
                  <strong>{item.competitorName}</strong>
                  <span>{item.serviceLine}</span>
                  <p>{item.excerpt}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="cc-home-evidence-ready">The first intelligence package will show source excerpts, competitor signals, capability matches, field language, and leadership-ready next moves.</p>
          )}
        </section>

        <section className="cc-outcomes-panel" aria-label="Intelligence outcomes preview">
          <div className="cc-section-row">
            <p className="cc-section-label">Intelligence outcomes preview</p>
            <span className="cc-readonly-note">Read-only previews. Build Intelligence creates the package.</span>
          </div>
          <div className="cc-preview-grid cc-preview-grid-balanced">
            <OutcomeCard title="Advantage Matrix" subtitle="Capability comparison" onOpen={() => onNavigate('matrix')}>
              {hasReport ? (
                <div className="cc-home-mini-table">
                  {topCapabilities.map((item) => (
                    <div key={`home-cap-${item.capability}`}>
                      <strong>{item.capability}</strong>
                      <span>{number(item.evidenceCount)} evidence items</span>
                      <em>{item.advantages} advantage signals</em>
                    </div>
                  ))}
                </div>
              ) : (
                <OutcomeReadyState icon={<Scale size={22} />} title="Capability comparison ready" body="The matrix will compare Andwell capabilities against public competitor evidence." />
              )}
            </OutcomeCard>

            <OutcomeCard title="Growth Map" subtitle="Market opportunity" onOpen={() => onNavigate('map')}>
              {hasReport ? (
                <div className="cc-home-territory-preview">
                  {topTerritories.map((area) => (
                    <article key={`home-area-${area.area}`}>
                      <strong>{area.area}</strong>
                      <span>{area.signal}</span>
                      <ProgressBar value={area.scores.growth} />
                    </article>
                  ))}
                </div>
              ) : (
                <OutcomeReadyState icon={<Map size={22} />} title="Market opportunity ready" body="Growth areas, saturation signals, and field focus zones will populate from source evidence." />
              )}
            </OutcomeCard>

            <OutcomeCard title="Field Guidance" subtitle="Safe talk tracks" onOpen={() => onNavigate('strategy')}>
              {hasReport ? (
                <div className="cc-field-preview-list">
                  {fieldGuidance.map((item) => (
                    <div key={`home-field-${item.id}`}>
                      <MessageSquareText size={19} />
                      <p><strong>{item.capability}</strong><span>{item.safeTalkTrack}</span></p>
                      <mark>{item.priority}</mark>
                    </div>
                  ))}
                </div>
              ) : (
                <OutcomeReadyState icon={<MessageSquareText size={22} />} title="Field guidance ready" body="Safe referral language and what-not-to-say guardrails will appear after processing." />
              )}
            </OutcomeCard>

            <OutcomeCard title="Executive Report" subtitle="Leadership output" onOpen={() => onNavigate('report')}>
              {hasReport ? (
                <div className="cc-report-snapshot cc-report-snapshot-rich">
                  <strong>{number(display.package.evidencePoints)}</strong>
                  <p>Evidence points available for the latest package</p>
                  <small>{display.executive.marketSignal}</small>
                  <small>{display.executive.andwellOpportunity}</small>
                </div>
              ) : (
                <OutcomeReadyState icon={<FileText size={22} />} title="Leadership output ready" body="The executive report will summarize market signal, opportunity, field guidance, and next moves." />
              )}
            </OutcomeCard>
          </div>
        </section>

        {hasReport ? (
          <section className="cc-package-band" aria-label="Latest intelligence package">
            <div>
              <p className="cc-section-label">Latest intelligence package</p>
              <div className="cc-package-band-stats">
                <article><strong>{number(display.package.competitors)}</strong><span>Competitors analyzed</span></article>
                <article><strong>{number(display.package.pages)}</strong><span>Pages reviewed</span></article>
                <article><strong>{number(display.package.capabilities)}</strong><span>Capabilities mapped</span></article>
                <article><strong>{number(display.package.evidencePoints)}</strong><span>Evidence points</span></article>
              </div>
            </div>
            <div className="cc-confidence-panel">
              <strong>Evidence Confidence</strong>
              <div className="cc-confidence-bars">
                <span style={{ width: `${display.package.highConfidencePercent}%` }} />
                <span style={{ width: `${display.package.mediumConfidencePercent}%` }} />
                <span style={{ width: `${confidenceGuarded}%` }} />
              </div>
              <div className="cc-confidence-legend">
                <span>{display.package.highConfidencePercent}% High</span>
                <span>{display.package.mediumConfidencePercent}% Medium</span>
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

function OutcomeCard({ title, subtitle, onOpen, children }: { title: string; subtitle: string; onOpen: () => void; children: ReactNode }) {
  return (
    <article className="cc-preview-card cc-preview-card-rich">
      <header>
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        <button type="button" onClick={onOpen}>Open <ArrowRight size={13} /></button>
      </header>
      {children}
    </article>
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

function ProgressBar({ value }: { value: number }) {
  return <span className="cc-home-progress"><i style={{ width: `${Math.max(6, Math.min(100, value))}%` }} /></span>;
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
