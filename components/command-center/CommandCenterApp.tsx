'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  Library,
  Menu,
  PanelLeftClose,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react';
import type { CompetitorInput, Finding, IntelligenceReport, ReviewStatus, SubserviceFinding } from '../../lib/types';
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
  runAnalysis,
  saveReview
} from './api';
import type { AskResponse, CommandCenterState, ReportSummary, ReviewableFinding, TabId } from './model';
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
  { id: 'dashboard', label: 'Dashboard', help: 'Workspace pulse', icon: Gauge },
  { id: 'sources', label: 'Sources', help: 'Run intelligence scan', icon: UploadCloud },
  { id: 'review', label: 'Review', help: 'Approve findings', icon: ClipboardCheck },
  { id: 'library', label: 'Intelligence Library', help: 'Approved evidence', icon: Library },
  { id: 'strategy', label: 'Strategy', help: 'Market plays', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', help: 'Ask evidence questions', icon: Bot },
  { id: 'report', label: 'Executive Report', help: 'Board-ready output', icon: FileText },
  { id: 'system', label: 'System Health', help: 'Hostinger checks', icon: Activity }
];

function parseSourceInput(value: string): CompetitorInput[] {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 25)
    .map((url) => ({ url }));
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

function isApproved(status: ReviewStatus | 'Needs edits') {
  return status === 'Approved for sales use' || status === 'Sales usable with evidence';
}

function isOpenReview(status: ReviewStatus | 'Needs edits') {
  return !isApproved(status) && status !== 'Rejected';
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

function currentNextAction({
  hasReport,
  openReviewCount,
  approvedCount,
  aiConfigured
}: {
  hasReport: boolean;
  openReviewCount: number;
  approvedCount: number;
  aiConfigured: boolean;
}) {
  if (!hasReport) return 'Run the first intelligence scan so the workspace has real evidence.';
  if (openReviewCount) return `Review ${openReviewCount} finding${openReviewCount === 1 ? '' : 's'} before leadership output.`;
  if (!approvedCount) return 'Approve at least one evidence-backed finding to unlock strategy and coaching.';
  if (!aiConfigured) return 'AI enrichment is off. Add OPENAI_API_KEY when you want deeper extraction.';
  return 'Workspace is ready for strategy, coaching, and executive report use.';
}

export default function CommandCenterApp() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [state, setState] = useState<CommandCenterState>(initialState);
  const [sourceText, setSourceText] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [reviewBusyId, setReviewBusyId] = useState('');
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
  const openReviewItems = useMemo(() => reviewableItems.filter((item) => isOpenReview(item.effectiveReviewStatus)), [reviewableItems]);
  const approvedItems = useMemo(() => reviewableItems.filter((item) => isApproved(item.effectiveReviewStatus)), [reviewableItems]);
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
    openReviewCount: openReviewItems.length,
    approvedCount: approvedItems.length,
    aiConfigured: Boolean(state.analyzeHealth?.aiConfigured)
  });

  async function handleScan() {
    const competitors = parseSourceInput(sourceText);
    if (!competitors.length) {
      setScanMessage('Add at least one public competitor URL before running a scan.');
      return;
    }

    setScanBusy(true);
    setScanMessage('Scanning public pages, mapping service evidence, and building review items.');
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
      setScanMessage(`Scan complete. ${report.competitorsAnalyzed} competitor${report.competitorsAnalyzed === 1 ? '' : 's'} analyzed and ${report.humanReviewItems} review items created.`);
      setActiveTab('review');
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : 'The scan could not be completed.');
    } finally {
      setScanBusy(false);
    }
  }

  async function handleReview(item: ReviewableFinding, status: ReviewStatus | 'Needs edits') {
    setReviewBusyId(item.id);
    try {
      const { review } = await saveReview({
        findingId: item.id,
        status,
        note: status === 'Approved for sales use' ? 'Approved from command center review.' : 'Marked from command center review.',
        reviewer: 'Public workspace'
      });
      setState((current) => ({
        ...current,
        reviews: [review, ...current.reviews.filter((saved) => saved.findingId !== review.findingId)]
      }));
    } finally {
      setReviewBusyId('');
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
        confidence: 'Needs review',
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
        openReviewCount={openReviewItems.length}
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

        {state.status === 'loading' ? <LoadingState title="Loading command center" body="Reading reports, reviews, catalog, and runtime status." /> : null}
        {state.status === 'error' ? (
          <Notice title="Workspace needs attention" body={state.error} tone="red" />
        ) : null}

        {activeTab === 'dashboard' ? (
          <Dashboard
            state={state}
            openReviewItems={openReviewItems}
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
        {activeTab === 'review' ? (
          <ReviewScreen items={openReviewItems} busyId={reviewBusyId} onReview={(item, status) => void handleReview(item, status)} onSources={() => changeTab('sources')} />
        ) : null}
        {activeTab === 'library' ? (
          <LibraryScreen
            approvedItems={filteredApproved}
            allApprovedCount={approvedItems.length}
            search={search}
            setSearch={setSearch}
            competitors={state.competitors}
            onDelete={(url) => void handleDeleteCompetitor(url)}
            onReview={() => changeTab('review')}
          />
        ) : null}
        {activeTab === 'strategy' ? <StrategyScreen report={state.currentReport} approvedCount={approvedItems.length} onReview={() => changeTab('review')} /> : null}
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
        {activeTab === 'report' ? <ReportScreen report={state.currentReport} approvedItems={approvedItems} openReviewCount={openReviewItems.length} /> : null}
        {activeTab === 'system' ? <SystemScreen state={state} /> : null}
      </main>
    </div>
  );
}

function Sidebar({
  activeTab,
  mobileOpen,
  reportCount,
  openReviewCount,
  approvedCount,
  onChange,
  onClose
}: {
  activeTab: TabId;
  mobileOpen: boolean;
  reportCount: number;
  openReviewCount: number;
  approvedCount: number;
  onChange: (tab: TabId) => void;
  onClose: () => void;
}) {
  const complete = [
    reportCount > 0,
    openReviewCount === 0 && reportCount > 0,
    approvedCount > 0,
    approvedCount > 0
  ].filter(Boolean).length;
  const progress = Math.round((complete / 4) * 100);

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
            <span>Workflow readiness</span>
            <strong>{progress}%</strong>
          </div>
          <Progress value={progress} tone={progress >= 75 ? 'green' : progress >= 40 ? 'amber' : 'blue'} />
          <p>{reportCount ? `${openReviewCount} open reviews, ${approvedCount} approved findings` : 'Run a scan to start the workspace.'}</p>
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
  openReviewItems,
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
  openReviewItems: ReviewableFinding[];
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

  return (
    <div className="cc-stack">
      <section className="cc-hero-panel">
        <div>
          <h2>Real-time competitive intelligence for source-to-strategy decisions.</h2>
          <p>{nextAction}</p>
          <div className="cc-action-row">
            <Button variant="primary" onClick={() => onTab('sources')}><UploadCloud size={16} /> Run Scan</Button>
            <Button onClick={() => onTab('review')}><ClipboardCheck size={16} /> Review Findings</Button>
            <Button onClick={() => onTab('coach')}><Sparkles size={16} /> Ask AI Coach</Button>
          </div>
        </div>
        <div className="cc-status-panel">
          <Badge tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'}>
            {state.runtime?.persistence.supabaseConfigured ? 'Supabase live' : 'Local fallback'}
          </Badge>
          <strong>{report ? formatDate(report.generatedAt) : 'No scan yet'}</strong>
          <span>{report ? `${report.competitorsAnalyzed} competitors, ${report.pagesReviewed} pages reviewed` : 'Upload public competitor URLs to begin.'}</span>
        </div>
      </section>

      <div className="cc-metric-grid">
        <Metric label="Recent scans" value={state.reports.length} detail="Stored reports" tone="blue" />
        <Metric label="Open review" value={openReviewItems.length} detail="Need a decision" tone={openReviewItems.length ? 'amber' : 'green'} />
        <Metric label="Approved evidence" value={approvedItems.length} detail="Ready for strategy" tone="green" />
        <Metric label="AI status" value={state.analyzeHealth?.aiConfigured ? 'On' : 'Off'} detail={state.analyzeHealth?.aiConfigured ? 'OpenAI extraction enabled' : 'Rule-based scan available'} tone={state.analyzeHealth?.aiConfigured ? 'teal' : 'amber'} />
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Quick-start intelligence scan" action={<Badge tone="blue">Public websites</Badge>}>
          <textarea className="cc-textarea compact" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste competitor URLs, one per line." />
          <div className="cc-action-row">
            <Button variant="primary" disabled={scanBusy} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Brain size={16} />} {scanBusy ? 'Scanning' : 'Run Intelligence Scan'}
            </Button>
          </div>
          {scanMessage ? <p className="cc-helper">{scanMessage}</p> : null}
        </Card>

        <Card title="Recent scans">
          {state.reports.length ? <ReportList reports={state.reports.slice(0, 5)} /> : (
            <EmptyState title="No reports yet" body="Run a scan to create the first stored intelligence report." action={<Button onClick={() => onTab('sources')}>Go to Sources</Button>} />
          )}
        </Card>
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Open review queue" action={<Button variant="ghost" onClick={() => onTab('review')}>Open Review</Button>}>
          {openReviewItems.length ? <FindingList items={openReviewItems.slice(0, 5)} /> : <Notice title="Review queue clear" body="No open review items are waiting in the latest report." tone="green" />}
        </Card>
        <Card title="Executive signals">
          {report?.executiveInsights?.length ? (
            <div className="cc-list">
              {report.executiveInsights.slice(0, 4).map((insight) => (
                <div key={insight.title} className="cc-list-item">
                  <Badge tone={insight.priority === 'High' ? 'red' : 'amber'}>{insight.priority}</Badge>
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.action}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No executive signals" body="Signals appear after the first competitor scan is complete." />
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

  return (
    <div className="cc-stack">
      <div className="cc-two-col">
        <Card title="Run a real intelligence scan" eyebrow="Source intake">
          <label className="cc-label" htmlFor="source-text">Competitor websites</label>
          <textarea id="source-text" className="cc-textarea" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="https://competitor.org/services&#10;https://another-provider.org/home-health" />
          <div className="cc-action-row">
            <Button variant="primary" disabled={scanBusy || !parsed.length} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <UploadCloud size={16} />} {scanBusy ? 'Scanning public pages' : 'Run Intelligence Scan'}
            </Button>
            <Button onClick={() => setSourceText('')}>Clear</Button>
          </div>
          {scanMessage ? <Notice title={scanBusy ? 'Scan running' : 'Scan status'} body={scanMessage} tone={scanBusy ? 'blue' : 'amber'} /> : null}
        </Card>

        <Card title="What the scan creates">
          <div className="cc-step-list">
            {['Crawls public pages', 'Maps Andwell service lines', 'Scores confidence and risk', 'Creates review queue', 'Feeds strategy, AI coach, and report'].map((item, index) => (
              <div key={item} className="cc-step">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <Notice
            title={state.analyzeHealth?.aiConfigured ? 'AI enrichment is enabled' : 'AI enrichment is optional'}
            body={state.analyzeHealth?.aiConfigured ? 'OpenAI extraction will add deeper summaries, safe language, and battlecard guidance.' : 'The app will still run rule-based public evidence analysis. Add OPENAI_API_KEY to enable deeper AI extraction.'}
            tone={state.analyzeHealth?.aiConfigured ? 'green' : 'amber'}
          />
        </Card>
      </div>
      <Card title="Queued sources" action={<Badge tone={parsed.length ? 'blue' : 'slate'}>{parsed.length} ready</Badge>}>
        {parsed.length ? (
          <div className="cc-source-grid">
            {parsed.map((competitor) => (
              <div key={competitor.url} className="cc-source-card">
                <Database size={18} />
                <strong>{compactUrl(competitor.url)}</strong>
                <span>Will be validated server-side before crawl.</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No sources queued" body="Paste up to 25 public competitor websites. Private IPs, localhost, and internal hostnames are blocked." />
        )}
      </Card>
    </div>
  );
}

function ReviewScreen({
  items,
  busyId,
  onReview,
  onSources
}: {
  items: ReviewableFinding[];
  busyId: string;
  onReview: (item: ReviewableFinding, status: ReviewStatus | 'Needs edits') => void;
  onSources: () => void;
}) {
  if (!items.length) {
    return <EmptyState title="No findings need review" body="Run a scan or approve new findings to keep the intelligence library current." action={<Button onClick={onSources}>Upload Sources</Button>} />;
  }

  return (
    <div className="cc-review-grid">
      {items.slice(0, 60).map((item) => (
        <Card key={item.id} className="cc-review-card">
          <div className="cc-finding-head">
            <Badge tone={item.kind === 'service' ? 'blue' : 'teal'}>{item.kind}</Badge>
            <Badge tone={toneForStatus(item.effectiveReviewStatus)}>{item.effectiveReviewStatus}</Badge>
          </div>
          <h3>{item.serviceLine}{'subservice' in item ? `: ${item.subservice}` : ''}</h3>
          <p className="cc-muted">{item.competitorName} | {compactUrl(item.sourceUrl)}</p>
          <blockquote>{item.evidenceExcerpt}</blockquote>
          <div className="cc-guidance">
            <strong>Suggested safe wording</strong>
            <p>{item.safeSalesWording}</p>
            {'avoidSaying' in item && item.avoidSaying ? <small>{item.avoidSaying}</small> : null}
          </div>
          <div className="cc-action-row">
            <Button variant="primary" disabled={busyId === item.id} onClick={() => onReview(item, 'Approved for sales use')}>Approve</Button>
            <Button disabled={busyId === item.id} onClick={() => onReview(item, 'Needs edits')}>Needs Edits</Button>
            <Button variant="danger" disabled={busyId === item.id} onClick={() => onReview(item, 'Rejected')}>Reject</Button>
          </div>
        </Card>
      ))}
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
  onReview
}: {
  approvedItems: ReviewableFinding[];
  allApprovedCount: number;
  search: string;
  setSearch: (value: string) => void;
  competitors: CompetitorInput[];
  onDelete: (url: string) => void;
  onReview: () => void;
}) {
  return (
    <div className="cc-stack">
      <Card title="Approved intelligence" action={<Badge tone="green">{allApprovedCount} approved</Badge>}>
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
                  <th>Safe wording</th>
                </tr>
              </thead>
              <tbody>
                {approvedItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.competitorName}</td>
                    <td><strong>{item.serviceLine}</strong>{'subservice' in item ? <span>{item.subservice}</span> : null}</td>
                    <td><Badge tone={toneForStatus(item.competitorStatus)}>{item.competitorStatus}</Badge></td>
                    <td>{item.confidence}</td>
                    <td>{item.safeSalesWording}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No approved intelligence yet" body="Approve evidence-backed findings from the review queue to build the trusted library." action={<Button onClick={onReview}>Open Review</Button>} />
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

function StrategyScreen({ report, approvedCount, onReview }: { report: IntelligenceReport | null; approvedCount: number; onReview: () => void }) {
  if (!report || !approvedCount) {
    return <EmptyState title="Strategy needs approved intelligence" body="Run a scan and approve findings before using market strategy outputs." action={<Button onClick={onReview}>Open Review</Button>} />;
  }

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Competitors" value={report.competitorsAnalyzed} detail="Analyzed in latest report" tone="blue" />
        <Metric label="Pages reviewed" value={number(report.pagesReviewed)} detail="Public evidence pages" tone="teal" />
        <Metric label="Matched services" value={report.matchedServiceFindings} detail="Clearly offered by competitors" tone="green" />
        <Metric label="Review risk" value={report.humanReviewItems} detail="Findings needing governance" tone="amber" />
      </div>
      <Card title="Executive strategy signals">
        <div className="cc-list">
          {report.executiveInsights.map((insight) => (
            <div key={insight.title} className="cc-list-item">
              <Badge tone={insight.priority === 'High' ? 'red' : 'amber'}>{insight.priority}</Badge>
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.summary}</p>
                <small>{insight.action}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Competitor posture">
        <div className="cc-source-grid">
          {report.competitorScores.map((score) => (
            <div key={score.competitorId} className="cc-score-card">
              <Badge tone={score.threatLevel === 'Strategic threat' ? 'red' : 'amber'}>{score.threatLevel}</Badge>
              <h3>{score.competitorName}</h3>
              <Progress value={score.serviceLineMatchScore} tone="blue" />
              <p>{score.executiveReadout}</p>
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
  return (
    <div className="cc-stack">
      <Card title="AI Intelligence Coach" action={<Badge tone={report ? 'green' : 'amber'}>{report ? 'Report loaded' : 'Needs scan'}</Badge>}>
        <textarea className="cc-textarea compact" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question like: What should a rep say when MaineHealth comes up in a hospice referral conversation?" />
        <div className="cc-action-row">
          <Button variant="primary" disabled={askBusy || !question.trim()} onClick={onAsk}>
            {askBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Bot size={16} />} Ask AI Coach
          </Button>
        </div>
        <Notice title="Evidence-only answers" body="The coach answers from stored reports and returns confidence, cited evidence, safe wording, and next moves." tone="blue" />
      </Card>
      {askResponse ? (
        <Card title="Coach answer" action={<Badge tone={toneForStatus(askResponse.confidence)}>{askResponse.confidence}</Badge>}>
          <p className="cc-answer">{askResponse.answer}</p>
          {askResponse.nextBestActions.length ? (
            <div className="cc-list">
              {askResponse.nextBestActions.slice(0, 4).map((action) => (
                <div className="cc-list-item" key={action}>
                  <Sparkles size={17} />
                  <p>{action}</p>
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

function ReportScreen({ report, approvedItems, openReviewCount }: { report: IntelligenceReport | null; approvedItems: ReviewableFinding[]; openReviewCount: number }) {
  if (!report) return <EmptyState title="No executive report yet" body="Run a scan to generate a board-ready report preview." />;
  const ready = approvedItems.length > 0 && openReviewCount === 0;

  return (
    <div className="cc-stack">
      <Card
        title="Executive report readiness"
        action={<Button variant="primary" onClick={() => window.print()}><FileText size={16} /> Print Report</Button>}
      >
        <div className="cc-metric-grid">
          <Metric label="Report status" value={ready ? 'Ready' : 'Blocked'} detail={ready ? 'No blockers open' : `${openReviewCount} reviews remain`} tone={ready ? 'green' : 'amber'} />
          <Metric label="Approved evidence" value={approvedItems.length} detail="Can be used in report" tone="green" />
          <Metric label="Human review" value={openReviewCount} detail="Must be resolved" tone={openReviewCount ? 'red' : 'green'} />
          <Metric label="Generated" value={formatDate(report.generatedAt)} detail="Latest report" tone="blue" />
        </div>
      </Card>
      <section className="cc-report-preview">
        <div className="cc-report-cover">
          <div>
            <span>Andwell Health Partners</span>
            <h2>Competitive Intelligence Executive Brief</h2>
            <p>{report.executiveSummary}</p>
          </div>
          <Badge tone={ready ? 'green' : 'amber'}>{ready ? 'Leadership ready' : 'Review blockers'}</Badge>
        </div>
        <div className="cc-report-section">
          <h3>Leadership decisions</h3>
          {report.executiveInsights.map((insight) => (
            <article key={insight.title}>
              <strong>{insight.title}</strong>
              <p>{insight.action}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SystemScreen({ state }: { state: CommandCenterState }) {
  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Runtime" value={state.runtime?.nodeVersion || 'Unknown'} detail={state.runtime?.nextRuntime || 'Next.js API'} tone="blue" />
        <Metric label="Persistence" value={state.runtime?.persistence.supabaseConfigured ? 'Supabase' : 'Local'} detail="Production source of truth" tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'} />
        <Metric label="AI extraction" value={state.analyzeHealth?.aiConfigured ? 'Enabled' : 'Optional'} detail={state.analyzeHealth?.message || 'Analyze API'} tone={state.analyzeHealth?.aiConfigured ? 'teal' : 'amber'} />
        <Metric label="Crawl pages" value={state.analyzeHealth?.crawlMaxPagesPerSiteLimit || 0} detail="Max per competitor" tone="slate" />
      </div>
      <Card title="Production checks">
        <div className="cc-check-grid">
          {[
            ['API routes', true, '/api/health, /api/diagnostics, /api/runtime'],
            ['Supabase server-side only', Boolean(state.runtime?.persistence.supabaseConfigured), 'Service role key stays behind API routes'],
            ['OpenAI optional', Boolean(state.analyzeHealth), state.analyzeHealth?.message || 'Analyze endpoint reachable'],
            ['Local fallback', true, 'JSON fallback available for development']
          ].map(([title, ok, detail]) => (
            <div key={String(title)} className="cc-check">
              {ok ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReportList({ reports }: { reports: ReportSummary[] }) {
  return (
    <div className="cc-list">
      {reports.map((report) => (
        <div key={report.id} className="cc-list-item">
          <Badge tone="blue">{formatDate(report.generatedAt)}</Badge>
          <div>
            <strong>{report.competitors.join(', ') || 'Stored report'}</strong>
            <p>{report.competitorsAnalyzed} competitors, {report.pagesReviewed} pages, {report.humanReviewItems} review items</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FindingList({ items }: { items: ReviewableFinding[] }) {
  return (
    <div className="cc-list">
      {items.map((item) => (
        <div key={item.id} className="cc-list-item">
          <Badge tone={toneForStatus(item.effectiveReviewStatus)}>{item.effectiveReviewStatus}</Badge>
          <div>
            <strong>{item.competitorName} | {item.serviceLine}</strong>
            <p>{item.safeSalesWording}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FindingEvidence({ evidence }: { evidence: AskResponse['evidence'] }) {
  return (
    <div className="cc-evidence-grid">
      {evidence.slice(0, 6).map((item, index) => (
        <article key={`${item.competitorName}-${item.serviceLine}-${index}`} className="cc-evidence">
          <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
          <h4>{item.competitorName} | {item.serviceLine}{item.subservice ? ` | ${item.subservice}` : ''}</h4>
          <p>{item.evidenceExcerpt}</p>
          <small>{compactUrl(item.sourceUrl)}</small>
        </article>
      ))}
    </div>
  );
}
