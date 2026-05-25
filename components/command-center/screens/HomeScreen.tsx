'use client';

import { ArrowRight, BarChart3, FileText, Map, MessageSquareText, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { CommandCenterState, ReviewableFinding } from '../model';
import { buildOutcomePreview, buildPackageView } from '../display';
import { Badge, Button, Card, Progress, formatDate, number } from '../ui';

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
  const outcomes = buildOutcomePreview(report, matrix, growthMap);
  const processRail = [
    ['Read sources', 'Collect public website evidence'],
    ['Extract evidence', 'Identify services and proof points'],
    ['Scrub claims', 'Remove unsupported or risky wording'],
    ['Compare capabilities', 'Benchmark Andwell against competitors'],
    ['Map opportunity', 'Connect capability and geography signals'],
    ['Generate strategy', 'Create growth plays and value angles'],
    ['Coach field teams', 'Prepare safe talk tracks'],
    ['Prepare report', 'Shape leadership-ready output']
  ];
  const guidancePreview = approvedItems.slice(0, 3);

  return (
    <div className="cc-home">
      <section className="cc-home-hero">
        <div className="cc-home-hero-copy">
          <p className="cc-home-greeting">Andwell Intelligence Engine</p>
          <h1>Turning public sources into trusted growth intelligence.</h1>
          <p>
            Andwell Innovation and Growth turns market evidence into capability comparison, growth opportunity, field-safe language, and leadership-ready strategy.
          </p>
          <div className="cc-home-actions">
            <Button variant="primary" onClick={onBuild}>
              Build Andwell Intelligence <ArrowRight size={16} />
            </Button>
            <span>{report ? `Last package updated ${formatDate(report.generatedAt)}` : 'Ready for the first intelligence package'}</span>
          </div>
        </div>
        <div className="cc-home-package">
          <Badge tone={report ? 'green' : 'teal'}>{packageView.packageLabel}</Badge>
          <div className="cc-package-stats">
            <article><strong>{number(packageView.competitors)}</strong><span>Competitors</span></article>
            <article><strong>{number(packageView.pages)}</strong><span>Pages reviewed</span></article>
            <article><strong>{number(packageView.capabilities)}</strong><span>Capabilities</span></article>
            <article><strong>{number(packageView.evidencePoints)}</strong><span>Evidence points</span></article>
          </div>
          <div className="cc-confidence-stack">
            <div><span>High confidence</span><Progress value={packageView.highConfidencePercent || (report ? 1 : 0)} tone="teal" /></div>
            <div><span>Guarded use</span><Progress value={packageView.guardedPercent || (report ? 1 : 0)} tone="amber" /></div>
          </div>
        </div>
      </section>

      <section className="cc-home-process" aria-label="Intelligence process">
        {processRail.map(([title, detail], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="cc-outcome-grid" aria-label="Intelligence outcomes">
        {outcomes.map((outcome, index) => {
          const Icon = [BarChart3, Map, MessageSquareText, FileText][index];
          return (
            <article className="cc-outcome-card" key={outcome.title}>
              <Icon size={20} />
              <div>
                <strong>{outcome.title}</strong>
                <p>{outcome.detail}</p>
                <span>{outcome.meta}</span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="cc-dashboard-grid cc-dashboard-primary">
        <Card title="Latest package snapshot" eyebrow="Source-backed intelligence">
          <div className="cc-intelligence-snapshot">
            <div>
              <strong>{report ? 'Package built and connected across the app' : 'Build the first package to activate every surface'}</strong>
              <p>{nextAction}</p>
            </div>
            <div className="cc-snapshot-list">
              <span><ShieldCheck size={15} /> Evidence guardrails active</span>
              <span><BarChart3 size={15} /> Matrix model loaded</span>
              <span><Map size={15} /> Growth map model loaded</span>
            </div>
          </div>
        </Card>
        <Card title="Field-ready guidance preview" action={<Badge tone="blue">{guidancePreview.length || 'Model'} preview</Badge>}>
          {guidancePreview.length ? (
            <div className="cc-guidance-list">
              {guidancePreview.map((item) => (
                <article key={item.id}>
                  <strong>{item.competitorName} | {item.serviceLine}</strong>
                  <p>{item.safeSalesWording}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="cc-guidance-list">
              <article><strong>Source-backed positioning</strong><p>Field language will be generated from public evidence and kept inside safe guardrails.</p></article>
              <article><strong>What not to say</strong><p>The system avoids unsupported superiority claims and definitive absence claims.</p></article>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
