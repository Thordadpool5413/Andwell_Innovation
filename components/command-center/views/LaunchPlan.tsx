'use client';

import React from 'react';
import { Badge, Panel, TagList } from '../Shared';
import { money, whole } from '../../../lib/command-center/utils';
import type { View } from '../../../lib/command-center/types';
import type { GrowthRow, GrowthTotals, StaffingPlanItem } from '../../../lib/growth-plan';
import { launchTimeline } from '../../../lib/growth-plan';

export function LaunchPlan({ rows, totals, staffingPlan, setView }: { rows: GrowthRow[]; totals: GrowthTotals; staffingPlan: StaffingPlanItem[]; setView: (view: View) => void }) {
  const priorityRows = rows.filter((row) => row.launchGroup === 'Priority 1');
  return <>
    <section className="hero launchHero">
      <div className="row spread"><Badge tone="dark">Execution system</Badge><Badge tone="green">{whole(totals.referrals[0])} Y1 referrals modeled</Badge></div>
      <h1>A cleaner launch plan for staffing, accounts, referral targets, and 90-day execution.</h1>
      <p>Use this view to turn the growth model into operating decisions: who needs to be hired, which accounts matter, and what should happen in each launch window.</p>
      <div className="row"><button className="btn primary" onClick={() => setView('growth')}>Tune Scenario</button><button className="btn" onClick={() => setView('battlecards')}>Open Battlecards</button></div>
    </section>
    <div className="grid cols3">
      {staffingPlan.map((item) => <Panel title={item.service} key={item.service}><Badge>{item.role}</Badge><div className="staffGrid"><span>Y1 FTE</span><strong>{item.fte[0]}</strong><span>Y2 FTE</span><strong>{item.fte[1]}</strong><span>Y3 FTE</span><strong>{item.fte[2]}</strong></div><p>{whole(item.starts[0])} first-year starts supported at about {whole(item.patientsPerFTE)} patients per FTE.</p><div className="notice"><strong>Year 1 staffing cost</strong><br />{money(item.cost[0])}</div></Panel>)}
    </div>
    <div className="grid cols2 commandGrid">
      <Panel title="90-Day Timeline" className="featurePanel">
        <div className="timeline">{launchTimeline.map((item) => <div className="timelineItem" key={item.window}><Badge tone="dark">{item.window}</Badge><strong>{item.title}</strong><p>{item.focus}</p></div>)}</div>
      </Panel>
      <Panel title="Priority Account Plays">
        <div className="briefList">{priorityRows.map((row) => <div className="briefItem" key={`${row.county}-${row.service}`}><div className="row"><Badge tone="red">{row.county}</Badge><Badge>{row.service}</Badge></div><strong>{row.action}</strong><TagList items={row.accounts.slice(0, 5)} /></div>)}</div>
      </Panel>
    </div>
  </>;
}
