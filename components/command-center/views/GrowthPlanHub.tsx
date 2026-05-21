'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Sun, Moon, CheckCircle, Circle } from 'lucide-react';
import { DarkModeProvider, useDarkMode } from '../../../lib/growth-plan/components/DarkModeContext';
import { ToastProvider } from '../../../lib/growth-plan/components/ToastContainer';
import { TABS, DEFAULT_SCENARIO } from '../../../lib/growth-plan/data/constants';
import type { Scenario } from '../../../lib/growth-plan/data/constants';
import { buildRows } from '../../../lib/growth-plan/utils/calculations';
import { fetchReports, fetchCompetitors } from '../../../lib/growth-plan/utils/api-data';
import type { ApiReport, ApiCompetitor } from '../../../lib/growth-plan/utils/api-data';
import ScenarioPanel from '../../../lib/growth-plan/components/ScenarioPanel';
import ScenarioCompare from '../../../lib/growth-plan/components/ScenarioCompare';
import ScenarioManager from '../../../lib/growth-plan/components/ScenarioManager';
import ExportButton from '../../../lib/growth-plan/components/ExportButton';
import InsightsPanel from '../../../lib/growth-plan/components/InsightsPanel';
import { InsightsEngine } from '../../../lib/growth-plan/utils/insights';
import ExecutiveView from '../../../lib/growth-plan/views/ExecutiveView';
import CountyPlan from '../../../lib/growth-plan/views/CountyPlan';
import ReferralPlan from '../../../lib/growth-plan/views/ReferralPlan';
import CompetitiveView from '../../../lib/growth-plan/views/CompetitiveView';
import ServiceLines from '../../../lib/growth-plan/views/ServiceLines';
import CmsData from '../../../lib/growth-plan/views/CmsData';
import FinancialModel from '../../../lib/growth-plan/views/FinancialModel';
import StaffingModel from '../../../lib/growth-plan/views/StaffingModel';
import SensitivityAnalysis from '../../../lib/growth-plan/views/SensitivityAnalysis';
import OpportunityScore from '../../../lib/growth-plan/views/OpportunityScore';
import LaunchTimeline from '../../../lib/growth-plan/views/LaunchTimeline';
import BoardReport from '../../../lib/growth-plan/views/BoardReport';
import LaunchChecklist from '../../../lib/growth-plan/views/LaunchChecklist';

function GrowthPlanDashboard() {
  const { dark, toggle } = useDarkMode();
  const [activeTab, setActiveTab] = useState('Executive View');
  const [selectedCounty, setSelectedCounty] = useState('York');
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [showScenario, setShowScenario] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [apiReports, setApiReports] = useState<ApiReport[]>([]);
  const [apiCompetitors, setApiCompetitors] = useState<ApiCompetitor[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    setApiLoading(true);
    Promise.all([fetchReports(), fetchCompetitors()]).then(([reports, competitors]) => {
      setApiReports(reports);
      setApiCompetitors(competitors);
    }).catch(() => {}).finally(() => setApiLoading(false));
  }, []);

  const rows = useMemo(() => buildRows(scenario), [scenario]);
  const totals = useMemo(() => ({
    y1Revenue: rows.reduce((sum, row) => sum + row.revenue[0], 0),
    y2Revenue: rows.reduce((sum, row) => sum + row.revenue[1], 0),
    y3Revenue: rows.reduce((sum, row) => sum + row.revenue[2], 0),
    y1Referrals: rows.reduce((sum, row) => sum + row.referrals[0], 0),
    y2Referrals: rows.reduce((sum, row) => sum + row.referrals[1], 0),
    y3Referrals: rows.reduce((sum, row) => sum + row.referrals[2], 0),
    y1Starts: rows.reduce((sum, row) => sum + row.starts[0], 0),
    y2Starts: rows.reduce((sum, row) => sum + row.starts[1], 0),
    y3Starts: rows.reduce((sum, row) => sum + row.starts[2], 0),
    totalContribution: rows.reduce((sum, row) => sum + row.totalContribution, 0),
  }), [rows]);

  const insightsEngine = useMemo(() => new InsightsEngine(rows, totals), [rows, totals]);
  const insights = useMemo(() => insightsEngine.getAllInsights(), [insightsEngine]);

  return <>
    <header className="head growthHead" style={{ marginBottom: 0, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
      <div>
        <small>Growth Plan</small>
        <h2>{activeTab}</h2>
      </div>
      <div className="row">
        <button onClick={toggle} className="btn" title={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
        <ExportButton targetId="growth-plan-content" filename={`Andwell - ${activeTab}`} />
      </div>
    </header>

    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12, marginTop: 8 }}>
      {TABS.map((tab) => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          className={`btn ${activeTab === tab ? 'primary' : ''}`}
          style={{ fontSize: 11 }}>
          {tab}
        </button>
      ))}
    </nav>

    <div className="row" style={{ marginBottom: 16 }}>
      <button onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }}
        className={`btn ${showScenario ? 'primary' : ''}`}>
        {showScenario ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />} Scenario Model
      </button>
      <button onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }}
        className={`btn ${showCompare ? 'primary' : ''}`}>
        {showCompare ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />} Compare
      </button>
      <button onClick={() => setShowInsights((p) => !p)}
        className={`btn ${showInsights ? 'primary' : ''}`}>
        {showInsights ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />} Insights
      </button>
    </div>

    {showScenario && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        <ScenarioPanel scenario={scenario} setScenario={setScenario} />
        <ScenarioManager />
      </div>
    )}
    {showCompare && (
      <div style={{ marginBottom: 24 }}>
        <ScenarioCompare currentScenario={scenario} />
      </div>
    )}
    {showInsights && (
      <div style={{ marginBottom: 24 }}>
        <InsightsPanel insights={insights} onActionClick={(county: string) => setSelectedCounty(county)} />
      </div>
    )}

    <div id="growth-plan-content" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {activeTab === 'Executive View' && <ExecutiveView rows={rows} totals={totals} apiReports={apiReports} apiCompetitors={apiCompetitors} />}
      {activeTab === 'County Plan' && <CountyPlan rows={rows} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
      {activeTab === 'Referral Plan' && <ReferralPlan rows={rows} />}
      {activeTab === 'Competitive View' && <CompetitiveView selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} apiCompetitors={apiCompetitors} />}
      {activeTab === 'Service Lines' && <ServiceLines />}
      {activeTab === 'CMS Data' && <CmsData />}
      {activeTab === 'Financial Model' && <FinancialModel rows={rows} />}
      {activeTab === 'Staffing Model' && <StaffingModel rows={rows} />}
      {activeTab === 'Sensitivity' && <SensitivityAnalysis rows={rows} />}
      {activeTab === 'Opportunity Score' && <OpportunityScore rows={rows} />}
      {activeTab === 'Launch Timeline' && <LaunchTimeline rows={rows} />}
      {activeTab === 'Board Report' && <BoardReport rows={rows} totals={totals} />}
      {activeTab === 'Launch Checklist' && <LaunchChecklist />}
    </div>
  </>;
}

export function GrowthPlanHub() {
  return <DarkModeProvider><ToastProvider><GrowthPlanDashboard /></ToastProvider></DarkModeProvider>;
}
