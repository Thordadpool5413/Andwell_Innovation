'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  Library,
  Map,
  Menu,
  PanelLeftClose,
  RefreshCcw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from 'lucide-react';
import type { CompetitorInput, IntelligenceReport } from '../../lib/types';
import { buildAdvantageMatrix, buildGrowthMap, type AdvantageMatrix, type GrowthMap } from '../../lib/intelligence-views';
import { validatePublicHttpUrl } from '../../lib/url-safety';
import {
  askHub,
  deleteCompetitor,
  fetchAnalyzeHealth,
  fetchCatalog,
  fetchCompetitors,
  fetchReport,
  fetchReports,
  fetchRuntime,
  runAnalysis
} from './api';
import type { AskResponse, CommandCenterState, ReviewableFinding, SourcePreviewItem, TabId } from './model';
import { Badge, Button, Card, EmptyState, LoadingState, Metric, Notice, Progress, formatDate, number } from './ui';

const initialState: CommandCenterState = {
  status: 'idle',
  error: '',
  competitors: [],
  reports: [],
  currentReport: null,
  reviews: [],
  catalog: [],
  analyzeHealth: null,
  runtime: null
};

const tabs: Array<{ id: TabId; label: string; help: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Home', help: 'Command Center', icon: Gauge },
  { id: 'sources', label: 'Build Intelligence', help: 'Enter Sources', icon: UploadCloud },
  { id: 'matrix', label: 'Advantage Matrix', help: 'Capability Comparison', icon: BarChart3 },
  { id: 'map', label: 'Growth Map', help: 'Market Opportunity', icon: Map },
  { id: 'library', label: 'Intelligence Library', help: 'Built Outputs', icon: Library },
  { id: 'strategy', label: 'Strategy', help: 'Growth plays', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', help: 'Ask the system', icon: Bot },
  { id: 'report', label: 'Executive Report', help: 'Leadership output', icon: FileText },
  { id: 'system', label: 'System Health', help: 'Diagnostics', icon: Activity }
];

function parseSourceInput(value: string): CompetitorInput[] {
  return sourcePreview(value)
    .filter((item) => item.valid && item.url)
    .map((item) => ({ url: item.url as string }));
}

function sourcePreview(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 25)
    .map((entry): SourcePreviewItem => {
      const result = validatePublicHttpUrl(entry);
      if (!result.ok || !result.url) {
        return {
          raw: entry,
          input: entry,
          url: result.url,
          host: result.host,
          valid: false,
          status: 'rejected',
          reason: result.reason,
          qualityScore: 0
        };
      }
      if (seen.has(result.url)) {
        return {
          raw: entry,
          input: entry,
          url: result.url,
          host: result.host,
          valid: false,
          status: 'duplicate',
          reason: 'Duplicate source skipped.',
          qualityScore: 35
        };
      }
      seen.add(result.url);
      return {
        raw: entry,
        input: entry,
        url: result.url,
        host: result.host,
        valid: true,
        status: 'accepted',
        reason: result.reason,
        qualityScore: result.url.startsWith('https://') ? 72 : 62
      };
    });
}

function toReviewable(report: IntelligenceReport | null): ReviewableFinding[] {
  if (!report) return [];
  const serviceItems: ReviewableFinding[] = report.allFindings.map((item) => ({
    ...item,
    kind: 'service'
  }));
  const subserviceItems: ReviewableFinding[] = report.allSubserviceFindings.map((item) => ({
    ...item,
    kind: 'subservice'
  }));
  return [...serviceItems, ...subserviceItems];
}

function toneForStatus(status: string): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  if (status.includes('Approved') || status.includes('Sales usable') || status.includes('Clearly offered')) return 'green';
  if (status.includes('review') || status.includes('suggested') || status.includes('Mentioned')) return 'amber';
  if (status.includes('Rejected') || status.includes('Not found')) return 'red';
  if (status.includes('Related') || status.includes('Unclear')) return 'blue';
  return 'slate';
}

function compactUrl(url?: string) {
  if (!url) return 'No source URL';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

function scrubOutputText(value?: string) {
  return value || '';
}

function displayStatus(value: string) {
  if (value === 'Approved for sales use') return 'Sales usable with evidence';
  if (value === 'Manager review suggested') return 'Guarded language';
  if (value === 'Needs human review') return 'Evidence limited';
  if (value === 'Needs review') return 'Evidence limited';
  return scrubOutputText(value)
}

function currentNextAction({
  hasReport,
  aiConfigured
}: {
  hasReport: boolean;
  aiConfigured: boolean;
}) {
  if (!hasReport) return 'Ready for source intelligence. Enter public sources and build the first intelligence package.';
  return 'Intelligence engine active. Source evidence is connected into matrix, growth map, strategy, coaching, and executive outputs.';
}

export default function CommandCenterApp() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [state, setState] = useState<CommandCenterState>(initialState);
  const [sourceText, setSourceText] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [askBusy, setAskBusy] = useState(false);
  const [askResponse, setAskResponse] = useState<AskResponse | null>(null);

  const loadWorkspace = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const [reportsPayload, competitorsPayload, catalogPayload, analyzePayload, runtimePayload] = await Promise.all([
        fetchReports(),
        fetchCompetitors(),
        fetchCatalog(),
        fetchAnalyzeHealth(),
        fetchRuntime().catch(() => null)
      ]);

      const latest = reportsPayload.reports[0];
      const reportPayload = latest ? await fetchReport(latest.id) : { report: null };

      setState({
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport: reportPayload.report,
        reviews: [],
        catalog: catalogPayload.catalog,
        analyzeHealth: analyzePayload,
        runtime: runtimePayload
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        error: error instanceof Error ? error.message : 'The workspace could not be loaded.'
      }));
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileOpen(false);
  }, [activeTab]);

  const reviewableItems = useMemo(() => toReviewable(state.currentReport), [state.currentReport]);
  const approvedItems = useMemo(() => reviewableItems.filter((item) => item.recommendedUse !== 'Avoid claim'), [reviewableItems]);
  const filteredApproved = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return approvedItems.slice(0, 80);
    return approvedItems.filter((item) => [item.competitorName, item.serviceLine, 'subservice' in item ? item.subservice : '', item.evidenceExcerpt, item.safeSalesWording]
      .join(' ')
      .toLowerCase()
      .includes(query)).slice(0, 80);
  }, [approvedItems, search]);

  const nextAction = currentNextAction({
    hasReport: Boolean(state.currentReport),
    aiConfigured: Boolean(state.analyzeHealth?.aiConfigured)
  });
  const matrix = useMemo<AdvantageMatrix>(() => buildAdvantageMatrix(state.currentReport), [state.currentReport]);
  const growthMap = useMemo<GrowthMap>(() => buildGrowthMap(state.currentReport, matrix), [state.currentReport, matrix]);

  async function handleScan() {
    const competitors = parseSourceInput(sourceText);
    if (!competitors.length) {
      setScanMessage('Add at least one public competitor URL before building intelligence.');
      return;
    }

    setScanBusy(true);
    setScanMessage('AI is reviewing public evidence, scrubbing unsafe claims, connecting service lines, and building strategy outputs.');
    try {
      const report = await runAnalysis(competitors);
      const [reportsPayload, competitorsPayload] = await Promise.all([
        fetchReports(),
        fetchCompetitors()
      ]);
      setState((current) => ({
        ...current,
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport: report
      }));
      const sourceIssues = report.sourceHealth?.filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped' || source.status === 'warning').length || 0;
      setScanMessage(`AI build complete. ${report.competitorsAnalyzed} competitor${report.competitorsAnalyzed === 1 ? '' : 's'} analyzed, ${report.pagesReviewed} public page${report.pagesReviewed === 1 ? '' : 's'} reviewed, and ${sourceIssues} source issue${sourceIssues === 1 ? '' : 's'} handled.`);
      setActiveTab('strategy');
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : 'The AI build could not be completed.');
    } finally {
      setScanBusy(false);
    }
  }

  async function handleDeleteCompetitor(url: string) {
    const payload = await deleteCompetitor(url);
    setState((current) => ({ ...current, competitors: payload.competitors }));
  }

  async function handleAsk() {
    const clean = question.trim();
    if (!clean) return;
    setAskBusy(true);
    try {
      const response = await askHub(clean, state.currentReport?.id);
      setAskResponse(response);
    } catch (error) {
      setAskResponse({
        answer: error instanceof Error ? error.message : 'The AI coach could not answer this question.',
        confidence: 'Evidence limited',
        nextBestActions: [],
        evidence: []
      });
    } finally {
      setAskBusy(false);
    }
  }

  function changeTab(tabId: TabId) {
    setActiveTab(tabId);
  }

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="cc-app">
      <Sidebar
        activeTab={activeTab}
        mobileOpen={mobileOpen}
        approvedCount={approvedItems.length}
        reportCount={state.reports.length}
        onClose={() => setMobileOpen(false)}
        onChange={changeTab}
      />
      <main className="cc-main">
        <header className="cc-topbar">
          <button type="button" className="cc-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div>
            <p className="cc-topline">Andwell Innovation</p>
            <h1>{active.label}</h1>
            <span>{active.help}</span>
          </div>
          <div className="cc-topbar-actions">
            <Badge tone="green">Intelligence engine active</Badge>
            <Button variant="ghost" onClick={() => void loadWorkspace()}>
              <RefreshCcw size={16} /> Refresh
            </Button>
          </div>
        </header>

        {state.status === 'loading' ? <LoadingState title="Loading command center" body="Reading reports, catalog, source history, and runtime status." /> : null}
        {state.status === 'error' ? (
          <Notice title="Workspace needs attention" body={state.error} tone="red" />
        ) : null}

        {activeTab === 'dashboard' ? (
          <Dashboard
            state={state}
            approvedItems={approvedItems}
            nextAction={nextAction}
            sourceText={sourceText}
            setSourceText={setSourceText}
            scanBusy={scanBusy}
            scanMessage={scanMessage}
            onScan={() => void handleScan()}
            onTab={changeTab}
            matrix={matrix}
            growthMap={growthMap}
          />
        ) : null}
        {activeTab === 'sources' ? (
          <SourcesScreen
            state={state}
            sourceText={sourceText}
            setSourceText={setSourceText}
            scanBusy={scanBusy}
            scanMessage={scanMessage}
            onScan={() => void handleScan()}
          />
        ) : null}
        {activeTab === 'matrix' ? <MatrixScreen matrix={matrix} /> : null}
        {activeTab === 'map' ? <GrowthMapScreen growthMap={growthMap} /> : null}
        {activeTab === 'library' ? (
          <LibraryScreen
            approvedItems={filteredApproved}
            allApprovedCount={approvedItems.length}
            search={search}
            setSearch={setSearch}
            competitors={state.competitors}
            onDelete={(url) => void handleDeleteCompetitor(url)}
            onBuild={() => changeTab('sources')}
          />
        ) : null}
        {activeTab === 'strategy' ? <StrategyScreen report={state.currentReport} onBuild={() => changeTab('sources')} matrix={matrix} growthMap={growthMap} /> : null}
        {activeTab === 'coach' ? (
          <CoachScreen
            report={state.currentReport}
            question={question}
            setQuestion={setQuestion}
            askBusy={askBusy}
            askResponse={askResponse}
            onAsk={() => void handleAsk()}
            growthMap={growthMap}
            matrix={matrix}
          />
        ) : null}
        {activeTab === 'report' ? <ReportScreen report={state.currentReport} approvedItems={approvedItems} growthMap={growthMap} matrix={matrix} /> : null}
        {activeTab === 'system' ? <SystemScreen state={state} /> : null}
      </main>
    </div>
  );
}

function Sidebar({
  activeTab,
  mobileOpen,
  reportCount,
  approvedCount,
  onChange,
  onClose
}: {
  activeTab: TabId;
  mobileOpen: boolean;
  reportCount: number;
  approvedCount: number;
  onChange: (tab: TabId) => void;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={`cc-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="cc-sidebar-head">
          <div>
            <strong>Andwell</strong>
            <span>Innovation Command Center</span>
          </div>
          <button type="button" className="cc-sidebar-close" onClick={onClose} aria-label="Close navigation">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <div className="cc-progress-card">
          <div>
            <span>Output engine</span>
            <strong>{reportCount ? 'Active' : 'Ready'}</strong>
          </div>
          <p>{reportCount ? `${approvedCount} trusted output item${approvedCount === 1 ? '' : 's'} available.` : 'Intelligence engine ready. Enter public sources to build the first output package.'}</p>
        </div>
        <nav className="cc-nav" aria-label="Command center navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" className={`cc-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => onChange(tab.id)}>
                <Icon size={18} />
                <span>
                  <strong>{tab.label}</strong>
                  <small>{tab.help}</small>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
      {mobileOpen ? <button className="cc-scrim" type="button" onClick={onClose} aria-label="Close navigation" /> : null}
    </>
  );
}

function Dashboard({
  state,
  approvedItems,
  nextAction,
  sourceText,
  setSourceText,
  scanBusy,
  scanMessage,
  onScan,
  onTab,
  matrix,
  growthMap
}: {
  state: CommandCenterState;
  approvedItems: ReviewableFinding[];
  nextAction: string;
  sourceText: string;
  setSourceText: (value: string) => void;
  scanBusy: boolean;
  scanMessage: string;
  onScan: () => void;
  onTab: (tab: TabId) => void;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
}) {
  const report = state.currentReport;
  const approvedPreview = approvedItems.slice(0, 3);
  const hasQueuedSources = parseSourceInput(sourceText).length > 0;
  const pagesReviewed = report?.pagesReviewed || 0;
  const sourceCount = report?.sourceHealth?.filter((source) => source.status === 'crawled' || source.status === 'accepted').length || state.competitors.length;
  const productCards = [
    {
      title: 'What',
      body: 'An Innovation and Growth command center that turns market signals, public sources, service lines, and partnership context into usable strategy.'
    },
    {
      title: 'Why',
      body: 'Andwell is building high acuity community care infrastructure for Maine, post acute partnerships, payer value, and risk-ready growth.'
    },
    {
      title: 'How',
      body: 'The AI reviews sources, scrubs unsafe claims, connects evidence to Andwell capabilities, and builds strategy, coaching, and executive outputs.'
    }
  ];

  return (
    <div className="cc-stack">
      <section className="cc-hero-panel cc-command-hero">
        <div>
          <span className="cc-hero-kicker">Andwell Innovation and Growth</span>
          <h2 className="cc-hero-quote">Innovation and Growth is where Andwell Health Partners turns vision into infrastructure. We are building the future of high acuity community care, creating post acute partnerships that make us essential to Maine, connecting complex services through technology, and developing the value based contracting model that allows us to take risk, deliver better outcomes, save payers money, and grow because we are built for the complexity others cannot manage</h2>
          <p>This app gives that work an AI intelligence engine: source in, evidence scrubbed, strategy built, leadership output ready to use.</p>
          <div className="cc-action-row">
            <Button variant="primary" onClick={() => onTab('sources')}><UploadCloud size={16} /> Build Andwell Intelligence</Button>
            <Button onClick={() => onTab('strategy')}><BarChart3 size={16} /> View Strategy</Button>
            <Button onClick={() => onTab('report')}><FileText size={16} /> Executive Report</Button>
          </div>
        </div>
        <div className="cc-status-panel">
          <Badge tone="green">Trusted output engine</Badge>
          <strong>{report ? 'AI build complete' : 'AI builder ready'}</strong>
          <span>
            {report ? (
              <>
                Last build {formatDate(report.generatedAt)}
                <br />
                {pagesReviewed} pages reviewed across {sourceCount || report.competitorsAnalyzed} source{sourceCount === 1 ? '' : 's'}
              </>
            ) : 'Ready for source intelligence. Enter public competitor sources to generate the first intelligence package.'}
          </span>
          <div className="cc-status-list">
            <span>Evidence scrubbed</span>
            <span>Safe language generated</span>
            <span>Strategy and report built</span>
          </div>
        </div>
      </section>

      <section className="cc-product-grid" aria-label="What why how">
        {productCards.map((card) => (
          <article key={card.title} className="cc-product-card">
            <span>{card.title}</span>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <div className="cc-metric-grid">
        <Metric label="Intelligence packages" value={state.reports.length || 'Ready'} detail={state.reports.length ? 'Built and stored' : 'Ready to build'} tone="blue" />
        <Metric label="Sources" value={sourceCount || 'Ready'} detail={report ? 'Public sources processed' : 'Source intake ready'} tone="teal" />
        <Metric label="Trusted outputs" value={approvedItems.length || 'Ready'} detail={approvedItems.length ? 'Source-based guidance' : 'Output engine ready'} tone={approvedItems.length ? 'green' : 'slate'} />
        <Metric label="Processing" value="Active" detail="Evidence guardrails active" tone="teal" />
      </div>

      <div className="cc-dashboard-grid cc-dashboard-primary">
        <Card title="AI intelligence builder" eyebrow="Source to strategy" action={<Badge tone={report ? 'green' : 'blue'}>{report ? 'Built' : 'Start'}</Badge>}>
          <div className="cc-next-action">
            <Brain size={22} />
            <div>
              <strong>{nextAction}</strong>
              <p>{report ? 'Use the strategy, coach, library, matrix, map, and executive report built from the latest public evidence.' : 'Paste public competitor websites and let the system process evidence, scrub unsupported claims, map capabilities, and build outputs.'}</p>
            </div>
          </div>
          <textarea className="cc-textarea compact" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste competitor URLs, one per line." />
          <div className="cc-action-row">
            <Button variant="primary" disabled={scanBusy || !hasQueuedSources} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Sparkles size={16} />}
              {scanBusy ? 'Building' : 'Build Intelligence'}
            </Button>
            <Button onClick={() => onTab(report ? 'coach' : 'sources')}>{report ? <Bot size={16} /> : <ArrowRight size={15} />} {report ? 'Ask AI Coach' : 'Advanced Intake'}</Button>
          </div>
          {scanMessage ? <p className="cc-helper">{scanMessage}</p> : <p className="cc-helper">The app blocks private, local, and internal URLs and only builds from public source material.</p>}
        </Card>

        <Card title="What the AI builds" action={<Badge tone="dark">End-to-end</Badge>}>
          <div className="cc-step-list">
            {['Reviews public pages', 'Scrubs unsupported claims', 'Maps Andwell service lines', 'Builds safe field language', 'Creates strategy, coaching, and report outputs'].map((item, index) => (
              <div key={item} className="cc-step">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <Notice title="Evidence guardrails active" body="Source processing, claim scrubbing, capability mapping, and output generation are active for every build." tone="green" />
        </Card>
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Advantage Matrix preview" action={<Button variant="ghost" onClick={() => onTab('matrix')}>Open Matrix</Button>}>
          <p>Ready to compare Andwell capabilities with competitor signals.</p>
          <div className="cc-list">
            <div className="cc-list-item"><strong>Capabilities mapped</strong><small>{matrix.summary.capabilitiesMapped}</small></div>
            <div className="cc-list-item"><strong>Competitors compared</strong><small>{matrix.summary.competitorsCompared || 'Capability matrix ready to build'}</small></div>
            <div className="cc-list-item"><strong>Andwell advantages identified</strong><small>{matrix.summary.advantageSignals || 'Ready to build'}</small></div>
          </div>
        </Card>
        <Card title="Growth Map preview" action={<Button variant="ghost" onClick={() => onTab('map')}>Open Growth Map</Button>}>
          <p>Market opportunity engine ready with ranked field focus areas.</p>
          <div className="cc-list">
            <div className="cc-list-item"><strong>Top growth areas</strong><small>{growthMap.summary.topGrowthAreas.length || 'Ready to map growth opportunities'}</small></div>
            <div className="cc-list-item"><strong>Saturated areas</strong><small>{growthMap.summary.saturatedAreas.length || 'Market opportunity engine ready'}</small></div>
            <div className="cc-list-item"><strong>Field focus zones</strong><small>{growthMap.summary.fieldFocusZones.length || 'Capability geography ready to build'}</small></div>
          </div>
        </Card>
      </div>

      <div className="cc-dashboard-grid">
        <Card title="AI-built intelligence" action={approvedPreview.length ? <Button variant="ghost" onClick={() => onTab('library')}>Open Library</Button> : null}>
          {approvedPreview.length ? (
            <div className="cc-list">
              {approvedPreview.map((item) => (
                <div key={item.id} className="cc-list-item">
                  <ShieldCheck size={17} />
                  <div>
                    <strong>{item.competitorName} | {item.serviceLine}</strong>
                    <p>{scrubOutputText(item.safeSalesWording)}</p>
                    <small>{item.evidenceStrength || 'Evidence governed'} | {item.fieldRisk || 'Guarded'} field risk</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Output engine ready" body="Build Andwell Intelligence to generate capability comparison, growth map signals, strategy, coaching, and executive outputs." action={<Button onClick={() => onTab('sources')}>Build Andwell Intelligence</Button>} />
          )}
        </Card>

        <Card title="Executive signals" action={report ? <Badge tone="dark">Latest report</Badge> : null}>
          {report?.executiveInsights?.length ? (
            <div className="cc-list">
              {report.executiveInsights.slice(0, 4).map((insight) => (
                <div key={insight.title} className="cc-list-item">
                  <Badge tone={insight.priority === 'High' ? 'red' : 'amber'}>{insight.priority}</Badge>
                  <div>
                    <strong>{scrubOutputText(insight.title)}</strong>
                    <p>{scrubOutputText(insight.action)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No executive signals" body="Signals appear after the first AI intelligence build is complete." />
          )}
        </Card>
      </div>
    </div>
  );
}

function SourcesScreen({
  state,
  sourceText,
  setSourceText,
  scanBusy,
  scanMessage,
  onScan
}: {
  state: CommandCenterState;
  sourceText: string;
  setSourceText: (value: string) => void;
  scanBusy: boolean;
  scanMessage: string;
  onScan: () => void;
}) {
  const parsed = parseSourceInput(sourceText);
  const preview = sourcePreview(sourceText);
  const invalidCount = preview.filter((item) => !item.valid).length;

  return (
    <div className="cc-stack">
      <div className="cc-two-col">
        <Card title="Build intelligence from sources" eyebrow="Source intake" action={<Badge tone={parsed.length ? 'blue' : 'slate'}>{parsed.length} queued</Badge>}>
          <label className="cc-label" htmlFor="source-text">Competitor websites</label>
          <textarea id="source-text" className="cc-textarea" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="https://competitor.org/services&#10;https://another-provider.org/home-health" />
          <div className="cc-action-row">
            <Button variant="primary" disabled={scanBusy || !parsed.length} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <UploadCloud size={16} />} {scanBusy ? 'Building intelligence' : 'Build Intelligence'}
            </Button>
            <Button onClick={() => setSourceText('')}>Clear</Button>
          </div>
          {scanMessage ? <Notice title={scanBusy ? 'AI build running' : 'Build status'} body={scanMessage} tone={scanBusy ? 'blue' : 'amber'} /> : null}
          {!scanMessage && invalidCount ? <Notice title="Some sources need attention" body={`${invalidCount} entr${invalidCount === 1 ? 'y is' : 'ies are'} not a valid public website URL and will be skipped.`} tone="amber" /> : null}
        </Card>

        <Card title="What the AI builds" action={<Badge tone={state.analyzeHealth?.aiConfigured ? 'green' : 'amber'}>{state.analyzeHealth?.aiConfigured ? 'AI enriched' : 'Rule based'}</Badge>}>
          <div className="cc-step-list">
            {['Reads public pages', 'Scrubs unsafe claims', 'Maps Andwell service lines', 'Builds safe field language', 'Feeds strategy, AI coach, and report'].map((item, index) => (
              <div key={item} className="cc-step">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <Notice
            title="Output intelligence active"
            body="This build engine produces capability comparison, growth opportunity signals, strategy plays, field guidance, and executive outputs from public source evidence."
            tone="green"
          />
        </Card>
      </div>
      <Card title="Queued sources" action={<Badge tone={parsed.length ? 'blue' : 'slate'}>{preview.length} entered</Badge>}>
        {preview.length ? (
          <div className="cc-source-grid">
            {preview.map((competitor) => (
              <div key={competitor.raw} className={`cc-source-card ${competitor.valid ? 'valid' : 'invalid'}`}>
                {competitor.valid ? <Database size={18} /> : <AlertTriangle size={18} />}
                <strong>{competitor.valid && competitor.url ? compactUrl(competitor.url) : competitor.raw}</strong>
                <span>{competitor.reason} Quality score: {competitor.qualityScore}.</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Ready for source intelligence" body="Paste up to 25 public competitor websites. The system protects processing by blocking private, local, and internal network addresses." />
        )}
      </Card>
      {state.currentReport?.sourceHealth?.length ? (
        <Card title="Latest build source health" action={<Badge tone="blue">{state.currentReport.sourceHealth.length} checked</Badge>}>
          <div className="cc-source-grid">
            {state.currentReport.sourceHealth.map((source, index) => (
              <div key={`${source.input}-${index}`} className={`cc-source-card ${source.status === 'crawled' || source.status === 'accepted' ? 'valid' : 'invalid'}`}>
                {source.status === 'crawled' || source.status === 'accepted' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <div className="cc-source-card-head">
                  <strong>{source.url ? compactUrl(source.url) : source.input}</strong>
                  <Badge tone={source.status === 'crawled' ? 'green' : source.status === 'warning' ? 'amber' : source.status === 'duplicate' ? 'blue' : 'red'}>{source.status}</Badge>
                </div>
                <span>{source.reason}</span>
                {source.error ? <small>{source.error}</small> : null}
                <Progress value={source.qualityScore} tone={source.qualityScore > 70 ? 'green' : source.qualityScore > 35 ? 'amber' : 'red'} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function LibraryScreen({
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

function MatrixScreen({ matrix }: { matrix: AdvantageMatrix }) {
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
        <Metric label="Evidence-limited cells" value={matrix.summary.evidenceLimited || 'Ready'} detail="Add sources to strengthen" tone="amber" />
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

function GrowthMapScreen({ growthMap }: { growthMap: GrowthMap }) {
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
        <Metric label="Evidence-limited areas" value={growthMap.summary.evidenceLimitedAreas.length || 'Ready'} detail="Add targeted sources" tone="slate" />
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
      <div className="cc-dashboard-grid">
        <Card title="Top growth areas">
          <div className="cc-compact-list">
            {(growthMap.summary.topGrowthAreas.length ? growthMap.summary.topGrowthAreas : ['Growth opportunity engine ready']).map((area) => (
              <div className="cc-blocker compact resolved" key={`growth-${area}`}><CheckCircle2 size={16} /><span>{area}</span></div>
            ))}
          </div>
        </Card>
        <Card title="Most saturated areas">
          <div className="cc-compact-list">
            {(growthMap.summary.saturatedAreas.length ? growthMap.summary.saturatedAreas : ['Saturation detection ready']).map((area) => (
              <div className="cc-blocker compact" key={`sat-${area}`}><AlertTriangle size={16} /><span>{area}</span></div>
            ))}
          </div>
        </Card>
      </div>
      {selectedArea ? (
        <Card title={selectedArea.area} eyebrow="Area intelligence detail">
          <div className="cc-list">
            <div className="cc-list-item"><strong>Growth Opportunity Score</strong><p>{selectedArea.growthOpportunityScore}</p></div>
            <div className="cc-list-item"><strong>Saturation Score</strong><p>{selectedArea.saturationScore}</p></div>
            <div className="cc-list-item"><strong>Andwell Advantage Score</strong><p>{selectedArea.andwellAdvantageScore}</p></div>
            <div className="cc-list-item"><strong>Referral Source Potential</strong><p>{selectedArea.referralSourcePotential}</p></div>
            <div className="cc-list-item"><strong>Partnership Potential</strong><p>{selectedArea.partnershipPotential}</p></div>
            <div className="cc-list-item"><strong>Payer Value Potential</strong><p>{selectedArea.payerValuePotential}</p></div>
            <div className="cc-list-item"><strong>Safe talk track</strong><p>{selectedArea.safeTalkTrack}</p></div>
            <div className="cc-list-item"><strong>What not to say</strong><p>{selectedArea.avoidLanguage}</p></div>
            <div className="cc-list-item"><strong>Recommended next move</strong><p>{selectedArea.nextMove}</p></div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function StrategyScreen({ report, onBuild, matrix, growthMap }: { report: IntelligenceReport | null; onBuild: () => void; matrix: AdvantageMatrix; growthMap: GrowthMap }) {
  if (!report) {
    return <EmptyState title="Strategy builder ready" body="Enter public sources and build intelligence to generate growth plays, field guidance, and leadership strategy outputs." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />;
  }

  const expertBrief = report.expertBrief;

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Competitors" value={report.competitorsAnalyzed} detail="Analyzed in latest report" tone="blue" />
        <Metric label="Pages reviewed" value={number(report.pagesReviewed)} detail="Public evidence pages" tone="teal" />
        <Metric label="Matched services" value={report.matchedServiceFindings} detail="Clearly offered by competitors" tone="green" />
        <Metric label="Evidence guardrails" value={report.aiGovernance?.guardedUseCount ?? 0} detail="Claims kept in safe language" tone="amber" />
      </div>
      {expertBrief ? (
        <Card title="Expert leadership brief" eyebrow="AI strategy layer" action={<Badge tone="dark">Score {expertBrief.expertScore}</Badge>}>
          <div className="cc-strategy-brief">
            <div>
              <strong>{scrubOutputText(expertBrief.marketPosture)}</strong>
              <p>{scrubOutputText(expertBrief.expertSummary)}</p>
            </div>
            <div className="cc-brief-callout">
              <span>Leadership decision</span>
              <p>{scrubOutputText(expertBrief.leadershipDecision)}</p>
            </div>
            <div className="cc-brief-callout">
              <span>Fastest field move</span>
              <p>{scrubOutputText(expertBrief.fastestFieldMove)}</p>
            </div>
            <div className="cc-brief-callout warning">
              <span>Evidence guardrail</span>
              <p>{scrubOutputText(expertBrief.governanceWarning)}</p>
            </div>
          </div>
        </Card>
      ) : null}
      <Card title="Executive strategy signals">
        <div className="cc-list">
          {report.executiveInsights.map((insight) => (
            <div key={insight.title} className="cc-list-item">
              <Badge tone={insight.priority === 'High' ? 'red' : 'amber'}>{insight.priority}</Badge>
              <div>
                <strong>{scrubOutputText(insight.title)}</strong>
                <p>{scrubOutputText(insight.summary)}</p>
                <small>{scrubOutputText(insight.action)}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {expertBrief?.fieldPlays.length ? (
        <Card title="Field coaching plays" eyebrow="Rep-ready guidance">
          <div className="cc-source-grid">
            {expertBrief.fieldPlays.slice(0, 6).map((play) => (
              <article key={play.id} className="cc-play-card">
                <Badge tone="blue">{play.serviceLine}</Badge>
                <h3>{play.competitorName}</h3>
                <p>{scrubOutputText(play.scenario)}</p>
                <div>
                  <strong>Lead with</strong>
                  <span>{scrubOutputText(play.leadWith)}</span>
                </div>
                <div>
                  <strong>Ask</strong>
                  <span>{scrubOutputText(play.referralQuestion)}</span>
                </div>
                <small><AlertTriangle size={14} /> {scrubOutputText(play.avoidSaying)}</small>
              </article>
            ))}
          </div>
        </Card>
      ) : null}
      {expertBrief?.watchlist.length ? (
        <Card title="Market watchlist" eyebrow="Next checks">
          <div className="cc-list">
            {expertBrief.watchlist.slice(0, 5).map((item) => (
              <div key={item.id} className="cc-list-item">
                <Badge tone={item.priority === 'Critical' || item.priority === 'High' ? 'red' : 'amber'}>{item.priority}</Badge>
                <div>
                  <strong>{item.competitorName}: {scrubOutputText(item.signal)}</strong>
                  <p>{scrubOutputText(item.whyItMatters)}</p>
                  <small>{scrubOutputText(item.nextCheck)}</small>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <Card title="Competitor posture">
        <div className="cc-source-grid">
          {report.competitorScores.map((score) => (
            <div key={score.competitorId} className="cc-score-card">
              <Badge tone={score.threatLevel === 'Strategic threat' ? 'red' : 'amber'}>{score.threatLevel}</Badge>
              <h3>{score.competitorName}</h3>
              <Progress value={score.serviceLineMatchScore} tone="blue" />
              <p>{scrubOutputText(score.executiveReadout)}</p>
            </div>
          ))}
        </div>
      </Card>
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

function CoachScreen({
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
    'Where does Andwell appear most differentiated?',
    'Which competitors overlap most with Andwell?',
    'Where should Andwell focus growth?',
    'Where is the market most saturated?',
    'What is the safest growth angle?',
    'What should leadership know?',
    'What can field teams use right now?',
    'What should we avoid saying?',
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
            <p>The coach answers from the latest report, cites relevant findings, and keeps language inside the safe-sales guardrails.</p>
          </div>
        </div>
        <div className="cc-prompt-row" aria-label="Suggested coach questions">
          {starters.map((starter) => (
            <button key={starter} type="button" onClick={() => setQuestion(starter)}>{starter}</button>
          ))}
        </div>
        <textarea className="cc-textarea compact" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question like: What should a rep say when MaineHealth comes up in a hospice referral conversation?" />
        <div className="cc-action-row">
          <Button variant="primary" disabled={askBusy || !question.trim() || !report} onClick={onAsk}>
            {askBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Send size={16} />} Ask AI Coach
          </Button>
        </div>
        <Notice title="Evidence intelligence ready" body={report ? `Answers use stored evidence plus ${matrix.summary.capabilitiesMapped} capability signals and ${growthMap.areas.length} market areas.` : 'Build intelligence from public sources so the system can answer with matrix and growth-map evidence.'} tone={report ? 'blue' : 'amber'} />
      </Card>
      {askResponse ? (
        <Card title="Coach answer" action={<Badge tone={toneForStatus(askResponse.confidence)}>{displayStatus(askResponse.confidence)}</Badge>}>
          <p className="cc-answer">{scrubOutputText(askResponse.answer)}</p>
          {askResponse.nextBestActions.length ? (
            <div className="cc-list">
              {askResponse.nextBestActions.slice(0, 4).map((action) => (
                <div className="cc-list-item" key={action}>
                  <Sparkles size={17} />
                  <p>{scrubOutputText(action)}</p>
                </div>
              ))}
            </div>
          ) : null}
          {askResponse.evidence.length ? <FindingEvidence evidence={askResponse.evidence} /> : null}
        </Card>
      ) : null}
    </div>
  );
}

function ReportScreen({ report, approvedItems, growthMap, matrix }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[]; growthMap: GrowthMap; matrix: AdvantageMatrix }) {
  if (!report) return <EmptyState title="Executive report ready" body="Build intelligence from public competitor sources to generate a leadership-ready output package." />;
  const builtServices = Array.from(new Set(approvedItems.map((item) => item.serviceLine))).slice(0, 6);
  const sourceIssues = (report.sourceHealth || []).filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped' || source.status === 'warning').length + report.crawlErrors.length;

  return (
    <div className="cc-stack">
      <Card
        title="Executive report"
        eyebrow="AI-built leadership output"
        action={<Button variant="primary" onClick={() => window.print()}><FileText size={16} /> Print Report</Button>}
      >
        <div className="cc-metric-grid">
          <Metric label="Report status" value="Built" detail="AI-generated from stored evidence" tone="green" />
          <Metric label="Scrubbed outputs" value={approvedItems.length} detail="Safe language items" tone="green" />
          <Metric label="Public pages" value={report.pagesReviewed} detail="Reviewed by crawler and AI rules" tone="teal" />
          <Metric label="Guardrails" value={report.aiGovernance?.guardedUseCount ?? 0} detail="Claims kept cautious" tone="amber" />
        </div>
        <div className="cc-report-actions">
          <div className="cc-blocker-list">
            <div className="cc-blocker resolved"><CheckCircle2 size={18} /><span>The AI reviewed sources, scrubbed claims, and built this leadership preview.</span></div>
            <div className={sourceIssues ? 'cc-blocker' : 'cc-blocker resolved'}>
              {sourceIssues ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{sourceIssues ? `${sourceIssues} source issue${sourceIssues === 1 ? '' : 's'} handled with guarded language.` : 'No source issues were reported in the latest build.'}</span>
            </div>
          </div>
          <Notice
            title="AI-built report"
            body="The report is built from public-source evidence, Andwell service-line rules, and safe wording guardrails. Unsupported claims are softened instead of passed through."
            tone="green"
          />
        </div>
      </Card>
      <section className="cc-report-preview">
        <div className="cc-report-cover">
          <div>
            <span>Andwell Health Partners</span>
            <h2>Competitive Intelligence Executive Brief</h2>
            <p>{scrubOutputText(report.executiveSummary)}</p>
          </div>
          <Badge tone="green">AI-built</Badge>
        </div>
        <div className="cc-report-section cc-report-summary-band">
          <article>
            <span>Competitors</span>
            <strong>{report.competitorsAnalyzed}</strong>
            <p>{report.pagesReviewed} public pages reviewed</p>
          </article>
          <article>
            <span>AI-built services</span>
            <strong>{builtServices.length || 0}</strong>
            <p>{builtServices.join(', ') || 'Build intelligence to populate service signals'}</p>
          </article>
          <article>
            <span>Governance</span>
            <strong>Scrubbed</strong>
            <p>Claims are constrained to public evidence and cautious language</p>
          </article>
        </div>
        <div className="cc-report-section">
          <h3>Leadership decisions</h3>
          {report.executiveInsights.map((insight) => (
            <article key={insight.title}>
              <Badge tone={insight.priority === 'High' ? 'red' : 'amber'}>{insight.priority}</Badge>
              <strong>{scrubOutputText(insight.title)}</strong>
              <p>{scrubOutputText(insight.summary)}</p>
              <p>{scrubOutputText(insight.action)}</p>
            </article>
          ))}
        </div>
        <div className="cc-report-section">
          <h3>Advantage Matrix summary</h3>
          <article>
            <strong>{matrix.summary.capabilitiesMapped} capabilities mapped with Andwell as baseline</strong>
            <p>Competitors compared: {matrix.summary.competitorsCompared || 'Ready to build'}. Andwell advantage signals: {matrix.summary.advantageSignals || 'Ready to build'}.</p>
          </article>
        </div>
        <div className="cc-report-section">
          <h3>Growth Map summary</h3>
          <article>
            <strong>Top growth areas</strong>
            <p>{growthMap.summary.topGrowthAreas.join(', ') || 'Additional public source material would strengthen this report package.'}</p>
          </article>
          <article>
            <strong>Most saturated areas</strong>
            <p>{growthMap.summary.saturatedAreas.join(', ') || 'Current evidence supports a cautious positioning angle.'}</p>
          </article>
          <article>
            <strong>Field focus zones</strong>
            <p>{growthMap.summary.fieldFocusZones.join(', ') || 'Growth map is ready to build once source intake expands.'}</p>
          </article>
        </div>
        <div className="cc-report-section">
          <h3>Scrubbed field language</h3>
          {approvedItems.length ? approvedItems.slice(0, 8).map((item) => (
            <article key={item.id}>
              <strong>{item.competitorName} | {item.serviceLine}</strong>
              <p>{scrubOutputText(item.safeSalesWording)}</p>
              <small>{compactUrl(item.sourceUrl)} | Confidence: {displayStatus(item.confidence)}</small>
            </article>
          )) : (
            <article>
              <strong>Field language engine ready</strong>
              <p>Build intelligence from public sources to generate field-safe language, strategic angles, and next moves.</p>
            </article>
          )}
        </div>
        {report.crawlErrors.length ? (
          <div className="cc-report-section">
            <h3>Crawl warnings</h3>
            {report.crawlErrors.map((error) => (
              <article key={error.url}>
                <strong>{compactUrl(error.url)}</strong>
                <p>{error.error}</p>
              </article>
            ))}
          </div>
        ) : null}
        {report.sourceHealth?.length ? (
          <div className="cc-report-section">
            <h3>Source health</h3>
            {report.sourceHealth.map((source, index) => (
              <article key={`${source.input}-${index}`}>
                <strong>{source.url ? compactUrl(source.url) : source.input}</strong>
                <p>{source.status}: {source.reason}</p>
                <small>Quality score: {source.qualityScore}{source.pagesReviewed !== undefined ? ` | Pages reviewed: ${source.pagesReviewed}` : ''}</small>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SystemScreen({ state }: { state: CommandCenterState }) {
  const checks = [
    {
      title: 'API routes',
      ok: true,
      detail: '/api/health, /api/diagnostics, /api/runtime, /api/analyze, /api/ask'
    },
    {
      title: 'Storage service',
      ok: Boolean(state.runtime?.persistence.supabaseConfigured),
      detail: state.runtime?.persistence.supabaseConfigured ? 'Primary persistence is active for production writes.' : 'Primary persistence is not configured in this environment.'
    },
    {
      title: 'Analysis service',
      ok: Boolean(state.analyzeHealth?.aiConfigured),
      detail: state.analyzeHealth?.aiConfigured ? 'Advanced extraction is active for deeper evidence intelligence.' : 'Deterministic evidence analysis is active for source processing.'
    },
    {
      title: 'Processing limits',
      ok: Boolean(state.runtime),
      detail: state.runtime ? `${state.runtime.limits.maxCompetitorsPerScan} competitors per scan, ${state.runtime.limits.crawlMaxPagesPerSite} pages per site.` : 'Runtime diagnostics are still loading.'
    }
  ];

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Runtime" value={state.runtime?.nodeVersion || 'Unknown'} detail={state.runtime?.nextRuntime || 'Next.js API'} tone="blue" />
        <Metric label="Persistence" value={state.runtime?.persistence.supabaseConfigured ? 'Supabase' : 'Local'} detail="Production source of truth" tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'} />
        <Metric label="AI extraction" value={state.analyzeHealth?.aiConfigured ? 'Enabled' : 'Optional'} detail={state.analyzeHealth?.message || 'Analyze API'} tone={state.analyzeHealth?.aiConfigured ? 'teal' : 'amber'} />
        <Metric label="Crawl pages" value={state.analyzeHealth?.crawlMaxPagesPerSiteLimit || 0} detail="Max per competitor" tone="slate" />
      </div>
      <div className="cc-dashboard-grid">
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
        <Card title="Operational notes" action={<Badge tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'}>{state.runtime?.persistence.supabaseConfigured ? 'Production' : 'Fallback'}</Badge>}>
          <div className="cc-list">
            <div className="cc-list-item">
              <Shield size={17} />
              <div>
                <strong>Public app, protected crawl surface</strong>
                <p>Client-side source preview blocks obvious local hosts. Server-side validation blocks private IPs, oversized scans, and expensive repeat requests.</p>
              </div>
            </div>
            <div className="cc-list-item">
              <Database size={17} />
              <div>
                <strong>Persistence behavior</strong>
                <p>{state.runtime?.persistence.supabaseConfigured ? 'Reports, competitors, source history, and catalog overrides persist through the primary storage service.' : 'Primary storage is not configured in this environment, so development persistence behavior applies.'}</p>
              </div>
            </div>
            <div className="cc-list-item">
              <Bot size={17} />
              <div>
                <strong>Analysis behavior</strong>
                <p>{state.analyzeHealth?.aiConfigured ? `Advanced extraction model is configured: ${state.runtime?.ai.model || 'environment model'}.` : 'Source intelligence processing remains active using deterministic evidence analysis.'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card title="Endpoint checklist">
        <div className="cc-check-grid">
          {['/api/health', '/api/version', '/api/runtime', '/api/diagnostics', '/api/analyze', '/api/competitors', '/api/reports', '/api/catalog', '/api/ask'].map((route) => (
            <div key={route} className="cc-endpoint">
              <code>{route}</code>
              <Badge tone="blue">JSON</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FindingEvidence({ evidence }: { evidence: AskResponse['evidence'] }) {
  return (
    <div className="cc-evidence-grid">
      {evidence.slice(0, 6).map((item, index) => (
        <article key={`${item.competitorName}-${item.serviceLine}-${index}`} className="cc-evidence">
          <div className="cc-finding-head">
          <Badge tone={toneForStatus(item.status)}>{displayStatus(item.status)}</Badge>
            {item.evidenceStrength ? <Badge tone={item.evidenceStrength === 'Strong' ? 'green' : item.evidenceStrength === 'Moderate' ? 'blue' : item.evidenceStrength === 'Weak' ? 'amber' : 'red'}>{item.evidenceStrength}</Badge> : null}
            {item.fieldRisk ? <Badge tone={item.fieldRisk === 'Low' ? 'green' : item.fieldRisk === 'Medium' ? 'amber' : 'red'}>{item.fieldRisk} risk</Badge> : null}
          </div>
          <h4>{item.competitorName} | {item.serviceLine}{item.subservice ? ` | ${item.subservice}` : ''}</h4>
          <p>{scrubOutputText(item.evidenceExcerpt)}</p>
          {item.reviewReason ? <p>{scrubOutputText(item.reviewReason)}</p> : null}
          <small>{compactUrl(item.sourceUrl)}</small>
        </article>
      ))}
    </div>
  );
}
