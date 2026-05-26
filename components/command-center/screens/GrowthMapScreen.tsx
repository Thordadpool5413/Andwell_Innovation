'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Layers, MapPin, ShieldCheck, Target } from 'lucide-react';
import type { GrowthSignal } from '../../../lib/intelligence-views';
import type { IntelligenceDisplayModel, MarketTerritoryView } from '../intelligence-display';
import { Badge, Notice, Progress, number } from '../ui';

type MapLayer = 'growth' | 'saturation' | 'advantage' | 'partnership' | 'payer';

function toneForSignal(signal: GrowthSignal) {
  if (signal === 'High Growth Opportunity' || signal === 'White Space Opportunity') return 'green';
  if (signal === 'Competitive Battleground' || signal === 'Over Saturated') return 'amber';
  if (signal === 'Evidence Limited') return 'slate';
  return 'teal';
}

function scoreForLayer(area: MarketTerritoryView, layer: MapLayer) {
  if (layer === 'growth') return area.scores.growth;
  if (layer === 'saturation') return area.scores.saturation;
  if (layer === 'advantage') return area.scores.advantage;
  if (layer === 'partnership') return area.scores.partnership;
  return area.scores.payer;
}

function layerLabel(layer: MapLayer) {
  return {
    growth: 'Growth',
    saturation: 'Saturation',
    advantage: 'Andwell Advantage',
    partnership: 'Partnership',
    payer: 'Payer Value'
  }[layer];
}

export function GrowthMapScreenView({
  display,
  hasReport
}: {
  display: IntelligenceDisplayModel;
  hasReport: boolean;
}) {
  const [selectedAreaName, setSelectedAreaName] = useState(display.territories[0]?.area || '');
  const [activeLayer, setActiveLayer] = useState<MapLayer>('growth');
  const selectedArea = display.territories.find((area) => area.area === selectedAreaName) || display.territories[0] || null;
  const ranked = useMemo(() => {
    const territories = [...display.territories];
    return {
      growth: [...territories].sort((a, b) => b.scores.growth - a.scores.growth).slice(0, 6),
      saturation: [...territories].sort((a, b) => b.scores.saturation - a.scores.saturation).slice(0, 6),
      field: [...territories].sort((a, b) => b.scores.field - a.scores.field).slice(0, 6),
      partnership: [...territories].sort((a, b) => b.scores.partnership - a.scores.partnership).slice(0, 6)
    };
  }, [display.territories]);

  if (!hasReport) {
    return (
      <div className="cc-workspace cc-map-workspace">
        <section className="cc-workspace-hero">
          <div>
            <p className="cc-section-label">Market opportunity</p>
            <h2>Growth Opportunity Map</h2>
            <p>Map source-backed market signals into growth opportunity, saturation, Andwell advantage, field focus, and partnership potential.</p>
          </div>
        </section>
        <Notice title="Evidence intelligence ready" body="Build intelligence from public sources first." tone="amber" />
      </div>
    );
  }

  return (
    <div className="cc-workspace cc-map-workspace">
      <section className="cc-workspace-hero cc-map-hero">
        <div>
          <p className="cc-section-label">Market opportunity</p>
          <h2>Growth Opportunity Map</h2>
          <p>See where public evidence points to growth, saturation, field focus, partnership value, and evidence gaps across Maine market areas.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{number(display.territories.length)}</strong><span>Market areas</span></article>
          <article><strong>{number(ranked.growth.filter((area) => area.priority === 'High').length)}</strong><span>High priority</span></article>
          <article><strong>{number(display.competitors.length)}</strong><span>Competitors mapped</span></article>
          <article><strong>{display.package.highConfidencePercent}%</strong><span>High confidence</span></article>
        </div>
      </section>

      <section className="cc-map-command-grid">
        <div className="cc-feature-panel cc-map-stage">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Maine opportunity surface</p>
              <h3>{layerLabel(activeLayer)} layer</h3>
            </div>
            <div className="cc-map-layer-controls" aria-label="Growth map layers">
              {(['growth', 'saturation', 'advantage', 'partnership', 'payer'] as MapLayer[]).map((layer) => (
                <button key={layer} type="button" className={activeLayer === layer ? 'active' : ''} onClick={() => setActiveLayer(layer)}>
                  {layerLabel(layer)}
                </button>
              ))}
            </div>
          </div>

          <div className="cc-maine-map" aria-label="Maine market opportunity map">
            <div className="cc-maine-outline" aria-hidden="true">
              <span className="cc-maine-region cc-region-north" />
              <span className="cc-maine-region cc-region-central" />
              <span className="cc-maine-region cc-region-coast" />
              <span className="cc-maine-region cc-region-south" />
            </div>
            {display.territories.map((area) => {
              const score = scoreForLayer(area, activeLayer);
              return (
                <button
                  key={area.area}
                  type="button"
                  className={`cc-territory-pin cc-territory-${toneForSignal(area.signal)} ${selectedArea?.area === area.area ? 'active' : ''}`}
                  style={{
                    left: `${area.x}%`,
                    top: `${area.y}%`,
                    '--pin-size': `${Math.max(34, Math.min(72, 30 + score / 2))}px`
                  } as CSSProperties}
                  onClick={() => setSelectedAreaName(area.area)}
                >
                  <span>{area.area}</span>
                  <em>{score}</em>
                </button>
              );
            })}
          </div>

          <div className="cc-map-legend">
            <span><i className="green" /> Growth opportunity</span>
            <span><i className="teal" /> Partnership or field focus</span>
            <span><i className="amber" /> Competitive pressure</span>
            <span><i className="slate" /> Evidence limited</span>
          </div>
        </div>

        <aside className="cc-dark-panel cc-detail-panel cc-map-inspector">
          <p className="cc-section-label">Area intelligence</p>
          {selectedArea ? (
            <>
              <h3>{selectedArea.area}</h3>
              <Badge tone={toneForSignal(selectedArea.signal)}>{selectedArea.signal}</Badge>
              <div className="cc-score-stack">
                <ScoreRow label="Growth opportunity" value={selectedArea.scores.growth} tone="green" />
                <ScoreRow label="Saturation" value={selectedArea.scores.saturation} tone="amber" />
                <ScoreRow label="Andwell advantage" value={selectedArea.scores.advantage} tone="teal" />
                <ScoreRow label="Referral potential" value={selectedArea.scores.referral} tone="blue" />
                <ScoreRow label="Partnership potential" value={selectedArea.scores.partnership} tone="green" />
                <ScoreRow label="Payer value potential" value={selectedArea.scores.payer} tone="teal" />
                <ScoreRow label="Evidence confidence" value={selectedArea.scores.confidence} tone="amber" />
              </div>
              <div className="cc-dark-list">
                <article><strong>Competitors detected</strong><p>{selectedArea.competitors.join(', ') || 'Current public evidence is limited for this area.'}</p></article>
                <article><strong>Relevant capabilities</strong><p>{selectedArea.capabilities.slice(0, 7).join(', ') || 'Capability evidence will strengthen with direct service pages.'}</p></article>
                <article><strong>Field focus</strong><p>{selectedArea.safeTalkTrack}</p></article>
                <article><strong>What not to say</strong><p>{selectedArea.avoidLanguage}</p></article>
                <article><strong>Next move</strong><p>{selectedArea.nextMove}</p></article>
                <article><strong>Suggested source to add</strong><p>{selectedArea.sourceToAdd}</p></article>
              </div>
            </>
          ) : null}
        </aside>
      </section>

      <section className="cc-map-bottom-grid">
        <div className="cc-feature-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Ranked opportunity table</p>
              <h3>Where Andwell should focus next</h3>
            </div>
            <Target size={21} />
          </div>
          <div className="cc-map-table">
            <table>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Signal</th>
                  <th>Growth</th>
                  <th>Saturation</th>
                  <th>Advantage</th>
                  <th>Field priority</th>
                  <th>Next move</th>
                </tr>
              </thead>
              <tbody>
                {ranked.growth.map((area) => (
                  <tr key={`rank-${area.area}`}>
                    <td><strong>{area.area}</strong></td>
                    <td><Badge tone={toneForSignal(area.signal)}>{area.signal}</Badge></td>
                    <td>{area.scores.growth}</td>
                    <td>{area.scores.saturation}</td>
                    <td>{area.scores.advantage}</td>
                    <td>{area.scores.field}</td>
                    <td>{area.nextMove}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cc-feature-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Competitor clusters</p>
              <h3>Market concentration signals</h3>
            </div>
            <Layers size={21} />
          </div>
          <div className="cc-cluster-list">
            {display.competitors.slice(0, 8).map((competitor) => (
              <article key={competitor.name}>
                <strong>{competitor.name}</strong>
                <span>{competitor.pagesReviewed} pages reviewed</span>
                <Progress value={competitor.serviceOverlapScore} tone={competitor.serviceOverlapScore > 70 ? 'amber' : 'teal'} />
                <p>{competitor.strongestMatches.slice(0, 3).join(', ') || 'Source-backed service signals are limited.'}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="cc-feature-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Source evidence overview</p>
              <h3>Evidence behind the map</h3>
            </div>
            <ShieldCheck size={21} />
          </div>
          <div className="cc-evidence-rail">
            {display.evidenceDigest.slice(0, 6).map((item) => (
              <article key={`map-evidence-${item.id}`}>
                <MapPin size={17} />
                <div>
                  <strong>{item.competitorName} | {item.serviceLine}</strong>
                  <p>{item.excerpt}</p>
                  <span>{item.sourceTitle || item.sourceUrl || 'Reviewed public source'}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-insight-strip">
        <article><MapPin size={18} /><div><strong>Map equals where</strong><p>Territory signals translate public source evidence into market focus.</p></div></article>
        <article><Target size={18} /><div><strong>Strategy equals action</strong><p>Ranked areas feed growth plays, field guidance, and leadership output.</p></div></article>
        <article><ArrowRight size={18} /><div><strong>Evidence stays guarded</strong><p>Limited geography is labeled clearly instead of inventing exact locations.</p></div></article>
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
