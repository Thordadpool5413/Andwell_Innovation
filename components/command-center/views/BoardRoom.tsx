'use client';

import React from 'react';
import { Badge, Panel, Stat } from '../Shared';
import { money, whole, toneForStatus } from '../../../lib/command-center/utils';
import type { View } from '../../../lib/command-center/types';
import type { GrowthRow, GrowthTotals } from '../../../lib/growth-plan';
import type { IntelligenceReport } from '../../../lib/types';

export function BoardRoom({ currentReport, totals, rows, topThreat, topOpportunity, setView }: { currentReport: IntelligenceReport | null; totals: GrowthTotals; rows: GrowthRow[]; topThreat?: NonNullable<IntelligenceReport['competitorScores']>[number]; topOpportunity?: NonNullable<IntelligenceReport['competitorScores']>[number]; setView: (view: View) => void }) {
  const topCounties = [...rows].sort((a, b) => b.revenue[0] - a.revenue[0]).slice(0, 4);
  const reviewItems = currentReport?.humanReviewItems || 0;
  return <>
    <section className="hero boardHero">
      <div className="row spread"><Badge tone="dark">Board-ready readout</Badge><Badge tone={currentReport ? 'green' : 'amber'}>{currentReport ? 'Competitive report loaded' : 'Growth plan only'}</Badge></div>
      <h1>The advanced view connects market upside, competitor risk, and the decisions leadership needs to make now.</h1>
      <p>{currentReport?.expertBrief?.expertSummary || currentReport?.executiveSummary || 'Run or load a competitor scan to add live competitive evidence to this board view. The growth engine is already modeling county opportunity and launch economics.'}</p>
      <div className="row"><button className="btn primary" onClick={() => setView('reports')}>Load Reports</button><button className="btn" onClick={() => setView('growth')}>Adjust Scenario</button><button className="btn" onClick={() => setView('expert')}>Open Expert Brief</button></div>
    </section>
    <div className="grid cols4">
      <Stat label="3 year revenue" value={money(totals.totalRevenue)} hint="Modeled opportunity" />
      <Stat label="3 year starts" value={whole(totals.starts.reduce((a, b) => a + b, 0))} hint="Across service lines" />
      <Stat label="Review risk" value={reviewItems} hint="Competitive evidence items" />
      <Stat label="Top counties" value={topCounties.length} hint="Board focus list" />
    </div>
    <div className="grid cols2 commandGrid">
      <Panel title="Leadership Investment Case" className="boardSheet">
        <div className="boardMemo"><strong>Why now</strong><p>Andwell can use its current serious illness footprint to move upstream into skilled home health, wound, and therapy demand before referral leakage becomes harder to unwind.</p></div>
        <div className="boardMemo"><strong>Financial signal</strong><p>Year 1 revenue models at {money(totals.revenue[0])}; year 3 reaches {money(totals.revenue[2])} with {money(totals.totalContribution)} in three-year contribution.</p></div>
        <div className="boardMemo"><strong>Decision needed</strong><p>Approve priority county validation, staffing thresholds, and service-line launch sequencing for the next 90 days.</p></div>
      </Panel>
      <Panel title="Competitive Risk Overlay">
        <div className="signalStack">
          <div><small>Highest threat loaded</small><h2>{topThreat?.competitorName || 'No competitor report loaded'}</h2><p>{topThreat?.executiveReadout || 'Run the competitive scanner to attach real competitor pressure to this growth plan.'}</p></div>
          <div><small>Best safe field play</small><h2>{topOpportunity?.competitorName || 'Pending evidence'}</h2><p>{topOpportunity ? `Use verified public evidence and lead with ${topOpportunity.leadWith.slice(0, 3).join(', ')}.` : 'Field coaching appears after a scan is loaded.'}</p></div>
        </div>
      </Panel>
    </div>
    <Panel title="Board Focus Counties" className="featurePanel">
      <div className="grid cols4">{topCounties.map((row) => <div className="briefItem" key={row.county}><Badge tone={row.launchGroup === 'Priority 1' ? 'red' : 'amber'}>{row.launchGroup}</Badge><strong>{row.county}</strong><p>{row.service}</p><span>{money(row.revenue[0])} Y1 revenue | {whole(row.starts[0])} starts | {row.basis}</span></div>)}</div>
    </Panel>
  </>;
}
