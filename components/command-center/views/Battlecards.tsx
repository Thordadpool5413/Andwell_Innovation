'use client';

import React from 'react';
import { Badge, Panel } from '../Shared';
import { toneForStatus } from '../../../lib/command-center/utils';
import type { IntelligenceReport } from '../../../lib/types';

export function Battlecards({ currentReport }: { currentReport: IntelligenceReport | null }) {
  return <><section className="section"><div><h1>Battlecards</h1><p>Field usable positioning by competitor, including safe language, coaching priorities, and review warnings.</p></div></section>{!currentReport ? <Panel title="No report loaded"><p>Run or load a report to generate battlecards.</p></Panel> : <div className="grid cols2">{currentReport.analyses.map((analysis) => <div className="battleCard upgradedBattle" key={analysis.id}><div className="row spread"><h3>{analysis.name}</h3><Badge tone={analysis.aiEnhanced ? 'green' : toneForStatus(analysis.score.threatLevel)}>{analysis.aiEnhanced ? 'AI enhanced' : analysis.score.threatLevel}</Badge></div><p>{analysis.aiExtraction?.leadershipSummary || analysis.score.executiveReadout}</p><div className="battleSection"><strong>Lead with</strong>{(analysis.aiExtraction?.salesBattlecards?.slice(0, 4).map((item) => item.leadWith) || analysis.score.leadWith).map((item) => <span key={item}>{item}</span>)}</div><div className="battleSection"><strong>Needs review</strong>{analysis.score.needsReview.length ? analysis.score.needsReview.map((item) => <span key={item}>{item}</span>) : <span>No major review flags</span>}</div><div className="notice"><strong>Field rule</strong><br />Do not say they do not offer a service. Use not found publicly unless approved evidence confirms otherwise.</div></div>)}</div>}</>;
}
