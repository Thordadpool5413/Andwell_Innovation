'use client';

import { useState } from 'react';
import type { GrowthMap } from '../../../lib/intelligence-views';
import { Card, Metric } from '../ui';

export function GrowthMapScreenView({ growthMap }: { growthMap: GrowthMap }) {
  const [selected, setSelected] = useState<string | null>(growthMap.areas[0]?.area || null);
  const [layers, setLayers] = useState({ growth: true, saturation: true, advantage: true, confidence: true });
  const selectedArea = growthMap.areas.find((area) => area.area === selected) || null;
  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Growth areas identified" value={growthMap.summary.topGrowthAreas.length || 'Ready'} detail="Ranked opportunities" tone="green" />
        <Metric label="Saturated areas" value={growthMap.summary.saturatedAreas.length || 'Ready'} detail="Competitive density" tone="amber" />
        <Metric label="Field focus zones" value={growthMap.summary.fieldFocusZones.length || 'Ready'} detail="Where to act next" tone="blue" />
        <Metric label="Geographic evidence signals" value={growthMap.summary.geographicSignals || 'Ready'} detail="Census-backed location confidence" tone="slate" />
      </div>
      <Card title="Growth Opportunity Map" eyebrow="Market Opportunity">
        <div className="cc-filter-row">
          {Object.entries(layers).map(([key, enabled]) => (
            <button key={key} type="button" className={enabled ? 'active' : ''} onClick={() => setLayers((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}>{key}</button>
          ))}
        </div>
        <div className="cc-source-grid">
          {growthMap.areas.map((area) => (
            <button key={area.area} type="button" className={`cc-area-card ${selected === area.area ? 'active' : ''}`} onClick={() => setSelected(area.area)}>
              <strong>{area.area}</strong>
              <span>{area.signal}</span>
            </button>
          ))}
        </div>
      </Card>
      {selectedArea ? (
        <Card title={selectedArea.area} eyebrow="Area intelligence detail">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Growth Opportunity Score</strong><p>{selectedArea.growthOpportunityScore}</p></div>
            <div className="cc-list-item"><strong>Saturation Score</strong><p>{selectedArea.saturationScore}</p></div>
            <div className="cc-list-item"><strong>Andwell Advantage Score</strong><p>{selectedArea.andwellAdvantageScore}</p></div>
            <div className="cc-list-item"><strong>Recommended next move</strong><p>{selectedArea.nextMove}</p></div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
