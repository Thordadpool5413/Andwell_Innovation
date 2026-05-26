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
  const status = state.scanStatus || (report ? 'completed' : null);
  const displayPercent = status === 'completed' ? 100 : scanPercent;
  const pipeline = [
    'Read Sources',
    'Extract Evidence',
    'Scrub Claims',
    'Compare Capabilities',
    'Map Opportunity',
    'Generate Strategy',
    'Coach Field Teams',
    'Prepare Report'
  ];

  return (
    <div className="cc-build-page">
      <section className="cc-build-command cc-build-command-single">
        <div className="cc-build-intake">
          <p className="cc-section-label">Source intake</p>
          <h2>Build the next Andwell intelligence package.</h2>
          <p>
            Paste public competitor websites. The system validates URLs, reads public pages, scrubs unsupported
            claims, and creates connected outputs for matrix, map, strategy, coaching, and leadership reporting.
          </p>

          <label className="cc-label" htmlFor="source-text">Public competitor websites</label>
          <textarea
            id="source-text"
            className="cc-textarea cc-build-textarea"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder={'Provider Name | https://www.public-provider.org/services\nProvider Name - https://www.public-provider.org/home-health\nhttps://www.public-provider.org/hospice-care'}
          />

          <div className="cc-build-actions">
            <Button variant="primary" disabled={scanBusy || !parsed.length} onClick={onScan}>
              {scanBusy ? <RefreshCcw size={16} className="cc-spin" /> : <UploadCloud size={16} />}
              {scanBusy ? 'Building Intelligence Package' : 'Build Intelligence Package'}
            </Button>
            <Button onClick={() => setSourceText('')}>Clear Sources</Button>
            <span>{parsed.length} source{parsed.length === 1 ? '' : 's'} selected</span>
          </div>

          {scanMessage ? (
            <Notice
              title={scanBusy ? 'Intelligence build running' : userCopy.build.processingUpdateTitle}
              body={scanMessage}
              tone={scanBusy ? 'blue' : status === 'failed' ? 'red' : 'green'}
            />
          ) : null}
          {!scanMessage && invalidCount ? (
            <Notice
              title="Some sources need a public website address"
              body={`${invalidCount} entr${invalidCount === 1 ? 'y needs' : 'ies need'} a complete public URL before the system can process it.`}
              tone="amber"
            />
          ) : null}

          <section className="cc-build-progress-panel" aria-label="Build intelligence progress">
            <div className="cc-build-progress-head">
              <div>
                <p className="cc-section-label">Package status</p>
                <h3>{status === 'completed' ? 'Intelligence package created' : scanBusy ? 'Building intelligence package' : 'Ready to build from public sources'}</h3>
              </div>
              <Badge tone={status === 'completed' ? 'green' : scanBusy ? 'blue' : 'teal'}>
                {status === 'completed' ? 'Connected across app' : scanBusy ? `${displayPercent}%` : `${parsed.length} selected`}
              </Badge>
            </div>
            <Progress value={displayPercent} tone={status === 'failed' ? 'red' : status === 'timed_out' ? 'amber' : 'teal'} />
            <div className="cc-build-pipeline">
              {pipeline.map((step, index) => {
                const completed = status === 'completed' || displayPercent >= ((index + 1) / pipeline.length) * 100;
                return (
                  <div key={step} className={completed ? 'is-done' : ''}>
                    <CheckCircle2 size={15} />
                    <span>{step}</span>
                    <small>{completed ? 'Completed' : scanBusy ? 'Queued' : 'Ready'}</small>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>

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

      <Card title="Source validation" action={<Badge tone={preview.length ? 'blue' : 'slate'}>{preview.length} entered</Badge>}>
        {preview.length ? (
          <div className="cc-source-grid">
            {preview.map((competitor, index) => (
              <div key={`${competitor.raw}-${index}`} className={`cc-source-card ${competitor.valid ? 'valid' : 'invalid'}`}>
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
        <Card title="Latest package source health" action={<Badge tone="blue">{state.currentReport.sourceHealth.length} checked</Badge>}>
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
