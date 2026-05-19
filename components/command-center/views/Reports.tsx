'use client';

import React from 'react';
import { Badge, Panel } from '../Shared';
import type { ReportSummary } from '../../../lib/command-center/types';
import type { IntelligenceReport } from '../../../lib/types';

export function Reports({ reports, currentReport, loadReport, exportJson, refreshServerState, busy }: { reports: ReportSummary[]; currentReport: IntelligenceReport | null; loadReport: (id: string) => void; exportJson: () => void; refreshServerState: () => void; busy: boolean }) {
  return <><section className="section"><div><h1>Reports</h1><p>Stored server side reports and exportable intelligence summaries.</p></div><div className="row"><button className="btn" disabled={busy} onClick={refreshServerState}>Load reports</button><button className="btn" disabled={!currentReport} onClick={exportJson}>Export current JSON</button></div></section><div className="grid">{reports.map((report) => <Panel key={report.id} title={report.competitors?.join(', ') || 'Stored report'}><p>{new Date(report.generatedAt).toLocaleString()} | {report.pagesReviewed} pages | {report.humanReviewItems} review items</p><p>{report.executiveSummary}</p><button className="btn primary" disabled={busy} onClick={() => loadReport(report.id)}>Load report</button></Panel>)}</div></>;
}
