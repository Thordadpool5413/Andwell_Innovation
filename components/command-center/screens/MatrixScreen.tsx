'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, MatrixCell } from '../../../lib/intelligence-views';
import { Badge, Button, EmptyState, Notice, Progress } from '../ui';

type MatrixMode = 'executive' | 'evidence' | 'field';

function toneForMatrix(status: MatrixCell['status']) {
  if (status === 'Confirmed match') return 'green';
  if (status === 'Related capability') return 'blue';
  if (status === 'Andwell advantage') return 'teal';
  if (status === 'Evidence limited') return 'amber';
  return 'slate';
}

function confidenceValue(confidence: string) {
  if (confidence === 'High') return 92;
  if (confidence === 'Moderate') return 64;
  if (confidence === 'Low') return 38;
  return 24;
}

export function MatrixScreenView({ matrix, hasReport }: { matrix: AdvantageMatrix; hasReport: boolean }) {
  const firstCell = matrix.rows[0]?.cells[0] || null;
  const [selected, setSelected] = useState<{ capability: string; competitorName: string } | null>(firstCell ? { capability: firstCell.capability, competitorName: firstCell.competitorName } : null);
  const [mode, setMode] = useState<MatrixMode>('executive');
  const selectedCell = useMemo(() => {
    if (!selected) return firstCell;
    return matrix.rows.find((row) => row.capability === selected.capability)?.cells.find((cell) => cell.competitorName === selected.competitorName) || firstCell;
  }, [firstCell, matrix.rows, selected]);
  const strongest = matrix.rows.flatMap((row) => row.cells).filter((cell) => cell.status === 'Andwell advantage').slice(0, 4);

  if (!hasReport) {
    return (
      <div className="cc-workspace cc-matrix-workspace">
        <section className="cc-workspace-hero">
          <div>
            <p className="cc-section-label">Capability comparison</p>
            <h2>Andwell Advantage Matrix</h2>
            <p>Compare Andwell capabilities against public competitor evidence with confidence, safe language, and recommended next moves built into each cell.</p>
          </div>
        </section>
        <Notice title="Evidence intelligence ready" body="Build intelligence from public sources first." tone="amber" />
      </div>
    );
  }

  return (
    <div className="cc-workspace cc-matrix-workspace">
      <section className="cc-workspace-hero">
        <div>
          <p className="cc-section-label">Capability comparison</p>
          <h2>Andwell Advantage Matrix</h2>
          <p>Compare Andwell capabilities against public competitor evidence with confidence, safe language, and recommended next moves built into each cell.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{matrix.summary.capabilitiesMapped || 14}</strong><span>Capabilities mapped</span></article>
          <article><strong>{matrix.summary.competitorsCompared || 'Ready'}</strong><span>Competitors compared</span></article>
          <article><strong>{matrix.summary.advantageSignals || 'Model'}</strong><span>Advantage signals</span></article>
          <article><strong>{matrix.summary.evidenceLimited || 'Guarded'}</strong><span>Evidence-limited cells</span></article>
        </div>
      </section>

      <section className="cc-workspace-grid cc-workspace-grid-detail">
        <div className="cc-feature-panel cc-matrix-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Matrix workspace</p>
              <h3>Capability grid</h3>
            </div>
            <div className="cc-segmented">
              {(['executive', 'evidence', 'field'] as MatrixMode[]).map((item) => (
                <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>
                  {item === 'executive' ? 'Executive' : item === 'evidence' ? 'Evidence' : 'Field'}
                </button>
              ))}
            </div>
          </div>
          {matrix.rows.length ? (
            <div className="cc-premium-table-wrap">
              <table className="cc-premium-table cc-matrix-table">
                <thead>
                  <tr>
                    <th>Andwell capability</th>
                    <th>Andwell baseline</th>
                    {matrix.competitors.map((name) => <th key={name}>{name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row) => (
                    <tr key={row.capability}>
                      <td><strong>{row.capability}</strong></td>
                      <td><span>{row.andwellBaseline}</span></td>
                      {row.cells.map((cell) => (
                        <td key={`${row.capability}-${cell.competitorName}`}>
                          <button type="button" className={`cc-matrix-status cc-matrix-status-${toneForMatrix(cell.status)}`} onClick={() => setSelected({ capability: row.capability, competitorName: cell.competitorName })}>
                            <strong>{cell.status}</strong>
                            <span>{cell.confidence} confidence</span>
                            {mode !== 'executive' ? <small>{cell.evidenceCount} evidence point{cell.evidenceCount === 1 ? '' : 's'}</small> : null}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Capability comparison model loaded" body="Build Intelligence creates competitor columns, evidence labels, confidence levels, safe talk tracks, and strategic angles from public sources." />
          )}
        </div>

        <aside className="cc-dark-panel cc-detail-panel">
          <p className="cc-section-label">Cell intelligence</p>
          {selectedCell ? (
            <>
              <h3>{selectedCell.capability}</h3>
              <span className="cc-detail-subtitle">{selectedCell.competitorName}</span>
              <Badge tone={toneForMatrix(selectedCell.status)}>{selectedCell.status}</Badge>
              <div className="cc-dark-meter">
                <div><strong>Evidence confidence</strong><span>{selectedCell.confidence}</span></div>
                <Progress value={confidenceValue(selectedCell.confidence)} tone={selectedCell.confidence === 'High' ? 'green' : selectedCell.confidence === 'Moderate' ? 'teal' : 'amber'} />
              </div>
              <div className="cc-dark-list">
                <article><strong>What the system found</strong><p>{selectedCell.sourceSummary}</p></article>
                <article><strong>Why this status was assigned</strong><p>{selectedCell.strategicAngle}</p></article>
                <article><strong>Safe talk track</strong><p>{selectedCell.safeTalkTrack}</p></article>
                <article><strong>What not to say</strong><p>{selectedCell.avoidLanguage}</p></article>
                <article><strong>Question to ask</strong><p>{selectedCell.fieldQuestion}</p></article>
                <article><strong>Recommended next move</strong><p>{selectedCell.nextMove}</p></article>
              </div>
            </>
          ) : (
            <p className="cc-muted-dark">Build Intelligence to populate competitor comparison details.</p>
          )}
        </aside>
      </section>

      <section className="cc-insight-strip">
        <article>
          <ShieldCheck size={18} />
          <div><strong>Safe evidence language enforced</strong><p>The matrix avoids unsupported superiority and absence claims.</p></div>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <div><strong>{strongest.length || 'Advantage'} positioning signals</strong><p>{strongest.map((item) => item.capability).join(', ') || 'Advantage signals appear after source processing.'}</p></div>
        </article>
        <article>
          <ArrowRight size={18} />
          <div><strong>Feeds strategy and coaching</strong><p>Every selected capability can become a field talk track and leadership next move.</p></div>
        </article>
      </section>
    </div>
  );
}
