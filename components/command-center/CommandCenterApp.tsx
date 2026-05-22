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
  CircleCheck,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileText,
  Flag,
  Gauge,
  Globe2,
  Library,
  ListChecks,
  Menu,
  PanelLeftClose,
  Play,
  RefreshCcw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud
} from 'lucide-react';
import type { CompetitorInput, Finding, IntelligenceReport, ReviewStatus, SubserviceFinding } from '../../lib/types';
import { calculateReportReadiness, calculateStoredReadiness, isApprovedReviewStatus, isOpenReviewStatus } from '../../lib/intelligence-policy';
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
  runAnalysis,
  saveReview
} from './api';
import type { AskResponse, CommandCenterState, ReportSummary, ReviewableFinding, SourcePreviewItem, TabId } from './model';
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

const workflowSteps = [
  { id: 'sources', label: 'Upload Sources', help: 'Add competitor URLs', icon: Globe2 },
  { id: 'scan', label: 'Run Intelligence Scan', help: 'Crawl public websites', icon: Play },
  { id: 'review', label: 'Review Findings', help: 'Triage evidence', icon: ListChecks },
  { id: 'approve', label: 'Approve Intelligence', help: 'Publish trusted insights', icon: Shield },
  { id: 'export', label: 'Use & Export', help: 'Strategy, coaching, report', icon: FileText }
] as const;

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

function isApproved(status: ReviewStatus | 'Needs edits') {
  return isApprovedReviewStatus(status);
}

function isOpenReview(status: ReviewStatus | 'Needs edits') {
  return isOpenReviewStatus(status);
}

function reviewPriorityScore(item: ReviewableFinding) {
  let score = item.kind === 'service' ? 18 : 8;
  if (item.sourceUrl) score += 12;
  if (item.confidence === 'High') score += 18;
  if (item.confidence === 'Moderate') score += 10;
  if (item.effectiveReviewStatus === 'Needs human review') score += 18;
  if (item.effectiveReviewStatus === 'Manager review suggested') score += 12;
  if (item.competitorStatus === 'Clearly offered') score += 16;
  if (item.competitorStatus === 'Not found publicly') score += 6;
  return score;
}

function priorityReviewItems(items: ReviewableFinding[]) {
  return [...items].sort((a, b) => reviewPriorityScore(b) - reviewPriorityScore(a));
}

function reportReadiness(reportCount: number, openReviewCount: number, approvedCount: number) {
  return calculateReportReadiness({
    hasReport: Boolean(reportCount),
    approvedEvidenceCount: approvedCount,
    openReviewCount,
    crawlWarningCount: 0,
    sourceIssueCount: 0
  }).score;
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

  const readiness = state.currentReport
    ? calculateStoredReadiness(state.currentReport, { approvedEvidenceCount: approvedItems.length, openReviewCount: openReviewItems.length })
    : calculateReportReadiness({
      hasReport: false,
      approvedEvidenceCount: approvedItems.length,
      openReviewCount: openReviewItems.length,
      crawlWarningCount: 0,
      sourceIssueCount: 0,
      aiEnabled: Boolean(state.analyzeHealth?.aiConfigured)
    });
  const nextAction = readiness.nextAction || currentNextAction({
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
      const sourceIssues = report.sourceHealth?.filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped' || source.status === 'warning').length || 0;
      setScanMessage(`Scan complete. ${report.competitorsAnalyzed} competitor${report.competitorsAnalyzed === 1 ? '' : 's'} analyzed, ${report.humanReviewItems} review items created, and ${sourceIssues} source health issue${sourceIssues === 1 ? '' : 's'} flagged.`);
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
  const progress = reportReadiness(reportCount, openReviewCount, approvedCount);

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
  const openPriority = priorityReviewItems(openReviewItems);
  const approvedPreview = approvedItems.slice(0, 3);
  const readiness = report
    ? calculateStoredReadiness(report, { approvedEvidenceCount: approvedItems.length, openReviewCount: openReviewItems.length })
    : calculateReportReadiness({
      hasReport: false,
      approvedEvidenceCount: approvedItems.length,
      openReviewCount: openReviewItems.length,
      crawlWarningCount: 0,
      sourceIssueCount: 0,
      aiEnabled: Boolean(state.analyzeHealth?.aiConfigured)
    });
  const readyScore = readiness.score;
  const hasQueuedSources = parseSourceInput(sourceText).length > 0;
  const workflowState = {
    sources: state.competitors.length > 0 || hasQueuedSources,
    scan: Boolean(report),
    review: Boolean(report) && openReviewItems.length > 0,
    approve: approvedItems.length > 0,
    export: approvedItems.length > 0 && openReviewItems.length === 0
  };

  return (
    <div className="cc-stack">
      <section className="cc-hero-panel cc-command-hero">
        <div>
          <span className="cc-hero-kicker">Executive intelligence workspace</span>
          <h2>Turn public competitor evidence into approved field strategy.</h2>
          <p>{nextAction}</p>
          <div className="cc-action-row">
            <Button variant="primary" onClick={() => onTab('sources')}><UploadCloud size={16} /> Start Scan</Button>
            <Button onClick={() => onTab(openReviewItems.length ? 'review' : 'library')}><ClipboardCheck size={16} /> {openReviewItems.length ? 'Triage Review' : 'Open Library'}</Button>
            <Button onClick={() => onTab('report')}><FileText size={16} /> Report Readiness</Button>
          </div>
        </div>
        <div className="cc-status-panel">
          <Badge tone={state.runtime?.persistence.supabaseConfigured ? 'green' : 'amber'}>
            {state.runtime?.persistence.supabaseConfigured ? 'Supabase live' : 'Local fallback'}
          </Badge>
          <strong>{readyScore}% ready</strong>
          <span>
            {report ? (
              <>
                Last scan {formatDate(report.generatedAt)}
                <br />
                {report.pagesReviewed} pages reviewed
              </>
            ) : 'Upload public competitor URLs to begin.'}
          </span>
          <Progress value={readyScore} tone={readyScore > 80 ? 'green' : readyScore > 45 ? 'amber' : 'blue'} />
        </div>
      </section>

      <WorkflowRail state={workflowState} onTab={onTab} />

      <div className="cc-metric-grid">
        <Metric label="Recent scans" value={state.reports.length} detail="Stored reports" tone="blue" />
        <Metric label="Review priority" value={openReviewItems.length} detail={openReviewItems.length ? 'Need a decision' : 'Queue is clear'} tone={openReviewItems.length ? 'amber' : 'green'} />
        <Metric label="Approved evidence" value={approvedItems.length} detail="Ready for strategy" tone={approvedItems.length ? 'green' : 'slate'} />
        <Metric label="AI status" value={state.analyzeHealth?.aiConfigured ? 'On' : 'Off'} detail={state.analyzeHealth?.aiConfigured ? 'OpenAI extraction enabled' : 'Rule-based scan available'} tone={state.analyzeHealth?.aiConfigured ? 'teal' : 'amber'} />
      </div>

      <div className="cc-dashboard-grid cc-dashboard-primary">
        <Card title="Next best action" eyebrow="Guided workflow" action={<Badge tone={openReviewItems.length ? 'amber' : report ? 'green' : 'blue'}>{openReviewItems.length ? 'Review' : report ? 'Use outputs' : 'Start'}</Badge>}>
          <div className="cc-next-action">
            <Target size={22} />
            <div>
              <strong>{nextAction}</strong>
              <p>{report ? 'The app will keep sales language evidence-backed, reviewed, and ready for leadership output.' : 'Start with one or more public competitor websites. The scan creates review items, strategy signals, coach evidence, and a report preview.'}</p>
            </div>
          </div>
          <div className="cc-action-row">
            <Button variant="primary" onClick={() => onTab(report ? (openReviewItems.length ? 'review' : 'coach') : 'sources')}>
              {report ? (openReviewItems.length ? <ListChecks size={16} /> : <Sparkles size={16} />) : <UploadCloud size={16} />}
              {report ? (openReviewItems.length ? 'Review Priority Items' : 'Ask AI Coach') : 'Upload Sources'}
            </Button>
            {report ? <Button onClick={() => onTab('report')}><FileText size={16} /> View Report</Button> : null}
          </div>
        </Card>

        <Card title="Intelligence readiness" action={<Badge tone={readiness.status === 'Ready' ? 'green' : readiness.status === 'Draft' ? 'amber' : 'red'}>{readiness.status}</Badge>}>
          <div className="cc-readiness-panel">
            <Progress value={readyScore} tone={readyScore > 80 ? 'green' : readyScore > 45 ? 'amber' : 'blue'} />
            <p>{readiness.nextAction}</p>
          </div>
          <div className="cc-compact-list">
            {(readiness.blockers.length ? readiness.blockers : readiness.strengths).slice(0, 4).map((item) => (
              <div key={item} className={readiness.blockers.length ? 'cc-blocker compact' : 'cc-blocker resolved compact'}>
                {readiness.blockers.length ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick scan" action={<Badge tone="blue">Public websites</Badge>}>
          <textarea className="cc-textarea compact" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste competitor URLs, one per line." />
          <div className="cc-action-row">
            <Button variant="primary" disabled={scanBusy || !hasQueuedSources} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Brain size={16} />} {scanBusy ? 'Scanning' : 'Run Intelligence Scan'}
            </Button>
            <Button onClick={() => onTab('sources')}>Advanced Intake <ArrowRight size={15} /></Button>
          </div>
          {scanMessage ? <p className="cc-helper">{scanMessage}</p> : <p className="cc-helper">Use public competitor websites only. Private, local, and internal URLs are blocked server-side.</p>}
        </Card>
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Review priority" action={<Button variant="ghost" onClick={() => onTab('review')}>Open Review</Button>}>
          {openPriority.length ? (
            <div className="cc-priority-list">
              {openPriority.slice(0, 4).map((item, index) => (
                <div key={item.id} className="cc-priority-item">
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.competitorName} | {item.serviceLine}</strong>
                    <p>{item.safeSalesWording}</p>
                  </div>
                  <Badge tone={toneForStatus(item.effectiveReviewStatus)}>{item.effectiveReviewStatus}</Badge>
                </div>
              ))}
            </div>
          ) : <Notice title="Review queue clear" body="No open review items are waiting in the latest report." tone="green" />}
        </Card>
        <Card title="Approved intelligence">
          {approvedPreview.length ? (
            <div className="cc-list">
              {approvedPreview.map((item) => (
                <div key={item.id} className="cc-list-item">
                  <CircleCheck size={17} />
                  <div>
                    <strong>{item.competitorName} | {item.serviceLine}</strong>
                    <p>{item.safeSalesWording}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No approved intelligence yet" body="Approve evidence-backed findings to unlock strategy, field coaching, and leadership-ready reports." action={<Button onClick={() => onTab('review')}>Open Review</Button>} />
          )}
        </Card>
      </div>

      <div className="cc-dashboard-grid">
        <Card title="Executive signals" action={report ? <Badge tone="dark">Latest report</Badge> : null}>
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
        <Card title="Report readiness" action={<Badge tone={readyScore > 80 ? 'green' : 'amber'}>{readyScore}%</Badge>}>
          <div className="cc-readiness-panel">
            <Progress value={readyScore} tone={readyScore > 80 ? 'green' : readyScore > 45 ? 'amber' : 'blue'} />
            <p>{approvedItems.length ? `${approvedItems.length} approved finding${approvedItems.length === 1 ? '' : 's'} can be used. ${openReviewItems.length} finding${openReviewItems.length === 1 ? '' : 's'} still need review.` : 'Approve at least one finding before the report should be used with leadership or field teams.'}</p>
          </div>
          <div className="cc-action-row">
            <Button onClick={() => onTab('report')}><FileText size={16} /> Preview Report</Button>
            <Button onClick={() => onTab('coach')}><Bot size={16} /> Ask Coach</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorkflowRail({
  state,
  onTab
}: {
  state: Record<typeof workflowSteps[number]['id'], boolean>;
  onTab: (tab: TabId) => void;
}) {
  return (
    <section className="cc-workflow-rail" aria-label="Workflow progress">
      {workflowSteps.map((step) => {
        const Icon = step.icon;
        const complete = state[step.id];
        const targetTab: TabId = step.id === 'scan' ? 'sources' : step.id === 'approve' ? 'review' : step.id === 'export' ? 'report' : step.id;
        return (
          <button key={step.id} type="button" className={complete ? 'complete' : ''} onClick={() => onTab(targetTab)}>
            <span>{complete ? <CheckCircle2 size={17} /> : <Icon size={17} />}</span>
            <strong>{step.label}</strong>
            <small>{step.help}</small>
          </button>
        );
      })}
    </section>
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
        <Card title="Run a real intelligence scan" eyebrow="Source intake" action={<Badge tone={parsed.length ? 'blue' : 'slate'}>{parsed.length} ready</Badge>}>
          <label className="cc-label" htmlFor="source-text">Competitor websites</label>
          <textarea id="source-text" className="cc-textarea" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="https://competitor.org/services&#10;https://another-provider.org/home-health" />
          <div className="cc-action-row">
            <Button variant="primary" disabled={scanBusy || !parsed.length} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <UploadCloud size={16} />} {scanBusy ? 'Scanning public pages' : 'Run Intelligence Scan'}
            </Button>
            <Button onClick={() => setSourceText('')}>Clear</Button>
          </div>
          {scanMessage ? <Notice title={scanBusy ? 'Scan running' : 'Scan status'} body={scanMessage} tone={scanBusy ? 'blue' : 'amber'} /> : null}
          {!scanMessage && invalidCount ? <Notice title="Some sources need attention" body={`${invalidCount} entr${invalidCount === 1 ? 'y is' : 'ies are'} not a valid public website URL and will be skipped.`} tone="amber" /> : null}
        </Card>

        <Card title="What the scan creates" action={<Badge tone={state.analyzeHealth?.aiConfigured ? 'green' : 'amber'}>{state.analyzeHealth?.aiConfigured ? 'AI enriched' : 'Rule based'}</Badge>}>
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
        <Card title="Latest scan source health" action={<Badge tone="blue">{state.currentReport.sourceHealth.length} checked</Badge>}>
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
  const [filter, setFilter] = useState<'priority' | 'all' | 'evidence' | 'not-found'>('priority');
  const prioritized = priorityReviewItems(items);
  const filtered = prioritized.filter((item) => {
    if (filter === 'evidence') return Boolean(item.sourceUrl);
    if (filter === 'not-found') return item.competitorStatus === 'Not found publicly';
    return true;
  });
  const visibleItems = (filter === 'priority' ? filtered.slice(0, 18) : filtered).slice(0, 60);

  if (!items.length) {
    return <EmptyState title="No findings need review" body="Run a scan or approve new findings to keep the intelligence library current." action={<Button onClick={onSources}>Upload Sources</Button>} />;
  }

  return (
    <div className="cc-stack">
      <Card title="Review command center" eyebrow="Governance queue" action={<Badge tone="amber">{items.length} open</Badge>}>
        <div className="cc-review-summary">
          <div>
            <strong>{prioritized.length}</strong>
            <span>Need decision</span>
          </div>
          <div>
            <strong>{prioritized.filter((item) => item.sourceUrl).length}</strong>
            <span>Have source evidence</span>
          </div>
          <div>
            <strong>{prioritized.filter((item) => item.competitorStatus === 'Not found publicly').length}</strong>
            <span>Public visibility gaps</span>
          </div>
          <div>
            <strong>{prioritized.filter((item) => item.kind === 'service').length}</strong>
            <span>Service-line decisions</span>
          </div>
        </div>
        <div className="cc-filter-row" aria-label="Review filters">
          {[
            ['priority', 'Priority'],
            ['all', 'All open'],
            ['evidence', 'Has evidence'],
            ['not-found', 'Not found publicly']
          ].map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value as typeof filter)}>
              {label}
            </button>
          ))}
        </div>
        <Notice
          title="Use approved language only"
          body="Approve findings when public evidence supports field use. Use Needs Edits for wording concerns and Reject for unsupported or misleading claims."
          tone="blue"
        />
      </Card>

      {visibleItems.length ? (
        <div className="cc-review-grid">
          {visibleItems.map((item) => (
            <Card key={item.id} className="cc-review-card">
              <div className="cc-finding-head">
                <Badge tone={item.kind === 'service' ? 'blue' : 'teal'}>{item.kind}</Badge>
                <Badge tone={toneForStatus(item.effectiveReviewStatus)}>{item.effectiveReviewStatus}</Badge>
                <Badge tone={toneForStatus(item.competitorStatus)}>{item.competitorStatus}</Badge>
                <Badge tone={item.recommendedReviewAction === 'Approve' ? 'green' : item.recommendedReviewAction === 'Edit' ? 'amber' : item.recommendedReviewAction === 'Reject' ? 'red' : 'blue'}>
                  {item.recommendedReviewAction || 'Investigate'}
                </Badge>
              </div>
              <h3>{item.serviceLine}{'subservice' in item ? `: ${item.subservice}` : ''}</h3>
              <p className="cc-muted">{item.competitorName} | {compactUrl(item.sourceUrl)}</p>
              <blockquote>{item.evidenceExcerpt}</blockquote>
              <div className="cc-policy-row">
                <span><strong>Evidence</strong>{item.evidenceStrength || 'Needs review'}</span>
                <span><strong>Field risk</strong>{item.fieldRisk || 'Medium'}</span>
                <span><strong>Decision</strong>{item.recommendedReviewAction || 'Investigate'}</span>
              </div>
              {item.reviewReason ? (
                <Notice title="Why this recommendation" body={item.reviewReason} tone={item.fieldRisk === 'High' ? 'amber' : 'blue'} />
              ) : null}
              {!item.sourceUrl ? (
                <Notice title="Missing source evidence" body="This finding should not become field language until a reliable public or approved internal source is attached." tone="red" />
              ) : null}
              <div className="cc-guidance">
                <strong>Safe field wording</strong>
                <p>{item.safeSalesWording}</p>
                {'avoidSaying' in item && item.avoidSaying ? (
                  <small><AlertTriangle size={14} /> {item.avoidSaying}</small>
                ) : null}
              </div>
              <div className="cc-action-row">
                <Button variant="primary" disabled={busyId === item.id} onClick={() => onReview(item, 'Approved for sales use')}><CheckCircle2 size={15} /> Approve</Button>
                <Button disabled={busyId === item.id} onClick={() => onReview(item, 'Needs edits')}><Flag size={15} /> Needs Edits</Button>
                <Button variant="danger" disabled={busyId === item.id} onClick={() => onReview(item, 'Rejected')}>Reject</Button>
                {item.sourceUrl ? (
                  <a className="cc-inline-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                    Source <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No findings match this filter" body="Try a different review filter or run a new scan with more source pages." />
      )}

      {filtered.length > visibleItems.length ? (
        <Notice title="Showing the highest-priority items first" body={`Showing ${visibleItems.length} of ${filtered.length} matching findings so the queue stays usable. Use filters to narrow the work.`} tone="amber" />
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
                  <th>Evidence</th>
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
                    <td><Badge tone={item.evidenceStrength === 'Strong' ? 'green' : item.evidenceStrength === 'Moderate' ? 'blue' : item.evidenceStrength === 'Weak' ? 'amber' : 'red'}>{item.evidenceStrength || 'Needs review'}</Badge></td>
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

  const expertBrief = report.expertBrief;

  return (
    <div className="cc-stack">
      <div className="cc-metric-grid">
        <Metric label="Competitors" value={report.competitorsAnalyzed} detail="Analyzed in latest report" tone="blue" />
        <Metric label="Pages reviewed" value={number(report.pagesReviewed)} detail="Public evidence pages" tone="teal" />
        <Metric label="Matched services" value={report.matchedServiceFindings} detail="Clearly offered by competitors" tone="green" />
        <Metric label="Review risk" value={report.humanReviewItems} detail="Findings needing governance" tone="amber" />
      </div>
      {expertBrief ? (
        <Card title="Expert leadership brief" eyebrow="AI strategy layer" action={<Badge tone="dark">Score {expertBrief.expertScore}</Badge>}>
          <div className="cc-strategy-brief">
            <div>
              <strong>{expertBrief.marketPosture}</strong>
              <p>{expertBrief.expertSummary}</p>
            </div>
            <div className="cc-brief-callout">
              <span>Leadership decision</span>
              <p>{expertBrief.leadershipDecision}</p>
            </div>
            <div className="cc-brief-callout">
              <span>Fastest field move</span>
              <p>{expertBrief.fastestFieldMove}</p>
            </div>
            <div className="cc-brief-callout warning">
              <span>Governance warning</span>
              <p>{expertBrief.governanceWarning}</p>
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
                <strong>{insight.title}</strong>
                <p>{insight.summary}</p>
                <small>{insight.action}</small>
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
                <p>{play.scenario}</p>
                <div>
                  <strong>Lead with</strong>
                  <span>{play.leadWith}</span>
                </div>
                <div>
                  <strong>Ask</strong>
                  <span>{play.referralQuestion}</span>
                </div>
                <small><AlertTriangle size={14} /> {play.avoidSaying}</small>
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
                  <strong>{item.competitorName}: {item.signal}</strong>
                  <p>{item.whyItMatters}</p>
                  <small>{item.nextCheck}</small>
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
  const starters = [
    'What should the field team say safely?',
    'Where does Andwell appear strongest?',
    'What needs manager review before sales use?'
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
        <Notice title="Evidence-only answers" body={report ? 'Answers include confidence, cited evidence, safe wording, and next moves.' : 'Run a competitor scan first so the coach has stored evidence to answer from.'} tone={report ? 'blue' : 'amber'} />
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
  const readiness = calculateStoredReadiness(report, { approvedEvidenceCount: approvedItems.length, openReviewCount });
  const blockers = readiness.blockers;
  const ready = readiness.status === 'Ready';
  const approvedServices = Array.from(new Set(approvedItems.map((item) => item.serviceLine))).slice(0, 6);
  const reportTone = ready ? 'green' : blockers.length > 2 ? 'red' : 'amber';

  return (
    <div className="cc-stack">
      <Card
        title="Executive report readiness"
        eyebrow="Print and leadership preview"
        action={<Button variant="primary" disabled={!approvedItems.length} onClick={() => window.print()}><FileText size={16} /> Print Report</Button>}
      >
        <div className="cc-metric-grid">
          <Metric label="Report status" value={ready ? 'Ready' : 'Blocked'} detail={ready ? 'No blockers open' : `${blockers.length} blocker${blockers.length === 1 ? '' : 's'} remain`} tone={reportTone} />
          <Metric label="Readiness score" value={`${readiness.score}%`} detail={readiness.status} tone={reportTone} />
          <Metric label="Approved evidence" value={approvedItems.length} detail="Can be used in report" tone="green" />
          <Metric label="Human review" value={openReviewCount} detail="Must be resolved" tone={openReviewCount ? 'red' : 'green'} />
        </div>
        <div className="cc-report-actions">
          <div className="cc-blocker-list">
            {ready ? (
              <div className="cc-blocker resolved"><CheckCircle2 size={18} /><span>Ready for leadership preview and field coaching.</span></div>
            ) : blockers.map((blocker) => (
              <div key={blocker} className="cc-blocker"><AlertTriangle size={18} /><span>{blocker}</span></div>
            ))}
          </div>
          <Notice
            title={ready ? 'Report is ready' : 'Use as draft only'}
            body={ready ? 'The report has approved evidence and no open review blockers.' : 'The preview remains available, but unresolved review items should be cleared before leadership or field use.'}
            tone={ready ? 'green' : 'amber'}
          />
          {report.recommendedActions?.length ? (
            <div className="cc-compact-list">
              {report.recommendedActions.slice(0, 4).map((action) => (
                <div key={action.id} className="cc-list-item">
                  <Sparkles size={17} />
                  <div>
                    <strong>{action.label}</strong>
                    <p>{action.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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
        <div className="cc-report-section cc-report-summary-band">
          <article>
            <span>Competitors</span>
            <strong>{report.competitorsAnalyzed}</strong>
            <p>{report.pagesReviewed} public pages reviewed</p>
          </article>
          <article>
            <span>Approved services</span>
            <strong>{approvedServices.length || 0}</strong>
            <p>{approvedServices.join(', ') || 'No approved service evidence yet'}</p>
          </article>
          <article>
            <span>Governance</span>
            <strong>{ready ? 'Clear' : 'Draft'}</strong>
            <p>{openReviewCount ? `${openReviewCount} open review items` : 'No open review items'}</p>
          </article>
        </div>
        <div className="cc-report-section">
          <h3>Leadership decisions</h3>
          {report.executiveInsights.map((insight) => (
            <article key={insight.title}>
              <Badge tone={insight.priority === 'High' ? 'red' : 'amber'}>{insight.priority}</Badge>
              <strong>{insight.title}</strong>
              <p>{insight.summary}</p>
              <p>{insight.action}</p>
            </article>
          ))}
        </div>
        <div className="cc-report-section">
          <h3>Approved field language</h3>
          {approvedItems.length ? approvedItems.slice(0, 8).map((item) => (
            <article key={item.id}>
              <strong>{item.competitorName} | {item.serviceLine}</strong>
              <p>{item.safeSalesWording}</p>
              <small>{compactUrl(item.sourceUrl)} | Confidence: {item.confidence}</small>
            </article>
          )) : (
            <article>
              <strong>No approved language yet</strong>
              <p>Approve findings in the review queue before using this report externally.</p>
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
        <Card title="Production checks" eyebrow="Hostinger readiness">
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
                <p>{state.runtime?.persistence.supabaseConfigured ? 'Reports, competitors, reviews, and catalog overrides are ready to persist through Supabase.' : 'The app is usable for development, but Hostinger production should set Supabase URL and service role variables.'}</p>
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
          {['/api/health', '/api/version', '/api/runtime', '/api/diagnostics', '/api/analyze', '/api/competitors', '/api/reports', '/api/reviews', '/api/catalog', '/api/ask'].map((route) => (
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
          <div className="cc-finding-head">
            <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
            {item.evidenceStrength ? <Badge tone={item.evidenceStrength === 'Strong' ? 'green' : item.evidenceStrength === 'Moderate' ? 'blue' : item.evidenceStrength === 'Weak' ? 'amber' : 'red'}>{item.evidenceStrength}</Badge> : null}
            {item.fieldRisk ? <Badge tone={item.fieldRisk === 'Low' ? 'green' : item.fieldRisk === 'Medium' ? 'amber' : 'red'}>{item.fieldRisk} risk</Badge> : null}
          </div>
          <h4>{item.competitorName} | {item.serviceLine}{item.subservice ? ` | ${item.subservice}` : ''}</h4>
          <p>{item.evidenceExcerpt}</p>
          {item.reviewReason ? <p>{item.reviewReason}</p> : null}
          <small>{compactUrl(item.sourceUrl)}</small>
        </article>
      ))}
    </div>
  );
}
