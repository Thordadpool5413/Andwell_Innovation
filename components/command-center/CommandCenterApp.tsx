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
import type { CompetitorInput, Finding, IntelligenceReport, ReviewStatus, SubserviceFinding } from '../../lib/types';
import { validatePublicHttpUrl } from '../../lib/url-safety';
import type { StoredReview } from '../../lib/store';
import {
  askHub,
  deleteCompetitor,
  fetchAnalyzeHealth,
  fetchCatalog,
  fetchCompetitors,
  fetchReport,
  fetchReports,
  fetchReviews,
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
  { id: 'dashboard', label: 'Home', help: 'What, why, how', icon: Gauge },
  { id: 'sources', label: 'Build Intelligence', help: 'Enter sources', icon: UploadCloud },
  { id: 'library', label: 'Intelligence Library', help: 'AI-built outputs', icon: Library },
  { id: 'strategy', label: 'Strategy', help: 'Growth plays', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', help: 'Ask the system', icon: Bot },
  { id: 'report', label: 'Executive Report', help: 'Leadership output', icon: FileText },
  { id: 'system', label: 'System Health', help: 'Hostinger checks', icon: Activity }
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

function reviewKey(item: Finding | SubserviceFinding) {
  return item.id;
}

function savedReviewFor(item: Finding | SubserviceFinding, reviews: StoredReview[]) {
  return reviews.find((review) => review.findingId === reviewKey(item));
}

function effectiveStatus(item: Finding | SubserviceFinding, reviews: StoredReview[]): ReviewStatus | 'Needs edits' {
  return savedReviewFor(item, reviews)?.status || item.reviewStatus;
}

function toReviewable(report: IntelligenceReport | null, reviews: StoredReview[]): ReviewableFinding[] {
  if (!report) return [];
  const serviceItems: ReviewableFinding[] = report.allFindings.map((item) => ({
    ...item,
    kind: 'service',
    savedReview: savedReviewFor(item, reviews),
    effectiveReviewStatus: effectiveStatus(item, reviews)
  }));
  const subserviceItems: ReviewableFinding[] = report.allSubserviceFindings.map((item) => ({
    ...item,
    kind: 'subservice',
    savedReview: savedReviewFor(item, reviews),
    effectiveReviewStatus: effectiveStatus(item, reviews)
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
  return (value || '')
    .replace(/Review before sales use/g, 'Guarded language required')
    .replace(/Review Center/g, 'AI safe-language engine')
    .replace(/review queue/gi, 'AI build')
    .replace(/review items/gi, 'guarded items')
    .replace(/review item/gi, 'guarded item')
    .replace(/human review/gi, 'AI guardrails')
    .replace(/manager review/gi, 'AI guardrails')
    .replace(/approved intelligence/gi, 'AI-built intelligence')
    .replace(/approved evidence/gi, 'source evidence')
    .replace(/approved source/gi, 'reliable source')
    .replace(/approved findings/gi, 'scrubbed findings')
    .replace(/approved finding/gi, 'scrubbed finding')
    .replace(/approved language/gi, 'scrubbed language')
    .replace(/approve findings/gi, 'let the AI scrub findings')
    .replace(/approve relevant findings/gi, 'build source-backed findings')
    .replace(/approve strong evidence/gi, 'build from strong evidence')
    .replace(/Review this competitor first/g, 'Start here for leadership focus')
    .replace(/Needs review/g, 'Evidence limited');
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
  if (!hasReport) return 'Enter sources and let the AI review, scrub, connect, and build the intelligence outputs.';
  if (!aiConfigured) return 'AI enrichment is off, so the app is using its evidence rules and public-source intelligence engine.';
  return 'The AI has built the strategy, coaching, intelligence library, and executive report from the latest sources.';
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
      const [reportsPayload, competitorsPayload, reviewsPayload, catalogPayload, analyzePayload, runtimePayload] = await Promise.all([
        fetchReports(),
        fetchCompetitors(),
        fetchReviews(),
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
        reviews: reviewsPayload.reviews,
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

  const reviewableItems = useMemo(() => toReviewable(state.currentReport, state.reviews), [state.currentReport, state.reviews]);
  const approvedItems = useMemo(() => reviewableItems.filter((item) => item.effectiveReviewStatus !== 'Rejected' && item.recommendedReviewAction !== 'Reject'), [reviewableItems]);
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
      const [reportsPayload, competitorsPayload, reviewsPayload] = await Promise.all([
        fetchReports(),
        fetchCompetitors(),
        fetchReviews()
      ]);
      setState((current) => ({
        ...current,
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport: report,
        reviews: reviewsPayload.reviews
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
        confidence: 'AI unavailable',
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
            <Badge tone={state.analyzeHealth?.aiConfigured ? 'green' : 'amber'}>
              {state.analyzeHealth?.aiConfigured ? 'AI enriched' : 'AI optional'}
            </Badge>
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
        {activeTab === 'strategy' ? <StrategyScreen report={state.currentReport} onBuild={() => changeTab('sources')} /> : null}
        {activeTab === 'coach' ? (
          <CoachScreen
            report={state.currentReport}
            question={question}
            setQuestion={setQuestion}
            askBusy={askBusy}
            askResponse={askResponse}
            onAsk={() => void handleAsk()}
          />
        ) : null}
        {activeTab === 'report' ? <ReportScreen report={state.currentReport} approvedItems={approvedItems} /> : null}
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
            <span>AI build mode</span>
            <strong>{reportCount ? 'Active' : 'Ready'}</strong>
          </div>
          <p>{reportCount ? `${approvedCount} scrubbed intelligence item${approvedCount === 1 ? '' : 's'} available.` : 'Enter sources and the AI will review, scrub, connect, and build the outputs.'}</p>
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
  onTab
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
            <Button variant="primary" onClick={() => onTab('sources')}><UploadCloud size={16} /> Build Intelligence</Button>
            <Button onClick={() => onTab('strategy')}><BarChart3 size={16} /> View Strategy</Button>
            <Button onClick={() => onTab('report')}><FileText size={16} /> Executive Report</Button>
          </div>
        </div>
        <div className="cc-status-panel">
          <Badge tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'}>
            {state.runtime?.persistence.supabaseConfigured ? 'Supabase live' : 'Local fallback'}
          </Badge>
          <strong>{report ? 'AI build complete' : 'AI builder ready'}</strong>
          <span>
            {report ? (
              <>
                Last build {formatDate(report.generatedAt)}
                <br />
                {pagesReviewed} pages reviewed across {sourceCount || report.competitorsAnalyzed} source{sourceCount === 1 ? '' : 's'}
              </>
            ) : 'Enter public competitor sources and the AI will review, scrub, connect, and build the outputs.'}
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
        <Metric label="AI builds" value={state.reports.length} detail="Stored intelligence runs" tone="blue" />
        <Metric label="Sources" value={sourceCount || 0} detail={report ? 'Public sources processed' : 'Stored competitors'} tone="teal" />
        <Metric label="Scrubbed outputs" value={approvedItems.length} detail="AI-governed findings" tone={approvedItems.length ? 'green' : 'slate'} />
        <Metric label="AI status" value={state.analyzeHealth?.aiConfigured ? 'On' : 'Off'} detail={state.analyzeHealth?.aiConfigured ? 'OpenAI extraction enabled' : 'Rule-based scan available'} tone={state.analyzeHealth?.aiConfigured ? 'teal' : 'amber'} />
      </div>

      <div className="cc-dashboard-grid cc-dashboard-primary">
        <Card title="AI intelligence builder" eyebrow="Source to strategy" action={<Badge tone={report ? 'green' : 'blue'}>{report ? 'Built' : 'Start'}</Badge>}>
          <div className="cc-next-action">
            <Brain size={22} />
            <div>
              <strong>{nextAction}</strong>
              <p>{report ? 'Use the strategy, coach, library, and executive report built from the latest public evidence.' : 'Paste public competitor websites and let the AI handle the evidence review, claim scrubbing, service-line mapping, and output build.'}</p>
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
          <Notice title={state.analyzeHealth?.aiConfigured ? 'AI enrichment is active' : 'Evidence rules are active'} body={state.analyzeHealth?.aiConfigured ? 'The AI enriches the crawler output with summaries, field language, risk guardrails, and battlecard context.' : 'OpenAI enrichment is optional. The app still builds from crawler evidence and Andwell service-line rules.'} tone={state.analyzeHealth?.aiConfigured ? 'green' : 'amber'} />
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
            <EmptyState title="No intelligence built yet" body="Run the AI builder and the app will produce scrubbed intelligence, strategy, coaching, and executive report content." action={<Button onClick={() => onTab('sources')}>Build Intelligence</Button>} />
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
            title={state.analyzeHealth?.aiConfigured ? 'AI enrichment is enabled' : 'AI enrichment is optional'}
            body={state.analyzeHealth?.aiConfigured ? 'OpenAI extraction adds deeper summaries, safe language, risk guardrails, and battlecard guidance.' : 'The app still runs rule-based public evidence analysis. Add OPENAI_API_KEY to enable deeper AI extraction.'}
            tone={state.analyzeHealth?.aiConfigured ? 'green' : 'amber'}
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
          <EmptyState title="No sources queued" body="Paste up to 25 public competitor websites. Private IPs, localhost, and internal hostnames are blocked." />
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
          <EmptyState title="No AI-built intelligence yet" body="Enter public sources and let the AI review, scrub, connect, and build the trusted intelligence library." action={<Button onClick={onBuild}>Build Intelligence</Button>} />
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
          <EmptyState title="No stored competitors" body="Competitors appear here after a scan or source save." />
        )}
      </Card>
    </div>
  );
}

function StrategyScreen({ report, onBuild }: { report: IntelligenceReport | null; onBuild: () => void }) {
  if (!report) {
    return <EmptyState title="Strategy needs an AI build" body="Enter sources and let the AI build market strategy, field coaching, and executive outputs." action={<Button onClick={onBuild}>Build Intelligence</Button>} />;
  }

  const expertBrief = report.expertBrief;

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Competitors" value={report.competitorsAnalyzed} detail="Analyzed in latest report" tone="blue" />
        <Metric label="Pages reviewed" value={number(report.pagesReviewed)} detail="Public evidence pages" tone="teal" />
        <Metric label="Matched services" value={report.matchedServiceFindings} detail="Clearly offered by competitors" tone="green" />
        <Metric label="AI guardrails" value={report.humanReviewItems} detail="Claims using guarded language" tone="amber" />
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
              <span>AI guardrail</span>
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
    </div>
  );
}

function CoachScreen({
  report,
  question,
  setQuestion,
  askBusy,
  askResponse,
  onAsk
}: {
  report: IntelligenceReport | null;
  question: string;
  setQuestion: (value: string) => void;
  askBusy: boolean;
  askResponse: AskResponse | null;
  onAsk: () => void;
}) {
  const starters = [
    'What should the field team say safely?',
    'Where does Andwell appear strongest?',
    'What should leaders do next?'
  ];

  return (
    <div className="cc-stack">
      <Card title="AI Intelligence Coach" action={<Badge tone={report ? 'green' : 'amber'}>{report ? 'Report loaded' : 'Needs scan'}</Badge>}>
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
        <Notice title="Evidence-only answers" body={report ? 'Answers include confidence, cited evidence, safe wording, guardrails, and next moves.' : 'Build intelligence from competitor sources first so the coach has stored evidence to answer from.'} tone={report ? 'blue' : 'amber'} />
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

function ReportScreen({ report, approvedItems }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[] }) {
  if (!report) return <EmptyState title="No executive report yet" body="Build intelligence from public competitor sources to generate a leadership-ready report." />;
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
          <Metric label="Guardrails" value={report.humanReviewItems} detail="Claims kept cautious" tone="amber" />
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
          <h3>Scrubbed field language</h3>
          {approvedItems.length ? approvedItems.slice(0, 8).map((item) => (
            <article key={item.id}>
              <strong>{item.competitorName} | {item.serviceLine}</strong>
              <p>{scrubOutputText(item.safeSalesWording)}</p>
              <small>{compactUrl(item.sourceUrl)} | Confidence: {displayStatus(item.confidence)}</small>
            </article>
          )) : (
            <article>
              <strong>No scrubbed language yet</strong>
              <p>Build intelligence from public sources and the AI will generate guarded field language.</p>
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
      title: 'Supabase source of truth',
      ok: Boolean(state.runtime?.persistence.supabaseConfigured),
      detail: state.runtime?.persistence.supabaseConfigured ? 'Production writes are configured for Supabase.' : 'Local JSON fallback is active until Supabase variables are set.'
    },
    {
      title: 'OpenAI enrichment',
      ok: Boolean(state.analyzeHealth?.aiConfigured),
      detail: state.analyzeHealth?.aiConfigured ? 'AI extraction and coaching can enrich stored evidence.' : 'Rule-based analysis remains available without an API key.'
    },
    {
      title: 'Hosting safety limits',
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
        <Card title="Production checks" eyebrow="Hostinger deployment">
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
                <p>{state.runtime?.persistence.supabaseConfigured ? 'Reports, competitors, source history, and catalog overrides persist through Supabase.' : 'The app is usable for development, but Hostinger production should set Supabase URL and service role variables.'}</p>
              </div>
            </div>
            <div className="cc-list-item">
              <Bot size={17} />
              <div>
                <strong>AI behavior</strong>
                <p>{state.analyzeHealth?.aiConfigured ? `Configured model: ${state.runtime?.ai.model || 'OpenAI model from environment'}.` : 'AI enrichment is off, so the app explains that it is using crawler and rule-based intelligence.'}</p>
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
