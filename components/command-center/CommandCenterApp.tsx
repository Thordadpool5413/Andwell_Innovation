'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, askHub, deleteCompetitor, fetchAnalyzeHealth, fetchCatalog, fetchCompetitors, fetchReport, fetchReports, fetchRuntime, runAnalysis, type ScanLifecycleUpdate } from './api';
import type { AskResponse, CommandCenterState, ServiceHealthItem, ServiceHealthKey, TabId } from './model';
import { AppShell } from './AppShell';
import { HomeScreen } from './screens/HomeScreen';
import { BuildIntelligenceScreen } from './screens/BuildIntelligenceScreen';
import { LibraryScreenView } from './screens/LibraryScreen';
import { MatrixScreenView } from './screens/MatrixScreen';
import { GrowthMapScreenView } from './screens/GrowthMapScreen';
import { StrategyScreenView } from './screens/StrategyScreen';
import { CoachScreenView } from './screens/CoachScreen';
import { ReportScreenView } from './screens/ReportScreen';
import { parseSourceInput, sanitizeUserFacingError, scanProgressPercent, toReviewable } from './helpers';
import { buildAdvantageMatrix, buildGrowthMap, type AdvantageMatrix, type GrowthMap } from '../../lib/intelligence-views';

const initialState: CommandCenterState = {
  status: 'idle',
  error: '',
  competitors: [],
  reports: [],
  currentReport: null,
  catalog: [],
  analyzeHealth: null,
  runtime: null,
  serviceHealth: {
    reports: { status: 'ok' },
    competitors: { status: 'ok' },
    catalog: { status: 'ok' },
    runtime: { status: 'ok' },
    analyze: { status: 'ok' }
  }
};

function toServiceItem(result: PromiseSettledResult<unknown>, checkedAt: string): ServiceHealthItem {
  if (result.status === 'fulfilled') return { status: 'ok', checkedAt };
  const reason = result.reason;
  const httpStatus = reason instanceof ApiError ? reason.status : undefined;
  const down = typeof httpStatus === 'number' && httpStatus >= 500;
  return {
    status: down ? 'down' : 'degraded',
    httpStatus,
    lastError: reason instanceof Error ? reason.message : 'Service request failed',
    checkedAt
  };
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
      const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 1, delayMs = 350): Promise<T> => {
        let lastError: unknown = null;
        for (let i = 0; i <= retries; i += 1) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            if (i < retries) await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
          }
        }
        throw lastError;
      };

      const [reportsResult, competitorsResult, catalogResult, analyzeResult, runtimeResult] = await Promise.allSettled([
        fetchWithRetry(fetchReports, 1),
        fetchWithRetry(fetchCompetitors, 1),
        fetchWithRetry(fetchCatalog, 1),
        fetchWithRetry(fetchAnalyzeHealth, 1),
        fetchWithRetry(fetchRuntime, 1)
      ]);
      const checkedAt = new Date().toISOString();
      const serviceHealth: Record<ServiceHealthKey, ServiceHealthItem> = {
        reports: toServiceItem(reportsResult, checkedAt),
        competitors: toServiceItem(competitorsResult, checkedAt),
        catalog: toServiceItem(catalogResult, checkedAt),
        analyze: toServiceItem(analyzeResult, checkedAt),
        runtime: toServiceItem(runtimeResult, checkedAt)
      };

      const reportsPayload = reportsResult.status === 'fulfilled' ? reportsResult.value : { reports: [] };
      const competitorsPayload = competitorsResult.status === 'fulfilled' ? competitorsResult.value : { competitors: [] };
      const catalogPayload = catalogResult.status === 'fulfilled' ? catalogResult.value : { catalog: [] };
      const analyzePayload = analyzeResult.status === 'fulfilled' ? analyzeResult.value : null;
      const runtimePayload = runtimeResult.status === 'fulfilled' ? runtimeResult.value : null;

      let currentReport = null;
      const latest = reportsPayload.reports[0];
      if (latest?.id) {
        try {
          const reportPayload = await fetchReport(latest.id);
          currentReport = reportPayload.report;
        } catch {
          currentReport = null;
        }
      }

      const coreFailures = [reportsResult, competitorsResult, catalogResult].filter((r) => r.status === 'rejected').length;
      if (coreFailures === 3) {
        setState({
          status: 'ready',
          error: '',
          competitors: [],
          reports: [],
          currentReport: null,
          catalog: [],
          analyzeHealth: analyzePayload,
          runtime: runtimePayload,
          serviceHealth
        });
        return;
      }
      setState({
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport,
        catalog: catalogPayload.catalog,
        analyzeHealth: analyzePayload,
        runtime: runtimePayload,
        serviceHealth
      });
    } catch {
      setState((current) => ({
        ...current,
        status: 'ready',
        error: '',
        serviceHealth: {
          reports: { status: 'down', lastError: 'Reports service request failed', checkedAt: new Date().toISOString() },
          competitors: { status: 'down', lastError: 'Competitor service request failed', checkedAt: new Date().toISOString() },
          catalog: { status: 'down', lastError: 'Catalog service request failed', checkedAt: new Date().toISOString() },
          runtime: { status: 'degraded', lastError: 'Runtime service request failed', checkedAt: new Date().toISOString() },
          analyze: { status: 'degraded', lastError: 'Analyze status request failed', checkedAt: new Date().toISOString() }
        }
      }));
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
      setScanMessage('The intelligence engine is reading public evidence, scrubbing unsupported claims, connecting service lines, and building strategy outputs.');
    try {
      const report = await runAnalysis(competitors, 8, (update: ScanLifecycleUpdate) => {
        setState((current) => ({ ...current, scanJobId: update.jobId, scanStatus: update.status, scanProgress: update.progress, scanWarnings: update.warnings }));
      });
      const hydratedReport = report.id ? (await fetchReport(report.id).catch(() => ({ report }))).report : report;
      const [reportsPayload, competitorsPayload] = await Promise.all([fetchReports(), fetchCompetitors()]);
      setState((current) => ({
        ...current,
        status: 'ready',
        error: '',
        competitors: competitorsPayload.competitors,
        reports: reportsPayload.reports,
        currentReport: hydratedReport,
        scanStatus: 'completed',
        scanProgress: { done: competitors.length, total: competitors.length }
      }));
      const sourceIssues = hydratedReport.sourceHealth?.filter((source) => source.status === 'duplicate' || source.status === 'rejected' || source.status === 'skipped' || source.status === 'warning').length || 0;
      setSourceText('');
      setScanMessage(`Intelligence package created. ${hydratedReport.competitorsAnalyzed} competitor${hydratedReport.competitorsAnalyzed === 1 ? '' : 's'} processed, ${hydratedReport.pagesReviewed} public page${hydratedReport.pagesReviewed === 1 ? '' : 's'} reviewed, and ${sourceIssues} source safeguard${sourceIssues === 1 ? '' : 's'} handled.`);
      setActiveTab('strategy');
    } catch (error) {
      setState((current) => ({ ...current, scanStatus: 'failed' }));
      setScanMessage(sanitizeUserFacingError(error instanceof Error ? error.message : 'The intelligence build could not be completed.'));
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
      setAskResponse({ answer: sanitizeUserFacingError(error instanceof Error ? error.message : 'The coach could not answer this question.'), confidence: 'Evidence limited', nextBestActions: [], evidence: [] });
    } finally {
      setAskBusy(false);
    }
  }

  return (
    <AppShell
      activeTab={activeTab}
      mobileOpen={mobileOpen}
      onClose={() => setMobileOpen(false)}
      onOpen={() => setMobileOpen(true)}
      onChange={setActiveTab}
      onRefresh={() => void loadWorkspace()}
    >
      {activeTab === 'dashboard' ? <HomeScreen state={state} approvedItems={approvedItems} matrix={matrix} growthMap={growthMap} onBuild={() => setActiveTab('sources')} onNavigate={setActiveTab} /> : null}
      {activeTab === 'sources' ? <BuildIntelligenceScreen state={state} sourceText={sourceText} setSourceText={setSourceText} scanBusy={scanBusy} scanMessage={scanMessage} onScan={() => void handleScan()} scanPercent={scanPercent} /> : null}
      {activeTab === 'matrix' ? <MatrixScreenView matrix={matrix} hasReport={Boolean(state.currentReport)} /> : null}
      {activeTab === 'map' ? <GrowthMapScreenView growthMap={growthMap} hasReport={Boolean(state.currentReport)} /> : null}
      {activeTab === 'library' ? <LibraryScreenView approvedItems={filteredApproved} allApprovedCount={approvedItems.length} search={search} setSearch={setSearch} competitors={state.competitors} report={state.currentReport} onDelete={(url) => void handleDeleteCompetitor(url)} onBuild={() => setActiveTab('sources')} /> : null}
      {activeTab === 'strategy' ? <StrategyScreenView report={state.currentReport} onBuild={() => setActiveTab('sources')} matrix={matrix} growthMap={growthMap} /> : null}
      {activeTab === 'coach' ? <CoachScreenView report={state.currentReport} question={question} setQuestion={setQuestion} askBusy={askBusy} askResponse={askResponse} onAsk={() => void handleAsk()} growthMap={growthMap} matrix={matrix} /> : null}
      {activeTab === 'report' ? <ReportScreenView report={state.currentReport} approvedItems={approvedItems} growthMap={growthMap} matrix={matrix} /> : null}
    </AppShell>
  );
}
