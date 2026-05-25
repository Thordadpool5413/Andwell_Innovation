'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Target } from 'lucide-react';
import type { GrowthMap, GrowthSignal } from '../../../lib/intelligence-views';
import { Badge, Progress } from '../ui';

function toneForSignal(signal: GrowthSignal) {
  if (signal === 'High Growth Opportunity' || signal === 'White Space Opportunity') return 'green';
  if (signal === 'Competitive Battleground' || signal === 'Over Saturated') return 'amber';
  if (signal === 'Evidence Limited') return 'slate';
  return 'teal';
}

export function GrowthMapScreenView({ growthMap }: { growthMap: GrowthMap }) {
  const [selected, setSelected] = useState<string | null>(growthMap.areas[0]?.area || null);
  const [activeLayer, setActiveLayer] = useState<'growth' | 'saturation' | 'advantage' | 'confidence'>('growth');
  const selectedArea = growthMap.areas.find((area) => area.area === selected) || growthMap.areas[0] || null;
  const ranked = useMemo(() => ({
    growth: [...growthMap.areas].sort((a, b) => b.growthOpportunityScore - a.growthOpportunityScore).slice(0, 5),
    saturation: [...growthMap.areas].sort((a, b) => b.saturationScore - a.saturationScore).slice(0, 5),
    field: [...growthMap.areas].sort((a, b) => b.fieldFocusPriority - a.fieldFocusPriority).slice(0, 5)
  }), [growthMap.areas]);

  return (
    <div className="cc-workspace cc-map-workspace">
      <section className="cc-workspace-hero">
        <div>
          <p className="cc-section-label">Market opportunity</p>
          <h2>Growth Opportunity Map</h2>
          <p>Map source-backed market signals into growth opportunity, saturation, Andwell advantage, field focus, and partnership potential.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{growthMap.summary.topGrowthAreas.length || 'Ready'}</strong><span>Growth areas</span></article>
          <article><strong>{growthMap.summary.saturatedAreas.length || 'Model'}</strong><span>Saturated areas</span></article>
          <article><strong>{growthMap.summary.fieldFocusZones.length || 'Focus'}</strong><span>Field focus zones</span></article>
          <article><strong>{growthMap.summary.geographicSignals || 'Guarded'}</strong><span>Geo evidence signals</span></article>
        </div>
      </section>

      <section className="cc-workspace-grid cc-workspace-grid-detail">
        <div className="cc-feature-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Opportunity canvas</p>
              <h3>Market signal layers</h3>
            </div>
            <div className="cc-segmented">
              {(['growth', 'saturation', 'advantage', 'confidence'] as const).map((layer) => (
                <button key={layer} type="button" className={activeLayer === layer ? 'active' : ''} onClick={() => setActiveLayer(layer)}>{layer}</button>
              ))}
            </div>
          </div>
          <div className="cc-market-canvas">
            <span className="cc-map-axis y">Market opportunity</span>
            <span className="cc-map-axis x">Andwell advantage</span>
            {growthMap.areas.map((area, index) => {
              const score = activeLayer === 'growth' ? area.growthOpportunityScore : activeLayer === 'saturation' ? area.saturationScore : activeLayer === 'advantage' ? area.andwellAdvantageScore : area.evidenceConfidence;
              return (
                <button
                  key={area.area}
                  type="button"
                  className={`cc-market-dot cc-market-dot-${toneForSignal(area.signal)} ${selectedArea?.area === area.area ? 'active' : ''}`}
                  style={{ left: `${Math.max(12, Math.min(88, area.andwellAdvantageScore))}%`, top: `${Math.max(12, Math.min(82, 100 - area.growthOpportunityScore + index * 4))}%`, width: `${Math.max(36, Math.min(76, 28 + score / 2))}px`, height: `${Math.max(36, Math.min(76, 28 + score / 2))}px` }}
                  onClick={() => setSelected(area.area)}
                >
                  <span>{area.area}</span>
                </button>
              );
            })}
          </div>

          <div className="cc-ranked-grid">
            <RankedList title="Top growth areas" areas={ranked.growth} score="growthOpportunityScore" />
            <RankedList title="Most saturated areas" areas={ranked.saturation} score="saturationScore" />
            <RankedList title="Best field focus zones" areas={ranked.field} score="fieldFocusPriority" />
          </div>
        </div>

        <aside className="cc-dark-panel cc-detail-panel">
          <p className="cc-section-label">Area intelligence</p>
          {selectedArea ? (
            <>
              <h3>{selectedArea.area}</h3>
              <Badge tone={toneForSignal(selectedArea.signal)}>{selectedArea.signal}</Badge>
              <div className="cc-score-stack">
                <ScoreRow label="Growth opportunity" value={selectedArea.growthOpportunityScore} tone="green" />
                <ScoreRow label="Saturation" value={selectedArea.saturationScore} tone="amber" />
                <ScoreRow label="Andwell advantage" value={selectedArea.andwellAdvantageScore} tone="teal" />
                <ScoreRow label="Referral source potential" value={selectedArea.referralSourcePotential} tone="blue" />
                <ScoreRow label="Partnership potential" value={selectedArea.partnershipPotential} tone="green" />
                <ScoreRow label="Payer value potential" value={selectedArea.payerValuePotential} tone="teal" />
                <ScoreRow label="Evidence confidence" value={selectedArea.evidenceConfidence} tone="amber" />
              </div>
              <div className="cc-dark-list">
                <article><strong>Competitors detected</strong><p>{selectedArea.competitors.join(', ') || 'Current source set is limited for this area.'}</p></article>
                <article><strong>Relevant Andwell capabilities</strong><p>{selectedArea.capabilities.slice(0, 6).join(', ')}</p></article>
                <article><strong>Recommended field focus</strong><p>{selectedArea.safeTalkTrack}</p></article>
                <article><strong>What not to say</strong><p>{selectedArea.avoidLanguage}</p></article>
                <article><strong>Recommended next move</strong><p>{selectedArea.nextMove}</p></article>
                <article><strong>Suggested source to add</strong><p>{selectedArea.sourceToAdd}</p></article>
              </div>
            </>
          ) : null}
        </aside>
      </section>

      <section className="cc-insight-strip">
        <article><MapPin size={18} /><div><strong>Matrix equals what</strong><p>Capabilities define the comparison surface.</p></div></article>
        <article><Target size={18} /><div><strong>Map equals where</strong><p>Opportunity signals show where field and leadership focus should go next.</p></div></article>
        <article><ArrowRight size={18} /><div><strong>Strategy equals action</strong><p>Growth plays use this map plus the Advantage Matrix.</p></div></article>
      </section>
    </div>
  );
}

function ScoreRow({ label, value, tone }: { label: string; value: number; tone: 'green' | 'amber' | 'teal' | 'blue' }) {
  return (
    <div className="cc-score-row">
      <div><strong>{label}</strong><span>{value}</span></div>
      <Progress value={value} tone={tone} />
    </div>
  );
}

function RankedList({ title, areas, score }: { title: string; areas: GrowthMap['areas']; score: 'growthOpportunityScore' | 'saturationScore' | 'fieldFocusPriority' }) {
  return (
    <article>
      <h4>{title}</h4>
      {areas.map((area) => (
        <div key={`${title}-${area.area}`}><span>{area.area}</span><strong>{area[score]}</strong></div>
      ))}
    </article>
  );
}
