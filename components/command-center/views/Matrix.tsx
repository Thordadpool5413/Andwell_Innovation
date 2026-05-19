'use client';

import React from 'react';
import { Badge, Panel } from '../Shared';
import { toneForStatus } from '../../../lib/command-center/utils';
import type { MatrixFilter } from '../../../lib/command-center/types';
import type { IntelligenceReport } from '../../../lib/types';

export function Matrix({ currentReport, matrixFilter, setMatrixFilter, matrixSearch, setMatrixSearch }: { currentReport: IntelligenceReport | null; matrixFilter: MatrixFilter; setMatrixFilter: (filter: MatrixFilter) => void; matrixSearch: string; setMatrixSearch: (value: string) => void }) {
  const findings = currentReport?.allFindings || [];
  const filtered = findings.filter((finding) => {
    const search = matrixSearch.trim().toLowerCase();
    const matchesSearch = !search || `${finding.competitorName} ${finding.serviceLine} ${finding.safeSalesWording} ${finding.evidenceExcerpt}`.toLowerCase().includes(search);
    if (!matchesSearch) return false;
    if (matrixFilter === 'salesReady') return finding.reviewStatus === 'Sales usable with evidence' || finding.reviewStatus === 'Approved for sales use';
    if (matrixFilter === 'review') return finding.reviewStatus !== 'Sales usable with evidence' && finding.reviewStatus !== 'Approved for sales use';
    if (matrixFilter === 'advantage') return finding.competitorStatus !== 'Clearly offered';
    if (matrixFilter === 'matched') return finding.competitorStatus === 'Clearly offered';
    return true;
  });
  return <><section className="section"><div><h1>Evidence Matrix</h1><p>Filter service line evidence by competitor, status, review risk, and field usability.</p></div><Badge>{filtered.length} visible</Badge></section>{!currentReport ? <Panel title="No report loaded"><p>Run or load a report to populate the matrix.</p></Panel> : <><Panel title="Matrix controls"><div className="row"><input className="input searchInput" value={matrixSearch} onChange={(event) => setMatrixSearch(event.target.value)} placeholder="Search competitor, service line, evidence, or safe wording" />{(['all', 'salesReady', 'review', 'advantage', 'matched'] as MatrixFilter[]).map((filter) => <button key={filter} className={`btn ${matrixFilter === filter ? 'primary' : ''}`} onClick={() => setMatrixFilter(filter)}>{filter === 'all' ? 'All' : filter === 'salesReady' ? 'Sales ready' : filter === 'review' ? 'Needs review' : filter === 'advantage' ? 'Potential advantage' : 'Public matches'}</button>)}</div></Panel><div className="tableWrap proTable"><table><thead><tr><th>Competitor</th><th>Service line</th><th>Status</th><th>Depth</th><th>Review</th><th>Safe sales wording</th></tr></thead><tbody>{filtered.map((finding) => <tr key={finding.id}><td>{finding.competitorName}</td><td><strong>{finding.serviceLine}</strong><br /><span className="muted">{finding.sourceTitle || finding.sourceUrl || 'No source title'}</span></td><td><Badge tone={toneForStatus(finding.competitorStatus)}>{finding.competitorStatus}</Badge></td><td>{finding.subserviceDepthScore}%</td><td><Badge tone={toneForStatus(finding.reviewStatus)}>{finding.reviewStatus}</Badge></td><td>{finding.safeSalesWording}</td></tr>)}</tbody></table></div></>}</>;
}
