'use client';

import React from 'react';
import { Badge, Panel, Stat } from '../Shared';
import { money, whole, percent } from '../../../lib/command-center/utils';
import type { View } from '../../../lib/command-center/types';
import type { GrowthRow, GrowthTotals, GrowthScenario } from '../../../lib/growth-plan';

function ScenarioControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <label className="scenarioControl"><span>{label}</span><strong>{percent(value)}</strong><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><input className="input" type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function GrowthCommand({ rows, totals, serviceRollup, scenario, setScenario, setView }: { rows: GrowthRow[]; totals: GrowthTotals; serviceRollup: { service: string; role: string; color: string; y1Revenue: number; y3Starts: number }[]; scenario: GrowthScenario; setScenario: (value: GrowthScenario | ((current: GrowthScenario) => GrowthScenario)) => void; setView: (view: View) => void }) {
  const topRows = [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 8);
  const priorityOneCount = rows.filter((row) => row.launchGroup === 'Priority 1').length;
  const updateCapture = (key: 'hhCapture' | 'woundCapture' | 'therapyCapture', value: number) => {
    setScenario((current) => ({ ...current, [key]: [value, Math.min(value * 1.5, 0.75), Math.min(value * 2, 0.9)] as [number, number, number] }));
  };

  return <>
    <section className="hero growthHero">
      <div className="row spread"><Badge tone="dark">Merged app intelligence</Badge><Badge tone="green">{priorityOneCount} priority launches</Badge></div>
      <h1>Turn competitive evidence into a smarter growth plan before the field makes the first call.</h1>
      <p>The scenario engine from the growth-planning app is now fused with the competitive intelligence engine, so leadership can see county demand, service-line economics, referral volume, and execution priorities in the same place as competitor evidence.</p>
      <div className="row"><button className="btn primary" onClick={() => setView('board')}>Create Board View</button><button className="btn" onClick={() => setView('launch')}>View Launch Plan</button><button className="btn" onClick={() => setView('intake')}>Run Competitor Scan</button></div>
    </section>
    <div className="grid cols4">
      <Stat label="Year 1 revenue" value={money(totals.revenue[0])} hint={`${whole(totals.starts[0])} starts modeled`} />
      <Stat label="Year 3 revenue" value={money(totals.revenue[2])} hint={`${whole(totals.referrals[2])} referrals needed`} />
      <Stat label="3 year contribution" value={money(totals.totalContribution)} hint="Margin adjusted" />
      <Stat label="Priority counties" value={rows.length} hint="CMS modeled markets" />
    </div>
    <div className="grid cols3 commandGrid">
      <Panel title="Scenario Builder" className="scenarioPanel">
        <p className="muted">Change conversion and capture rates to pressure-test revenue, referrals, starts, and staffing demand.</p>
        <ScenarioControl label="Referral conversion" value={scenario.conversionRate} min={0.45} max={0.95} step={0.01} onChange={(value) => setScenario((current) => ({ ...current, conversionRate: value }))} />
        <ScenarioControl label="Home health Y1 capture" value={scenario.hhCapture[0]} min={0.03} max={0.25} step={0.01} onChange={(value) => updateCapture('hhCapture', value)} />
        <ScenarioControl label="Wound Y1 capture" value={scenario.woundCapture[0]} min={0.08} max={0.45} step={0.01} onChange={(value) => updateCapture('woundCapture', value)} />
        <ScenarioControl label="Therapy Y1 capture" value={scenario.therapyCapture[0]} min={0.08} max={0.45} step={0.01} onChange={(value) => updateCapture('therapyCapture', value)} />
      </Panel>
      <Panel title="Service Line Mix" className="span2">
        <div className="serviceMix">{serviceRollup.map((item) => <div className="serviceTile" key={item.service}><div className="serviceColor" style={{ backgroundColor: item.color }} /><div><strong>{item.service}</strong><span>{item.role}</span></div><div className="serviceNumbers"><b>{money(item.y1Revenue)}</b><small>Y1 revenue</small><b>{whole(item.y3Starts)}</b><small>Y3 starts</small></div></div>)}</div>
      </Panel>
    </div>
    <Panel title="County Opportunity Board" className="featurePanel">
      <div className="countyBoard">{topRows.map((row) => <div className="countyRow" key={`${row.county}-${row.service}`}><div><div className="row"><Badge tone={row.launchGroup === 'Priority 1' ? 'red' : row.launchGroup === 'Priority 2' ? 'amber' : 'blue'}>{row.launchGroup}</Badge><Badge>{row.service}</Badge></div><h3>{row.county}</h3><p>{row.reason}</p></div><div className="countyMetrics"><span>Opportunity</span><strong>{row.opportunityScore}</strong><div className="meter"><i style={{ width: `${Math.min(row.opportunityScore, 100)}%` }} /></div><small>{whole(row.demandPool)} demand pool | {money(row.revenue[0])} Y1 revenue | {whole(row.referrals[0])} referrals</small></div></div>)}</div>
    </Panel>
  </>;
}
