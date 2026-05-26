'use client';

import { ArrowRight, BriefcaseBusiness, MapPin, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { Finding, IntelligenceReport } from '../../../lib/types';
import { Button, EmptyState, number } from '../ui';

function buildPlays(report: IntelligenceReport, matrix: AdvantageMatrix, growthMap: GrowthMap) {
  const areas = growthMap.areas.length ? growthMap.areas : [];
  return report.allFindings.slice(0, 6).map((finding: Finding, index) => {
    const area = areas[index % Math.max(1, areas.length)];
    const row = matrix.rows.find((item) => item.capability === finding.serviceLine);
    const cell = row?.cells.find((item) => item.competitorName === finding.competitorName);
    return {
      id: finding.id,
      capability: finding.serviceLine,
      competitor: finding.competitorName,
      geography: area?.area || 'Evidence-limited market area',
      advantage: finding.andwellAdvantage || cell?.strategicAngle || `Lead with Andwell depth in ${finding.serviceLine}.`,
      referralAngle: finding.safeSalesWording,
      payerAngle: area ? `Position around ${area.payerValuePotential}% payer value potential and care complexity management.` : 'Connect capability depth to payer value and avoid unsupported market claims.',
      partnershipAngle: area ? `Use ${area.partnershipPotential}% partnership potential as a leadership discussion signal.` : 'Use hospital, post acute, and referral-source needs as the partnership frame.',
      avoid: finding.avoidSaying,
      next: cell?.nextMove || area?.nextMove || 'Use current evidence in field-safe growth planning.'
    };
  });
}

export function StrategyScreenView({ report, onBuild, matrix, growthMap }: { report: IntelligenceReport | null; onBuild: () => void; matrix: AdvantageMatrix; growthMap: GrowthMap }) {
  if (!report) {
    return <EmptyState title="Evidence intelligence ready" body="Build intelligence from public sources first." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />;
  }
  const plays = buildPlays(report, matrix, growthMap);
  const topArea = growthMap.areas[0];
  return (
    <div className="cc-workspace cc-strategy-workspace">
      <section className="cc-workspace-hero">
        <div>
          <p className="cc-section-label">Growth plays</p>
          <h2>Strategy Playbook</h2>
          <p>Turn capability comparison and market opportunity into practical growth moves for partnerships, referral sources, payer value, and field execution.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{report.competitorsAnalyzed}</strong><span>Competitors</span></article>
          <article><strong>{number(report.pagesReviewed)}</strong><span>Pages reviewed</span></article>
          <article><strong>{matrix.summary.advantageSignals || 'Model'}</strong><span>Advantage signals</span></article>
          <article><strong>{growthMap.summary.fieldFocusZones.length || 'Focus'}</strong><span>Field zones</span></article>
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
              <p>{play.competitor} | {play.geography}</p>
            </header>
            <div className="cc-play-body">
              <div><strong>Andwell advantage</strong><p>{play.advantage}</p></div>
              <div><strong>Referral source angle</strong><p>{play.referralAngle}</p></div>
              <div><strong>Payer value angle</strong><p>{play.payerAngle}</p></div>
              <div><strong>Partnership angle</strong><p>{play.partnershipAngle}</p></div>
              <div><strong>What not to say</strong><p>{play.avoid}</p></div>
            </div>
            <footer><ArrowRight size={16} /><strong>{play.next}</strong></footer>
          </article>
        ))}
      </section>
    </div>
  );
}
