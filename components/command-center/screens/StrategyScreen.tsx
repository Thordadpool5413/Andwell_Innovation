'use client';

import { ArrowRight, BriefcaseBusiness, MapPin, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import type { IntelligenceDisplayModel } from '../intelligence-display';
import { Button, EmptyState, number } from '../ui';

export function StrategyScreenView({
  report,
  onBuild,
  matrix,
  growthMap,
  display
}: {
  report: IntelligenceReport | null;
  onBuild: () => void;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
  display: IntelligenceDisplayModel;
}) {
  if (!report) {
    return <EmptyState title="Evidence intelligence ready" body="Build intelligence from public sources first." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />;
  }
  const plays = display.fieldGuidance.slice(0, 8);
  const topArea = display.territories[0];
  return (
    <div className="cc-workspace cc-strategy-workspace">
      <section className="cc-workspace-hero">
        <div>
          <p className="cc-section-label">Growth plays</p>
          <h2>Strategy Playbook</h2>
          <p>Turn capability comparison, territory signals, source excerpts, and safe language into practical growth moves for partnerships, referral sources, payer value, and field execution.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{display.package.competitors}</strong><span>Competitors</span></article>
          <article><strong>{number(display.package.pages)}</strong><span>Pages reviewed</span></article>
          <article><strong>{matrix.summary.advantageSignals}</strong><span>Advantage signals</span></article>
          <article><strong>{growthMap.summary.fieldFocusZones.length}</strong><span>Field zones</span></article>
        </div>
      </section>

      <section className="cc-strategy-briefing">
        <article>
          <BriefcaseBusiness size={19} />
          <div><strong>Executive posture</strong><p>{report.expertBrief?.marketPosture || report.executiveSummary}</p></div>
        </article>
        <article>
          <MapPin size={19} />
          <div><strong>Market focus</strong><p>{topArea ? `${topArea.area}: ${topArea.safeTalkTrack}` : 'Growth map will prioritize areas as source evidence expands.'}</p></div>
        </article>
        <article>
          <ShieldCheck size={19} />
          <div><strong>Guardrail</strong><p>Use source-backed positioning and avoid definitive claims about competitor absence.</p></div>
        </article>
      </section>

      <section className="cc-play-grid">
        {plays.map((play, index) => (
          <article key={play.id} className="cc-play-card">
            <header>
              <span>Priority {index + 1}</span>
              <h3>{play.capability}</h3>
              <p>{play.competitorName} | {play.marketArea}</p>
            </header>
            <div className="cc-play-body">
              <div><strong>Evidence basis</strong><p>{play.evidenceBasis}</p></div>
              <div><strong>Referral source angle</strong><p>{play.safeTalkTrack}</p></div>
              <div><strong>Payer value angle</strong><p>{topArea ? `Connect ${play.capability} to payer value potential in ${topArea.area} while staying source-backed.` : 'Connect capability depth to payer value and avoid unsupported market claims.'}</p></div>
              <div><strong>Partnership angle</strong><p>{topArea ? `Use ${topArea.area} partnership signals for care transitions, post acute relationships, and complex community care fit.` : 'Use hospital, post acute, and referral-source needs as the partnership frame.'}</p></div>
              <div><strong>What not to say</strong><p>{play.whatNotToSay}</p></div>
            </div>
            <footer><ArrowRight size={16} /><strong>{play.nextMove}</strong></footer>
          </article>
        ))}
      </section>
    </div>
  );
}
