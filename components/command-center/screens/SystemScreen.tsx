'use client';

import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { CommandCenterState } from '../model';
import { Card, Metric, formatDate } from '../ui';

export function SystemScreenView({ state }: { state: CommandCenterState }) {
  const serviceRows = [
    { key: 'reports', label: 'Reports service' },
    { key: 'competitors', label: 'Competitor service' },
    { key: 'catalog', label: 'Catalog service' },
    { key: 'analyze', label: 'Analysis service' },
    { key: 'runtime', label: 'Runtime service' }
  ] as const;
  const hasIssues = serviceRows.some((row) => state.serviceHealth[row.key].status !== 'ok');
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
      <Card title="Service status" eyebrow="Startup diagnostics">
        <div className="cc-list">
          {serviceRows.map((row) => {
            const item = state.serviceHealth[row.key];
            return (
              <div className="cc-list-item" key={row.key}>
                <strong>{row.label}</strong>
                <p>
                  {item.status === 'ok' ? 'Healthy' : item.status === 'down' ? 'Down' : 'Degraded'}
                  {item.httpStatus ? ` | HTTP ${item.httpStatus}` : ''}
                  {item.checkedAt ? ` | Checked ${formatDate(item.checkedAt)}` : ''}
                  {item.lastError ? ` | ${item.lastError}` : ''}
                </p>
              </div>
            );
          })}
        </div>
        {!hasIssues ? <p className="cc-inline-note">All startup services are healthy.</p> : null}
      </Card>
    </div>
  );
}
