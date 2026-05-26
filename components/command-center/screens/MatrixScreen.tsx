'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import type { AdvantageMatrix, MatrixCell } from '../../../lib/intelligence-views';
import type { CapabilityEvidenceSummary, IntelligenceDisplayModel } from '../intelligence-display';
import { Badge, EmptyState, Notice, Progress } from '../ui';

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

function cleanCompetitorName(value: string | undefined) {
  return (value || 'Competitor').replace(/\s*\|+\s*$/g, '').replace(/\s+/g, ' ').trim() || 'Competitor';
}

function cleanUiText(value: string | undefined, competitorName?: string) {
  const rawName = competitorName || '';
  const cleanName = cleanCompetitorName(rawName);
  const source = rawName ? (value || '').replace(new RegExp(rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cleanName) : (value || '');
  return source.replace(/\s*\|\s*([,.])/g, '$1').replace(/\s*\|\s*$/g, '').trim();
}

export function MatrixScreenView({ matrix, display, hasReport }: { matrix: AdvantageMatrix; display: IntelligenceDisplayModel; hasReport: boolean }) {
  const [selectedCompetitor, setSelectedCompetitor] = useState(display.competitors[0]?.rawName || matrix.competitors[0] || '');
  const [selectedCapability, setSelectedCapability] = useState(display.capabilities[0]?.capability || '');
  const [mode, setMode] = useState<MatrixMode>('executive');
  const [query, setQuery] = useState('');

  const activeCompetitor = selectedCompetitor || display.competitors[0]?.rawName || matrix.competitors[0] || '';
  const filteredCapabilities = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return display.capabilities;
    return display.capabilities.filter((capability) =>
      [
        capability.capability,
        capability.strongestCompetitors.join(' '),
        capability.topEvidence.map((item) => item.excerpt).join(' '),
        capability.safeTalkTrack
      ].join(' ').toLowerCase().includes(clean)
    );
  }, [display.capabilities, query]);

  const activeCapability = filteredCapabilities.find((capability) => capability.capability === selectedCapability) || filteredCapabilities[0] || display.capabilities[0] || null;
  const selectedCell = activeCapability?.cells.find((cell) => cell.competitorName === activeCompetitor) || activeCapability?.cells[0] || null;
  const selectedEvidence = activeCapability?.topEvidence.find((item) => item.competitorName === cleanCompetitorName(selectedCell?.competitorName)) || activeCapability?.topEvidence[0] || null;
  const activeCompetitorSummary = display.competitors.find((competitor) => competitor.rawName === activeCompetitor || competitor.name === cleanCompetitorName(activeCompetitor));

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
      <section className="cc-workspace-hero cc-intel-hero">
        <div>
          <p className="cc-section-label">Capability comparison</p>
          <h2>Andwell Advantage Matrix</h2>
          <p>Readable competitor comparison built from public evidence, source summaries, confidence levels, and safe field language.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{matrix.summary.capabilitiesMapped}</strong><span>Capabilities</span></article>
          <article><strong>{matrix.summary.competitorsCompared}</strong><span>Competitors</span></article>
          <article><strong>{matrix.summary.advantageSignals}</strong><span>Advantage signals</span></article>
          <article><strong>{display.package.evidencePoints}</strong><span>Evidence items</span></article>
        </div>
      </section>

      <section className="cc-matrix-control-panel">
        <div className="cc-panel-head">
          <div>
            <p className="cc-section-label">Comparison workspace</p>
            <h3>Choose a competitor, then inspect each capability.</h3>
          </div>
          <div className="cc-segmented">
            {(['executive', 'evidence', 'field'] as MatrixMode[]).map((item) => (
              <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>
                {item === 'executive' ? 'Executive' : item === 'evidence' ? 'Evidence' : 'Field'}
              </button>
            ))}
          </div>
        </div>

        <div className="cc-competitor-strip">
          {display.competitors.map((competitor) => (
            <button key={competitor.rawName} type="button" className={activeCompetitor === competitor.rawName ? 'active' : ''} onClick={() => setSelectedCompetitor(competitor.rawName)}>
              <strong>{competitor.name}</strong>
              <span>{competitor.evidenceCount} evidence items</span>
            </button>
          ))}
        </div>

        <div className="cc-search cc-premium-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search capability, competitor, evidence, or safe wording" />
        </div>
      </section>

      <section className="cc-workspace-grid cc-workspace-grid-detail">
        <div className="cc-feature-panel cc-matrix-list-panel">
          <div className="cc-capability-list">
            {filteredCapabilities.map((capability) => (
              <CapabilityRow
                key={capability.capability}
                capability={capability}
                competitorName={activeCompetitor}
                active={activeCapability?.capability === capability.capability}
                mode={mode}
                onSelect={() => setSelectedCapability(capability.capability)}
              />
            ))}
          </div>
        </div>

        <aside className="cc-dark-panel cc-detail-panel cc-sticky-inspector">
          <p className="cc-section-label">Cell intelligence</p>
          {selectedCell && activeCapability ? (
            <>
              <h3>{activeCapability.capability}</h3>
              <span className="cc-detail-subtitle">{cleanCompetitorName(selectedCell.competitorName)}</span>
              <Badge tone={toneForMatrix(selectedCell.status)}>{selectedCell.status}</Badge>
              <div className="cc-dark-meter">
                <div><strong>Evidence confidence</strong><span>{selectedCell.confidence}</span></div>
                <Progress value={confidenceValue(selectedCell.confidence)} tone={selectedCell.confidence === 'High' ? 'green' : selectedCell.confidence === 'Moderate' ? 'teal' : 'amber'} />
              </div>
              <div className="cc-dark-list">
                <article><strong>What the system found</strong><p>{cleanUiText(selectedEvidence?.excerpt || selectedCell.sourceSummary, selectedCell.competitorName)}</p></article>
                <article><strong>Source summary</strong><p>{cleanUiText(selectedEvidence?.sourceTitle || selectedEvidence?.sourceUrl || selectedCell.sourceSummary, selectedCell.competitorName)}</p></article>
                <article><strong>Why this status was assigned</strong><p>{cleanUiText(selectedCell.strategicAngle, selectedCell.competitorName)}</p></article>
                <article><strong>Safe talk track</strong><p>{cleanUiText(selectedCell.safeTalkTrack, selectedCell.competitorName)}</p></article>
                <article><strong>What not to say</strong><p>{cleanUiText(selectedCell.avoidLanguage, selectedCell.competitorName)}</p></article>
                <article><strong>Question to ask</strong><p>{cleanUiText(selectedCell.fieldQuestion, selectedCell.competitorName)}</p></article>
                <article><strong>Recommended next move</strong><p>{cleanUiText(selectedCell.nextMove, selectedCell.competitorName)}</p></article>
              </div>
            </>
          ) : (
            <p className="cc-muted-dark">Select a capability to inspect the evidence, talk track, and next move.</p>
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
          <div><strong>{activeCompetitorSummary?.strongestMatches.length || 0} strongest overlaps</strong><p>{activeCompetitorSummary?.strongestMatches.join(', ') || 'Overlap signals appear from public evidence.'}</p></div>
        </article>
        <article>
          <ArrowRight size={18} />
          <div><strong>Feeds strategy and coaching</strong><p>Every selected capability can become a field talk track and leadership next move.</p></div>
        </article>
      </section>
    </div>
  );
}

function CapabilityRow({
  capability,
  competitorName,
  active,
  mode,
  onSelect
}: {
  capability: CapabilityEvidenceSummary;
  competitorName: string;
  active: boolean;
  mode: MatrixMode;
  onSelect: () => void;
}) {
  const cell = capability.cells.find((item) => item.competitorName === competitorName) || capability.cells[0];
  const evidence = capability.topEvidence.find((item) => item.competitorName === cleanCompetitorName(cell?.competitorName)) || capability.topEvidence[0];
  return (
    <button type="button" className={`cc-capability-row ${active ? 'active' : ''}`} onClick={onSelect}>
      <div>
        <strong>{capability.capability}</strong>
        <span>{cleanCompetitorName(cell?.competitorName || competitorName)}</span>
      </div>
      <Badge tone={cell ? toneForMatrix(cell.status) : 'slate'}>{cell?.status || 'Not clearly found'}</Badge>
      <div className="cc-capability-row-evidence">
        <p>{cleanUiText(mode === 'field' ? cell?.safeTalkTrack : evidence?.excerpt || cell?.sourceSummary || capability.andwellBaseline, cell?.competitorName)}</p>
        <small>{cell?.confidence || 'Low'} confidence | {cell?.evidenceCount || 0} evidence points | {capability.advantages} advantage signals</small>
      </div>
    </button>
  );
}
