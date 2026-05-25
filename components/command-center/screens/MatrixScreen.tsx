'use client';

import { useState } from 'react';
import type { AdvantageMatrix } from '../../../lib/intelligence-views';
import { Badge, Card, EmptyState, Metric } from '../ui';

export function MatrixScreenView({ matrix }: { matrix: AdvantageMatrix }) {
  const [selected, setSelected] = useState<{ capability: string; competitorName: string } | null>(null);
  const [viewMode, setViewMode] = useState<'executive' | 'evidence' | 'field'>('executive');
  const selectedCell = selected ? matrix.rows.find((row) => row.capability === selected.capability)?.cells.find((cell) => cell.competitorName === selected.competitorName) : null;

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Capabilities mapped" value={matrix.summary.capabilitiesMapped || 'Model loaded'} detail="Andwell baseline definitions" tone="blue" />
        <Metric label="Competitors compared" value={matrix.summary.competitorsCompared || 'Awaiting package'} detail="Source-derived comparison" tone="teal" />
        <Metric label="Andwell advantages" value={matrix.summary.advantageSignals || 'Evidence model'} detail="Source-backed signals" tone="green" />
        <Metric label="Healthcare source matches" value={matrix.summary.providerMatches || 'Provider model'} detail="CMS/NPPES provider signals" tone="amber" />
      </div>
      <Card title="Andwell Advantage Matrix" eyebrow="Capability Comparison">
        <div className="cc-filter-row">
          <button type="button" className={viewMode === 'executive' ? 'active' : ''} onClick={() => setViewMode('executive')}>Executive View</button>
          <button type="button" className={viewMode === 'evidence' ? 'active' : ''} onClick={() => setViewMode('evidence')}>Evidence View</button>
          <button type="button" className={viewMode === 'field' ? 'active' : ''} onClick={() => setViewMode('field')}>Field Coaching View</button>
        </div>
        {matrix.rows.length ? (
          <div className="cc-table-wrap"><table className="cc-table"><thead><tr><th>Capability</th>{matrix.competitors.map((name) => <th key={name}>{name}</th>)}</tr></thead><tbody>
            {matrix.rows.map((row) => (<tr key={row.capability}><td><strong>{row.capability}</strong></td>{row.cells.map((cell) => (
              <td key={`${row.capability}-${cell.competitorName}`}><button type="button" className="cc-matrix-cell-btn" onClick={() => setSelected({ capability: row.capability, competitorName: cell.competitorName })}><Badge tone={cell.status === 'Confirmed match' ? 'green' : cell.status === 'Related capability' ? 'blue' : cell.status === 'Andwell advantage' ? 'teal' : 'amber'}>{cell.status}</Badge></button></td>
            ))}</tr>))}
          </tbody></table></div>
        ) : <EmptyState title="Capability comparison model loaded" body="Build Intelligence creates competitor columns, evidence labels, confidence levels, safe talk tracks, and strategic angles from public sources." />}
      </Card>
      {selectedCell ? (
        <Card title={`${selectedCell.capability} vs ${selectedCell.competitorName}`} eyebrow="Cell intelligence detail">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Status</strong><p>{selectedCell.status}</p></div>
            <div className="cc-list-item"><strong>Confidence</strong><p>{selectedCell.confidence}</p></div>
            <div className="cc-list-item"><strong>Evidence count</strong><p>{selectedCell.evidenceCount}</p></div>
            <div className="cc-list-item"><strong>Why this status</strong><p>{selectedCell.strategicAngle}</p></div>
            {viewMode !== 'field' ? <div className="cc-list-item"><strong>Source summary</strong><p>{selectedCell.sourceSummary}</p></div> : null}
            {viewMode !== 'executive' ? <div className="cc-list-item"><strong>Safe talk track</strong><p>{selectedCell.safeTalkTrack}</p></div> : null}
            {viewMode !== 'executive' ? <div className="cc-list-item"><strong>What not to say</strong><p>{selectedCell.avoidLanguage}</p></div> : null}
            <div className="cc-list-item"><strong>Recommended next move</strong><p>{selectedCell.nextMove}</p></div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
