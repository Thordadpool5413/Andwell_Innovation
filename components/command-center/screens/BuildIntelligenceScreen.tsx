'use client';

import { AlertTriangle, CheckCircle2, Database, RefreshCcw, UploadCloud } from 'lucide-react';
import type { CommandCenterState } from '../model';
import { userCopy } from '../copy';
import { parseSourceInput, sourcePreview, compactUrl, sanitizeUserFacingError } from '../helpers';
import { Badge, Button, Card, EmptyState, Notice, Progress } from '../ui';

export function BuildIntelligenceScreen({
  state,
  sourceText,
  setSourceText,
  scanBusy,
  scanMessage,
  onScan,
  scanPercent
}: {
  state: CommandCenterState;
  sourceText: string;
  setSourceText: (value: string) => void;
  scanBusy: boolean;
  scanMessage: string;
  onScan: () => void;
  scanPercent: number;
}) {
  const parsed = parseSourceInput(sourceText);
  const preview = sourcePreview(sourceText);
  const invalidCount = preview.filter((item) => !item.valid).length;
  const report = state.currentReport;

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
          {scanMessage ? <Notice title={scanBusy ? 'Intelligence build running' : userCopy.build.processingUpdateTitle} body={scanMessage} tone={scanBusy ? 'blue' : 'amber'} /> : null}
          {!scanMessage && invalidCount ? <Notice title="Some sources need attention" body={`${invalidCount} entr${invalidCount === 1 ? 'y is' : 'ies are'} not a valid public website URL and will be skipped.`} tone="amber" /> : null}
        </Card>

        <Card title="What the intelligence engine builds" action={<Badge tone="green">{userCopy.build.pipelineReady}</Badge>}>
          <div className="cc-step-list">
            {['Reading public sources', 'Extracting service evidence', 'Scrubbing unsupported claims', 'Mapping capability comparison', 'Mapping market opportunity', 'Building field-safe language', 'Preparing strategy, coach, and executive outputs'].map((item, index) => (
              <div key={item} className="cc-step">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          {state.scanStatus ? <ScanLifecycleRail status={state.scanStatus} percent={scanPercent} warnings={state.scanWarnings || []} /> : null}
          <Notice
            title="Output intelligence active"
            body="Source intake builds the Advantage Matrix, Growth Map, Strategy plays, field coaching language, and leadership-ready report in one run."
            tone="green"
          />
        </Card>
      </div>

      {report ? (
        <Card title="Intelligence package created" eyebrow="Build outcome" action={<Badge tone="green">Connected across app</Badge>}>
          <div className="cc-build-complete-grid">
            <article><strong>{report.competitorsAnalyzed}</strong><span>Competitors processed</span></article>
            <article><strong>{report.pagesReviewed}</strong><span>Pages reviewed</span></article>
            <article><strong>{report.serviceLinesMapped}</strong><span>Capabilities mapped</span></article>
            <article><strong>{report.allFindings.length + report.allSubserviceFindings.length}</strong><span>Evidence points</span></article>
          </div>
          <Notice
            title="Outputs are available"
            body="The same intelligence package now feeds the Advantage Matrix, Growth Map, Library, Strategy, Coach, and Executive Report."
            tone="green"
          />
        </Card>
      ) : null}

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
                {source.error ? <small>{sanitizeUserFacingError(source.error)}</small> : null}
                <Progress value={source.qualityScore} tone={source.qualityScore > 70 ? 'green' : source.qualityScore > 35 ? 'amber' : 'red'} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function ScanLifecycleRail({
  status,
  percent,
  warnings
}: {
  status: NonNullable<CommandCenterState['scanStatus']>;
  percent: number;
  warnings: string[];
}) {
  const steps = [
    'Reading public sources',
    'Extracting service evidence',
    'Scrubbing unsupported claims',
    'Mapping capability comparison',
    'Mapping market opportunity',
    'Generating strategy and coaching',
    'Preparing executive output'
  ];
  return (
    <div className="cc-scan-rail">
      <div className="cc-scan-rail-head">
        <strong>{status === 'completed' ? 'Intelligence package ready' : status === 'timed_out' ? 'Partial package created' : status === 'failed' ? 'Build needs attention' : 'Building intelligence package'}</strong>
        <span>{percent}% complete</span>
      </div>
      <Progress value={percent} tone={status === 'failed' ? 'red' : status === 'timed_out' ? 'amber' : 'teal'} />
      <div className="cc-step-list compact">
        {steps.map((item, index) => (
          <div key={item} className="cc-step">
            <span>{index + 1}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
      {warnings.length ? (
        <Notice title="Source processing completed with safeguards" body={warnings[0]} tone="amber" />
      ) : null}
    </div>
  );
}
