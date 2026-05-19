'use client';

import React from 'react';
import { Badge, Panel, TagList } from '../Shared';
import { toneForStatus } from '../../../lib/command-center/utils';
import type { View } from '../../../lib/command-center/types';
import type { IntelligenceReport } from '../../../lib/types';

export function ExpertCenter({ currentReport, setView }: { currentReport: IntelligenceReport | null; setView: (view: View) => void }) {
  const expert = currentReport?.expertBrief;
  if (!currentReport) return <Panel title="No report loaded"><p>Run or load a report to generate the foremost expert brief.</p><button className="btn primary" onClick={() => setView('intake')}>Run Competitive Scan</button></Panel>;
  if (!expert) return <Panel title="Fresh scan needed"><p>This report was created before the foremost expert engine was added. Run a fresh scan to generate expert recommendations, field plays, and watchlist items.</p><button className="btn primary" onClick={() => setView('intake')}>Run Fresh Scan</button></Panel>;
  return <>
    <section className="hero answerHero"><div className="row spread"><Badge tone="dark">{expert.expertVersion}</Badge><Badge tone={expert.expertScore >= 80 ? 'green' : expert.expertScore >= 60 ? 'amber' : 'blue'}>Expert score {expert.expertScore}</Badge></div><h1>{expert.marketPosture}</h1><p>{expert.expertSummary}</p><div className="row"><button className="btn" onClick={() => setView('battlecards')}>Open Battlecards</button><button className="btn" onClick={() => setView('matrix')}>Review Evidence</button><button className="btn" onClick={() => setView('ask')}>Ask Follow Up</button></div></section>
    <div className="grid cols3"><Panel title="Leadership decision"><p>{expert.leadershipDecision}</p></Panel><Panel title="Sales coaching priority"><p>{expert.salesCoachingPriority}</p></Panel><Panel title="Fastest field move"><p>{expert.fastestFieldMove}</p></Panel></div>
    <Panel title="Governance warning" className="featurePanel"><p>{expert.governanceWarning}</p></Panel>
    <Panel title="Expert recommendations"><div className="grid cols2">{expert.recommendations.map((item) => <div className="briefItem" key={item.id}><div className="row spread"><Badge tone={toneForStatus(item.priority)}>{item.priority}</Badge><Badge>{item.audience}</Badge></div><strong>{item.title}</strong><p>{item.reasoning}</p><div className="success"><strong>Action</strong><br />{item.action}</div><div className="notice"><strong>Safe language</strong><br />{item.safeLanguage}</div>{item.reviewRequired ? <Badge tone="amber">Review required</Badge> : <Badge tone="green">Ready for coaching</Badge>}</div>)}</div></Panel>
    <Panel title="Field plays"><div className="grid cols2">{expert.fieldPlays.map((play) => <div className="battleCard upgradedBattle" key={play.id}><div className="row spread"><h3>{play.competitorName}</h3><Badge>{play.serviceLine}</Badge></div><p>{play.scenario}</p><div className="battleSection"><strong>Lead with</strong><span>{play.leadWith}</span></div><div className="battleSection"><strong>Referral question</strong><span>{play.referralQuestion}</span></div><div className="battleSection"><strong>Objection response</strong><span>{play.objectionResponse}</span></div><div className="notice"><strong>Proof needed</strong><br />{play.proofNeeded}</div><div className="error"><strong>Avoid saying</strong><br />{play.avoidSaying}</div></div>)}</div></Panel>
    <div className="grid cols2"><Panel title="Strongest threats"><TagList items={expert.strongestThreats} /></Panel><Panel title="Best opportunities"><TagList items={expert.bestOpportunities} /></Panel></div>
    <Panel title="Watchlist"><div className="grid cols2">{expert.watchlist.map((item) => <div className="evidenceCard" key={item.id}><div className="row spread"><h3>{item.competitorName}</h3><Badge tone={toneForStatus(item.priority)}>{item.priority}</Badge></div><p><strong>Signal:</strong> {item.signal}</p><p>{item.whyItMatters}</p><div className="notice"><strong>Next check</strong><br />{item.nextCheck}</div></div>)}</div></Panel>
  </>;
}
