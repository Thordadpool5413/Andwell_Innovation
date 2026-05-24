'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { askHub, deleteCompetitor, fetchAnalyzeHealth, fetchCatalog, fetchCompetitors, fetchReport, fetchReports, fetchRuntime, runAnalysis, type ScanLifecycleUpdate } from './api';
import type { AskResponse, CommandCenterState, TabId } from './model';
import { LoadingState, Notice } from './ui';
import { AppShell } from './AppShell';
import { HomeScreen } from './screens/HomeScreen';
import { BuildIntelligenceScreen } from './screens/BuildIntelligenceScreen';
import { CoachScreenView, GrowthMapScreenView, LibraryScreenView, MatrixScreenView, ReportScreenView, StrategyScreenView, SystemScreenView } from './screens/OperationalScreens';
import { currentNextAction, parseSourceInput, scanProgressPercent, toReviewable } from './helpers';
import { buildAdvantageMatrix, buildGrowthMap, type AdvantageMatrix, type GrowthMap } from '../../lib/intelligence-views';

const initialState: CommandCenterState = {
  status: 'idle',
  error: '',
  competitors: [],
  reports: [],
  currentReport: null,
  catalog: [],
  analyzeHealth: null,
  runtime: null
};

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
      const reportPayload = latest?.id ? await fetchReport(latest.id) : { report: null };
      setState({
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport: reportPayload.report,
        catalog: catalogPayload.catalog,
        analyzeHealth: analyzePayload,
        runtime: runtimePayload
      });
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : 'The workspace could not be loaded.' }));
    }
  }, []);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileOpen(false); }, [activeTab]);

  const reviewableItems = useMemo(() => toReviewable(state.currentReport), [state.currentReport]);
  const approvedItems = useMemo(() => reviewableItems.filter((item) => item.recommendedUse !== 'Avoid claim'), [reviewableItems]);
  const filteredApproved = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return approvedItems.slice(0, 80);
    return approvedItems.filter((item) => [item.competitorName, item.serviceLine, 'subservice' in item ? item.subservice : '', item.evidenceExcerpt, item.safeSalesWording].join(' ').toLowerCase().includes(query)).slice(0, 80);
  }, [approvedItems, search]);

  const nextAction = currentNextAction(Boolean(state.currentReport));
  const matrix = useMemo<AdvantageMatrix>(() => buildAdvantageMatrix(state.currentReport), [state.currentReport]);
  const growthMap = useMemo<GrowthMap>(() => buildGrowthMap(state.currentReport, matrix), [state.currentReport, matrix]);
  const scanPercent = scanProgressPercent(state.scanProgress?.done || 0, state.scanProgress?.total || 0);

  async function handleScan() {
    const competitors = parseSourceInput(sourceText);
    if (!competitors.length) {
      setScanMessage('Add at least one public competitor URL before building intelligence.');
      return;
    }
    setScanBusy(true);
    setScanMessage('AI is reviewing public evidence, scrubbing unsafe claims, connecting service lines, and building strategy outputs.');
    try {
      const report = await runAnalysis(competitors, 8, (update: ScanLifecycleUpdate) => {
        setState((current) => ({ ...current, scanJobId: update.jobId, scanStatus: update.status, scanProgress: update.progress, scanWarnings: update.warnings }));
      });
      const [reportsPayload, competitorsPayload] = await Promise.all([fetchReports(), fetchCompetitors()]);
      setState((current) => ({
        ...current,
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport: report,
        scanStatus: 'completed',
        scanProgress: { done: competitors.length, total: competitors.length }
      }));
      const sourceIssues = report.sourceHealth?.filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped' || source.status === 'warning').length || 0;
      setScanMessage(`AI build complete. ${report.competitorsAnalyzed} competitor${report.competitorsAnalyzed === 1 ? '' : 's'} analyzed, ${report.pagesReviewed} public page${report.pagesReviewed === 1 ? '' : 's'} reviewed, and ${sourceIssues} source issue${sourceIssues === 1 ? '' : 's'} handled.`);
      setActiveTab('strategy');
    } catch (error) {
      setState((current) => ({ ...current, scanStatus: 'failed' }));
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
      setAskResponse({ answer: error instanceof Error ? error.message : 'The AI coach could not answer this question.', confidence: 'Evidence limited', nextBestActions: [], evidence: [] });
    } finally {
      setAskBusy(false);
    }
  }

  return (
    <AppShell
      activeTab={activeTab}
      mobileOpen={mobileOpen}
      approvedCount={approvedItems.length}
      reportCount={state.reports.length}
      onClose={() => setMobileOpen(false)}
      onOpen={() => setMobileOpen(true)}
      onChange={setActiveTab}
      onRefresh={() => void loadWorkspace()}
    >
      {state.status === 'loading' ? <LoadingState title="Loading command center" body="Reading reports, catalog, source history, and runtime status." /> : null}
      {state.status === 'error' ? <Notice title="Workspace needs attention" body={state.error} tone="red" /> : null}
      {activeTab === 'dashboard' ? <HomeScreen state={state} approvedItems={approvedItems} nextAction={nextAction} sourceText={sourceText} setSourceText={setSourceText} scanBusy={scanBusy} scanMessage={scanMessage} onScan={() => void handleScan()} onTab={setActiveTab} matrix={matrix} growthMap={growthMap} scanPercent={scanPercent} /> : null}
      {activeTab === 'sources' ? <BuildIntelligenceScreen state={state} sourceText={sourceText} setSourceText={setSourceText} scanBusy={scanBusy} scanMessage={scanMessage} onScan={() => void handleScan()} scanPercent={scanPercent} /> : null}
      {activeTab === 'matrix' ? <MatrixScreenView matrix={matrix} /> : null}
      {activeTab === 'map' ? <GrowthMapScreenView growthMap={growthMap} /> : null}
      {activeTab === 'library' ? <LibraryScreenView approvedItems={filteredApproved} allApprovedCount={approvedItems.length} search={search} setSearch={setSearch} competitors={state.competitors} onDelete={(url) => void handleDeleteCompetitor(url)} onBuild={() => setActiveTab('sources')} /> : null}
      {activeTab === 'strategy' ? <StrategyScreenView report={state.currentReport} onBuild={() => setActiveTab('sources')} matrix={matrix} growthMap={growthMap} /> : null}
      {activeTab === 'coach' ? <CoachScreenView report={state.currentReport} question={question} setQuestion={setQuestion} askBusy={askBusy} askResponse={askResponse} onAsk={() => void handleAsk()} growthMap={growthMap} matrix={matrix} /> : null}
      {activeTab === 'report' ? <ReportScreenView report={state.currentReport} approvedItems={approvedItems} growthMap={growthMap} matrix={matrix} /> : null}
      {activeTab === 'system' ? <SystemScreenView state={state} /> : null}
    </AppShell>
  );
}
