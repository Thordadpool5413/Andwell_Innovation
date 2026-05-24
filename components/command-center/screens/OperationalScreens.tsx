'use client';

import { useState } from 'react';
import { AlertTriangle, BarChart3, Bot, CheckCircle2, Database, FileText, RefreshCcw, Search, Send, Shield, ShieldCheck, Sparkles } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { CompetitorInput, IntelligenceReport } from '../../../lib/types';
import type { AskResponse, CommandCenterState, ReviewableFinding } from '../model';
import { compactUrl, displayStatus, scrubOutputText, toneForStatus } from '../helpers';
import { Badge, Button, Card, EmptyState, Metric, Notice, Progress, number } from '../ui';

export function LibraryScreenView({
  approvedItems,
  allApprovedCount,
  search,
  setSearch,
  competitors,
  onDelete,
  onBuild
}: {
  approvedItems: ReviewableFinding[];
  allApprovedCount: number;
  search: string;
  setSearch: (value: string) => void;
  competitors: CompetitorInput[];
  onDelete: (url: string) => void;
  onBuild: () => void;
}) {
  return (
    <div className="cc-stack">
      <Card title="AI-built intelligence" action={<Badge tone="green">{allApprovedCount} built</Badge>}>
        <div className="cc-search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competitor, service, evidence, or safe wording" />
        </div>
        {approvedItems.length ? (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Evidence</th>
                  <th>Safe wording</th>
                </tr>
              </thead>
              <tbody>
                {approvedItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.competitorName}</td>
                    <td><strong>{item.serviceLine}</strong>{'subservice' in item ? <span>{item.subservice}</span> : null}</td>
                    <td><Badge tone={toneForStatus(item.competitorStatus)}>{displayStatus(item.competitorStatus)}</Badge></td>
                    <td>{displayStatus(item.confidence)}</td>
                    <td><Badge tone={item.evidenceStrength === 'Strong' ? 'green' : item.evidenceStrength === 'Moderate' ? 'blue' : item.evidenceStrength === 'Weak' ? 'amber' : 'red'}>{item.evidenceStrength || 'Evidence governed'}</Badge></td>
                    <td>{scrubOutputText(item.safeSalesWording)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Built outputs ready to generate" body="Enter public sources and build intelligence to create trusted outputs, source-based guidance, and strategy signals." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />
        )}
      </Card>

      <Card title="Competitor sources" action={<Badge tone="blue">{competitors.length} stored</Badge>}>
        {competitors.length ? (
          <div className="cc-source-grid">
            {competitors.map((competitor) => (
              <div key={competitor.url} className="cc-source-card">
                <Database size={18} />
                <strong>{competitor.name || compactUrl(competitor.url)}</strong>
                <span>{compactUrl(competitor.url)}</span>
                <Button variant="danger" onClick={() => onDelete(competitor.url)}>Delete</Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Source library ready" body="Competitor sources appear here after source intake and intelligence builds." />
        )}
      </Card>
    </div>
  );
}

export function MatrixScreenView({ matrix }: { matrix: AdvantageMatrix }) {
  const [selected, setSelected] = useState<{ capability: string; competitorName: string } | null>(null);
  const [viewMode, setViewMode] = useState<'executive' | 'evidence' | 'field'>('executive');
  const selectedCell = selected
    ? matrix.rows.find((row) => row.capability === selected.capability)?.cells.find((cell) => cell.competitorName === selected.competitorName)
    : null;

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Capabilities mapped" value={matrix.summary.capabilitiesMapped || 'Ready'} detail="Andwell baseline definitions" tone="blue" />
        <Metric label="Competitors compared" value={matrix.summary.competitorsCompared || 'Ready'} detail="Source-derived comparison" tone="teal" />
        <Metric label="Andwell advantages" value={matrix.summary.advantageSignals || 'Ready'} detail="Source-backed signals" tone="green" />
        <Metric label="Healthcare source matches" value={matrix.summary.providerMatches || 'Ready'} detail="CMS/NPPES provider signals" tone="amber" />
      </div>
      <Card title="Andwell Advantage Matrix" eyebrow="Capability Comparison">
        <div className="cc-filter-row">
          <button type="button" className={viewMode === 'executive' ? 'active' : ''} onClick={() => setViewMode('executive')}>Executive View</button>
          <button type="button" className={viewMode === 'evidence' ? 'active' : ''} onClick={() => setViewMode('evidence')}>Evidence View</button>
          <button type="button" className={viewMode === 'field' ? 'active' : ''} onClick={() => setViewMode('field')}>Field Coaching View</button>
        </div>
        {matrix.rows.length ? (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  {matrix.competitors.map((name) => <th key={name}>{name}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.capability}>
                    <td><strong>{row.capability}</strong></td>
                    {row.cells.map((cell) => (
                      <td key={`${row.capability}-${cell.competitorName}`}>
                        <button type="button" className="cc-matrix-cell-btn" onClick={() => setSelected({ capability: row.capability, competitorName: cell.competitorName })}>
                          <Badge tone={cell.status === 'Confirmed match' ? 'green' : cell.status === 'Related capability' ? 'blue' : cell.status === 'Andwell advantage' ? 'teal' : 'amber'}>{cell.status}</Badge>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Capability matrix ready to build" body="Enter public sources and build intelligence to generate a full Andwell baseline comparison." />
        )}
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
            <div className="cc-list-item"><strong>Referral source question</strong><p>{selectedCell.fieldQuestion}</p></div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export function GrowthMapScreenView({ growthMap }: { growthMap: GrowthMap }) {
  const [selected, setSelected] = useState<string | null>(growthMap.areas[0]?.area || null);
  const [layers, setLayers] = useState({
    growth: true,
    saturation: true,
    advantage: true,
    partnership: true,
    payer: true,
    field: true,
    confidence: true
  });
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
            <button key={key} type="button" className={enabled ? 'active' : ''} onClick={() => setLayers((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}>
              {key === 'growth' ? 'Growth' : key === 'saturation' ? 'Saturation' : key === 'advantage' ? 'Advantage' : key === 'partnership' ? 'Partnership' : key === 'payer' ? 'Payer Value' : key === 'field' ? 'Field Focus' : 'Confidence'}
            </button>
          ))}
        </div>
        <div className="cc-source-grid">
          {growthMap.areas.map((area) => (
            <button key={area.area} type="button" className={`cc-area-card ${selected === area.area ? 'active' : ''}`} onClick={() => setSelected(area.area)}>
              <strong>{area.area}</strong>
              <span>{area.signal}</span>
              <small>
                {layers.growth ? `Growth ${area.growthOpportunityScore}` : null}
                {layers.saturation ? ` | Saturation ${area.saturationScore}` : null}
                {layers.advantage ? ` | Advantage ${area.andwellAdvantageScore}` : null}
                {layers.confidence ? ` | Confidence ${area.evidenceConfidence}` : null}
              </small>
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
            <div className="cc-list-item"><strong>Referral Source Potential</strong><p>{selectedArea.referralSourcePotential}</p></div>
            <div className="cc-list-item"><strong>Partnership Potential</strong><p>{selectedArea.partnershipPotential}</p></div>
            <div className="cc-list-item"><strong>Payer Value Potential</strong><p>{selectedArea.payerValuePotential}</p></div>
            <div className="cc-list-item"><strong>Competitors detected</strong><p>{selectedArea.competitors.join(', ') || 'Evidence limited'}</p></div>
            <div className="cc-list-item"><strong>Relevant capabilities</strong><p>{selectedArea.capabilities.join(', ') || 'Evidence limited'}</p></div>
            <div className="cc-list-item"><strong>Safe talk track</strong><p>{selectedArea.safeTalkTrack}</p></div>
            <div className="cc-list-item"><strong>What not to say</strong><p>{selectedArea.avoidLanguage}</p></div>
            <div className="cc-list-item"><strong>Recommended next move</strong><p>{selectedArea.nextMove}</p></div>
            <div className="cc-list-item"><strong>Suggested source to add next</strong><p>{selectedArea.sourceToAdd}</p></div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export function StrategyScreenView({ report, onBuild, matrix, growthMap }: { report: IntelligenceReport | null; onBuild: () => void; matrix: AdvantageMatrix; growthMap: GrowthMap }) {
  if (!report) {
    return <EmptyState title="Strategy builder ready" body="Enter public sources and build intelligence to generate growth plays, field guidance, and leadership strategy outputs." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />;
  }
  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Competitors" value={report.competitorsAnalyzed} detail="Analyzed in latest report" tone="blue" />
        <Metric label="Pages reviewed" value={number(report.pagesReviewed)} detail="Public evidence pages" tone="teal" />
        <Metric label="Matched services" value={report.matchedServiceFindings} detail="Clearly offered by competitors" tone="green" />
        <Metric label="Evidence guardrails" value={report.aiGovernance?.guardedUseCount ?? 0} detail="Claims kept in safe language" tone="amber" />
      </div>
      <Card title="Matrix and map strategy signals" eyebrow="What and where">
        <div className="cc-list">
          <div className="cc-list-item"><strong>Capability comparison</strong><p>{matrix.summary.capabilitiesMapped} capabilities mapped across {matrix.summary.competitorsCompared || 'active'} competitors.</p></div>
          <div className="cc-list-item"><strong>Top growth opportunities</strong><p>{growthMap.summary.topGrowthAreas.join(', ') || 'Run source intake to rank growth areas.'}</p></div>
          <div className="cc-list-item"><strong>Field focus zones</strong><p>{growthMap.summary.fieldFocusZones.join(', ') || 'Growth map ready to build from source evidence.'}</p></div>
        </div>
      </Card>
    </div>
  );
}

export function CoachScreenView({
  report,
  question,
  setQuestion,
  askBusy,
  askResponse,
  onAsk,
  matrix,
  growthMap
}: {
  report: IntelligenceReport | null;
  question: string;
  setQuestion: (value: string) => void;
  askBusy: boolean;
  askResponse: AskResponse | null;
  onAsk: () => void;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
}) {
  const starters = [
    'What should I say to a referral source?',
    'What differentiates Andwell here?',
    'Where should Andwell focus growth?',
    'Where is the market most saturated?',
    'What source evidence supports this?',
    'What is the next best move?'
  ];

  return (
    <div className="cc-stack">
      <Card title="AI Intelligence Coach" action={<Badge tone={report ? 'green' : 'amber'}>{report ? 'Evidence package loaded' : 'Coach engine ready'}</Badge>}>
        <div className="cc-coach-intro">
          <Sparkles size={20} />
          <div>
            <strong>Ask from stored evidence only.</strong>
            <p>The coach answers from the latest report, cites relevant findings, and keeps language inside safe guardrails.</p>
          </div>
        </div>
        <div className="cc-prompt-row">
          {starters.map((starter) => (
            <button key={starter} type="button" onClick={() => setQuestion(starter)}>{starter}</button>
          ))}
        </div>
        <textarea className="cc-textarea compact" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask the system..." />
        <div className="cc-action-row">
          <Button variant="primary" disabled={askBusy || !question.trim() || !report} onClick={onAsk}>
            {askBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Send size={16} />} Ask AI Coach
          </Button>
        </div>
        <Notice title="Evidence intelligence ready" body={report ? `Answers use stored evidence plus ${matrix.summary.capabilitiesMapped} capability signals and ${growthMap.areas.length} market areas.` : 'Build intelligence from public sources first.'} tone={report ? 'blue' : 'amber'} />
      </Card>
      {askResponse ? (
        <Card title="Coach answer" action={<Badge tone={toneForStatus(askResponse.confidence)}>{displayStatus(askResponse.confidence)}</Badge>}>
          <p className="cc-answer">{scrubOutputText(askResponse.answer)}</p>
        </Card>
      ) : null}
    </div>
  );
}

export function ReportScreenView({ report, approvedItems, growthMap, matrix }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[]; growthMap: GrowthMap; matrix: AdvantageMatrix }) {
  if (!report) return <EmptyState title="Executive report ready" body="Build intelligence from public competitor sources to generate a leadership-ready output package." />;
  return (
    <div className="cc-stack">
      <Card title="Executive report" eyebrow="AI-built leadership output" action={<Button variant="primary" onClick={() => window.print()}><FileText size={16} /> Print Report</Button>}>
        <div className="cc-metric-grid">
          <Metric label="Report status" value="Built" detail="AI-generated from stored evidence" tone="green" />
          <Metric label="Scrubbed outputs" value={approvedItems.length} detail="Safe language items" tone="green" />
          <Metric label="Public pages" value={report.pagesReviewed} detail="Reviewed by crawler and AI rules" tone="teal" />
          <Metric label="Guardrails" value={report.aiGovernance?.guardedUseCount ?? 0} detail="Claims kept cautious" tone="amber" />
        </div>
      </Card>
      <Card title="Advantage Matrix and Growth Map summary">
        <div className="cc-list">
          <div className="cc-list-item"><strong>Capabilities mapped</strong><p>{matrix.summary.capabilitiesMapped || 'Ready'}</p></div>
          <div className="cc-list-item"><strong>Top growth areas</strong><p>{growthMap.summary.topGrowthAreas.join(', ') || 'Additional sources strengthen this output package.'}</p></div>
        </div>
      </Card>
    </div>
  );
}

export function SystemScreenView({ state }: { state: CommandCenterState }) {
  const checks = [
    { title: 'API routes', ok: true, detail: '/api/health, /api/diagnostics, /api/runtime, /api/analyze, /api/ask' },
    { title: 'Storage service', ok: Boolean(state.runtime?.persistence.supabaseConfigured), detail: state.runtime?.persistence.supabaseConfigured ? 'Primary persistence is active for production writes.' : 'Primary persistence is not configured in this environment.' },
    { title: 'Analysis service', ok: Boolean(state.analyzeHealth?.aiConfigured), detail: state.analyzeHealth?.aiConfigured ? 'Advanced extraction is active for deeper evidence intelligence.' : 'Deterministic evidence analysis is active for source processing.' }
  ];
  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Runtime" value={state.runtime?.nodeVersion || 'Unknown'} detail={state.runtime?.nextRuntime || 'Next.js API'} tone="blue" />
        <Metric label="Persistence" value={state.runtime?.persistence.supabaseConfigured ? 'Supabase' : 'Local'} detail="Production source of truth" tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'} />
        <Metric label="Analysis mode" value={state.analyzeHealth?.aiConfigured ? 'Advanced extraction' : 'Deterministic evidence'} detail={state.analyzeHealth?.message || 'Analyze API'} tone={state.analyzeHealth?.aiConfigured ? 'teal' : 'amber'} />
        <Metric label="Crawl pages" value={state.analyzeHealth?.crawlMaxPagesPerSiteLimit || 0} detail="Max per competitor" tone="slate" />
      </div>
      <Card title="Operational checks" eyebrow="System diagnostics">
        <div className="cc-check-grid">
          {checks.map((check) => (
            <div key={check.title} className={`cc-check ${check.ok ? 'ok' : 'attention'}`}>
              {check.ok ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
              <strong>{check.title}</strong>
              <p>{check.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
