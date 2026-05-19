'use client';

import { useMemo, useState } from 'react';
import { LoadingState } from '../components/StateViews';
import { andwellCatalog } from '../lib/andwell';
import { buildGrowthRows, buildStaffingPlan, growthDefaultScenario, rollupGrowthByService, summarizeGrowth } from '../lib/growth-plan';
import type { CompetitorInput, IntelligenceReport } from '../lib/types';
import type { GrowthScenario } from '../lib/growth-plan';
import type { View, RoleView, MatrixFilter, ReportSummary, ApiCheck, AskResponse } from '../lib/command-center/types';
import { nav, roleGuidance } from '../lib/command-center/data';
import { api, nameFromUrl, normalizeUrl } from '../lib/command-center/utils';
import { Dashboard } from '../components/command-center/views/Dashboard';
import { GrowthCommand } from '../components/command-center/views/GrowthCommand';
import { BoardRoom } from '../components/command-center/views/BoardRoom';
import { LaunchPlan } from '../components/command-center/views/LaunchPlan';
import { ExpertCenter } from '../components/command-center/views/ExpertCenter';
import { AIIntelligence } from '../components/command-center/views/AIIntelligence';
import { PromptEngine } from '../components/command-center/views/PromptEngine';
import { Intake } from '../components/command-center/views/Intake';
import { Matrix } from '../components/command-center/views/Matrix';
import { Battlecards } from '../components/command-center/views/Battlecards';
import { Reports } from '../components/command-center/views/Reports';
import { AskHub } from '../components/command-center/views/AskHub';
import { Catalog } from '../components/command-center/views/Catalog';
import { Diagnostics } from '../components/command-center/views/Diagnostics';

export default function Page() {
  const [view, setView] = useState<View>('dashboard');
  const [roleView, setRoleView] = useState<RoleView>('Executive');
  const [matrixFilter, setMatrixFilter] = useState<MatrixFilter>('all');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [currentReport, setCurrentReport] = useState<IntelligenceReport | null>(null);
  const [question, setQuestion] = useState('');
  const [askResponse, setAskResponse] = useState<AskResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<ApiCheck[]>([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('Ready');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [growthScenario, setGrowthScenario] = useState<GrowthScenario>(growthDefaultScenario);

  const aiAnalyses = currentReport?.analyses.filter((analysis) => Boolean(analysis.aiExtraction)) || [];
  const growthRows = useMemo(() => buildGrowthRows(growthScenario), [growthScenario]);
  const growthTotals = useMemo(() => summarizeGrowth(growthRows), [growthRows]);
  const growthServiceRollup = useMemo(() => rollupGrowthByService(growthRows), [growthRows]);
  const staffingPlan = useMemo(() => buildStaffingPlan(growthRows), [growthRows]);
  const stats = useMemo(() => ({
    competitors: competitors.length,
    reports: reports.length,
    serviceLines: andwellCatalog.length,
    subservices: andwellCatalog.reduce((sum, service) => sum + service.subservices.length, 0),
    pages: currentReport?.pagesReviewed || 0,
    serviceFindings: currentReport?.allFindings?.length || 0,
    subserviceFindings: currentReport?.allSubserviceFindings?.length || 0,
    reviewItems: currentReport?.humanReviewItems || 0,
    aiAnalyses: currentReport?.analyses.filter((analysis) => analysis.aiEnhanced).length || 0,
    advantages: currentReport?.potentialAndwellAdvantages || 0,
    expertScore: currentReport?.expertBrief?.expertScore || 0
  }), [competitors, reports, currentReport]);

  const topThreat = useMemo(() => {
    return [...(currentReport?.competitorScores || [])].sort((a, b) => (b.serviceLineMatchScore + b.subserviceDepthScore) - (a.serviceLineMatchScore + a.subserviceDepthScore))[0];
  }, [currentReport]);

  const topOpportunity = useMemo(() => {
    return [...(currentReport?.competitorScores || [])].sort((a, b) => b.andwellDifferentiationScore - a.andwellDifferentiationScore)[0];
  }, [currentReport]);

  function clearLegacyBrowserStorage() {
    try {
      ['andwellReports', 'andwellReport', 'andwellCompetitiveReports', 'competitiveIntelligenceReports'].forEach((key) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      });
      setNotice('Legacy browser report storage cleared.');
    } catch {
      setNotice('Browser storage was unavailable, but the app does not require local report storage.');
    }
  }

  async function refreshServerState() {
    setBusy(true);
    setPhase('Load data');
    setError('');
    setNotice('');
    try {
      const competitorResponse = await api<{ competitors: CompetitorInput[] }>('/api/competitors');
      const reportResponse = await api<{ reports: ReportSummary[] }>('/api/reports');
      setCompetitors(competitorResponse.competitors || []);
      setReports(reportResponse.reports || []);
      setNotice('Server state loaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load server state.');
    } finally {
      setBusy(false);
      setPhase('Ready');
    }
  }

  function addUrls() {
    const urls = urlInput.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    const next = urls.slice(0, Math.max(0, 25 - competitors.length)).map((url) => ({ name: nameFromUrl(url), url: normalizeUrl(url), market: 'Needs review' }));
    setCompetitors((current) => [...current, ...next]);
    setUrlInput('');
  }

  async function saveCompetitors() {
    setBusy(true); setPhase('Save library'); setError(''); setNotice('');
    try {
      const response = await api<{ competitors: CompetitorInput[] }>('/api/competitors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ competitors }) });
      setCompetitors(response.competitors || []);
      setNotice('Competitor library saved on the server.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save competitors.'); } finally { setBusy(false); setPhase('Ready'); }
  }

  async function runAnalysis() {
    setBusy(true); setError(''); setNotice(''); setAskResponse(null);
    try {
      if (!competitors.length) throw new Error('Add at least one competitor URL first.');
      setPhase('Validate URLs');
      await new Promise((resolve) => setTimeout(resolve, 80));
      setPhase('Crawl pages');
      const report = await api<IntelligenceReport>('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ competitors, maxPagesPerSite: 8, save: true, useAI: true }) });
      setPhase('Build brief');
      setCurrentReport(report);
      setNotice(report.expertBrief ? 'Foremost expert analysis completed and saved on the server.' : 'Analysis completed. Run a fresh scan after deployment to generate the full expert brief.');
      setView(report.expertBrief ? 'expert' : 'dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Analysis failed.'); } finally { setBusy(false); setPhase('Ready'); }
  }

  async function loadReport(id: string) {
    setBusy(true); setPhase('Load report'); setError(''); setNotice('');
    try {
      const response = await api<{ report: IntelligenceReport }>(`/api/reports?id=${encodeURIComponent(id)}`);
      setCurrentReport(response.report);
      setNotice('Stored report loaded.');
      setView(response.report.expertBrief ? 'expert' : 'dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load report.'); } finally { setBusy(false); setPhase('Ready'); }
  }

  async function askHub() {
    setBusy(true); setPhase('Ask the Hub'); setError(''); setAskResponse(null);
    try {
      const response = await api<AskResponse>('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, reportId: currentReport?.id }) });
      setAskResponse(response);
    } catch (err) { setError(err instanceof Error ? err.message : 'Ask the Hub failed.'); } finally { setBusy(false); setPhase('Ready'); }
  }

  async function runDiagnostics() {
    setBusy(true); setPhase('System Check'); setError(''); setDiagnostics([]);
    const routes = ['/api/version', '/api/health', '/api/diagnostics', '/api/analyze', '/api/expert', '/api/competitors', '/api/reports', '/api/reviews', '/api/catalog', '/api/ask', '/api/runtime'];
    const results: ApiCheck[] = [];
    for (const route of routes) {
      try {
        const response = await fetch(route, { headers: { accept: 'application/json' }, cache: 'no-store' });
        const text = await response.text();
        const trimmed = text.trim();
        const isHtml = trimmed.startsWith('<');
        results.push({ route, ok: response.ok && !isHtml, status: response.status, message: isHtml ? 'Returned HTML instead of JSON' : 'Returned JSON or text', preview: text.slice(0, 180).replace(/\s+/g, ' ') });
      } catch (err) { results.push({ route, ok: false, status: 0, message: err instanceof Error ? err.message : 'Request failed' }); }
    }
    setDiagnostics(results); setBusy(false); setPhase('Ready');
  }

  function exportJson() {
    if (!currentReport) return;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'andwell-competitive-intelligence-report.json'; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="shell proShell" style={{ minHeight: 'calc(100vh - 56px)' }}>
    <aside className="side proSide" style={{ height: 'calc(100vh - 56px)', top: 0 }}>
      <div className="brand proBrand"><p>Andwell Innovation</p><h1>Intelligence Command Center</h1><span>Competitive evidence, growth planning, staffing logic, and board-ready strategy in one operating system.</span></div>
      <div className="roleBox">
        <label>Lens</label>
        <select className="select darkSelect" value={roleView} onChange={(event) => setRoleView(event.target.value as RoleView)}>
          {(Object.keys(roleGuidance) as RoleView[]).map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <p>{roleGuidance[roleView].headline}</p>
      </div>
      <nav className="nav proNav">{nav.map((item) => <button key={item.key} className={view === item.key ? 'active' : ''} onClick={() => setView(item.key)}><strong>{item.label}</strong><small>{item.note}</small></button>)}</nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <button className="btn primary w-full justify-center" onClick={() => { window.location.href = '/growth-plan'; }}><strong>Growth Plan Dashboard</strong></button>
      </div>
    </aside>
    <main className="main proMain">
      <header className="head proHead"><div><small>{currentReport?.expertBrief ? `Foremost Expert | ${currentReport.expertBrief.expertScore}` : currentReport?.aiEnabled ? `AI Enhanced | ${currentReport.aiModel || 'OpenAI'}` : 'Stable Build'}</small><h2>{nav.find((item) => item.key === view)?.label || 'Andwell Innovation'}</h2></div><div className="row"><span className={`badge ${busy ? 'amber' : 'green'}`}>{phase}</span><button className="btn" disabled={busy} onClick={refreshServerState}>Load Server Data</button><button className="btn" onClick={() => setView('diagnostics')}>System Check</button></div></header>
      <div className="content proContent">
        {error && <div className="error mb-4">{error}</div>}
        {notice && <div className="notice mb-4">{notice}</div>}
        {busy && <LoadingState message={phase} />}
        {view === 'dashboard' && <Dashboard stats={stats} currentReport={currentReport} roleView={roleView} topThreat={topThreat} topOpportunity={topOpportunity} setView={setView} exportJson={exportJson} clearLegacyBrowserStorage={clearLegacyBrowserStorage} />}
        {view === 'growth' && <GrowthCommand rows={growthRows} totals={growthTotals} serviceRollup={growthServiceRollup} scenario={growthScenario} setScenario={setGrowthScenario} setView={setView} />}
        {view === 'board' && <BoardRoom currentReport={currentReport} totals={growthTotals} rows={growthRows} topThreat={topThreat} topOpportunity={topOpportunity} setView={setView} />}
        {view === 'launch' && <LaunchPlan rows={growthRows} totals={growthTotals} staffingPlan={staffingPlan} setView={setView} />}
        {view === 'expert' && <ExpertCenter currentReport={currentReport} setView={setView} />}
        {view === 'ai' && <AIIntelligence currentReport={currentReport} aiAnalyses={aiAnalyses} />}
        {view === 'prompt' && <PromptEngine />}
        {view === 'intake' && <Intake competitors={competitors} setCompetitors={setCompetitors} urlInput={urlInput} setUrlInput={setUrlInput} addUrls={addUrls} saveCompetitors={saveCompetitors} runAnalysis={runAnalysis} busy={busy} />}
        {view === 'matrix' && <Matrix currentReport={currentReport} matrixFilter={matrixFilter} setMatrixFilter={setMatrixFilter} matrixSearch={matrixSearch} setMatrixSearch={setMatrixSearch} />}
        {view === 'battlecards' && <Battlecards currentReport={currentReport} />}
        {view === 'reports' && <Reports reports={reports} currentReport={currentReport} loadReport={loadReport} exportJson={exportJson} refreshServerState={refreshServerState} busy={busy} />}
        {view === 'ask' && <AskHub question={question} setQuestion={setQuestion} askHub={askHub} askResponse={askResponse} busy={busy} currentReport={currentReport} />}
        {view === 'catalog' && <Catalog />}
        {view === 'diagnostics' && <Diagnostics diagnostics={diagnostics} runDiagnostics={runDiagnostics} busy={busy} />}
      </div>
    </main>
  </div>;
}
