'use client';

import { MessageSquareText, RefreshCcw, Send, ShieldCheck, Sparkles } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import type { AskResponse } from '../model';
import { displayStatus, scrubOutputText, toneForStatus } from '../helpers';
import { Badge, Button, Notice } from '../ui';

function answerSections(answer: string) {
  const labels = ['Direct answer', 'Evidence basis', 'Capability comparison', 'Geographic signal', 'Safe language', 'Recommended next move'];
  const clean = scrubOutputText(answer).replace(/\s+/g, ' ').trim();
  const matches = labels
    .map((label) => {
      const match = new RegExp(`${label}:`, 'i').exec(clean);
      return match ? { label, index: match.index, end: match.index + match[0].length } : null;
    })
    .filter(Boolean) as { label: string; index: number; end: number }[];

  if (matches.length >= 2) {
    return labels.map((label) => {
      const current = matches.find((item) => item.label === label);
      if (!current) return '';
      const next = matches.filter((item) => item.index > current.index).sort((a, b) => a.index - b.index)[0];
      return clean.slice(current.end, next?.index ?? clean.length).trim();
    }).map((section, index) => compactCoachSection(section || fallbackCoachSection(index), index));
  }

  const lines = scrubOutputText(answer).split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 4) return labels.map((_, index) => compactCoachSection(lines[index] || fallbackCoachSection(index), index));
  return [
    compactCoachSection(clean || 'Build intelligence to give the coach an evidence package.', 0),
    fallbackCoachSection(1),
    fallbackCoachSection(2),
    fallbackCoachSection(3),
    fallbackCoachSection(4),
    fallbackCoachSection(5)
  ];
}

function compactCoachSection(value: string, index: number) {
  const max = index === 1 ? 520 : 300;
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}...` : clean;
}

function fallbackCoachSection(index: number) {
  return [
    'Build intelligence to give the coach an evidence package.',
    'Answers are grounded in the latest stored report.',
    'The system uses Advantage Matrix signals when available.',
    'The system uses Growth Map areas when available.',
    'Keep claims source-backed and guarded where evidence is limited.',
    'Add public sources or use the latest output package.'
  ][index] || 'Use the latest intelligence package.';
}

export function CoachScreenView({
  report,
  question,
  setQuestion,
  askBusy,
  askResponse,
  onAsk,
  matrix,
  growthMap
}: {
  report: IntelligenceReport | null;
  question: string;
  setQuestion: (value: string) => void;
  askBusy: boolean;
  askResponse: AskResponse | null;
  onAsk: () => void;
  matrix: AdvantageMatrix;
  growthMap: GrowthMap;
}) {
  const starters = [
    'What should I say to a referral source?',
    'What differentiates Andwell here?',
    'Where should Andwell focus growth?',
    'Where is the market most saturated?',
    'What is the safest growth angle?',
    'What should leadership know?',
    'What source evidence supports this?',
    'What should we avoid saying?'
  ];
  const sections = askResponse ? answerSections(askResponse.answer) : [];
  return (
    <div className="cc-workspace cc-coach-workspace">
      <section className="cc-workspace-hero">
        <div>
          <p className="cc-section-label">Ask the system</p>
          <h2>AI Intelligence Coach</h2>
          <p>Ask for referral language, differentiation, growth focus, evidence basis, leadership implications, and safe next moves from the latest intelligence package.</p>
        </div>
        <div className="cc-workspace-stats">
          <article><strong>{report ? 'Loaded' : 'Ready'}</strong><span>Evidence package</span></article>
          <article><strong>{matrix.summary.capabilitiesMapped}</strong><span>Capability signals</span></article>
          <article><strong>{growthMap.areas.length}</strong><span>Market areas</span></article>
          <article><strong>Active</strong><span>Language rules</span></article>
        </div>
      </section>

      <section className="cc-workspace-grid cc-workspace-grid-detail">
        <div className="cc-feature-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Expert question builder</p>
              <h3>Ask from stored evidence</h3>
            </div>
            <Badge tone={report ? 'green' : 'amber'}>{report ? 'Evidence package loaded' : 'Build package first'}</Badge>
          </div>
          <div className="cc-prompt-grid">
            {starters.map((starter) => <button key={starter} type="button" onClick={() => setQuestion(starter)}>{starter}</button>)}
          </div>
          <textarea className="cc-textarea cc-coach-textarea" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask the system..." />
          <div className="cc-build-actions">
            <Button variant="primary" disabled={askBusy || !question.trim() || !report} onClick={onAsk}>{askBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Send size={16} />} Ask the System</Button>
          </div>
          <Notice title="Evidence intelligence ready" body={report ? `Answers use stored evidence plus ${matrix.summary.capabilitiesMapped} capability signals and ${growthMap.areas.length} market areas.` : 'Build intelligence from public sources first.'} tone={report ? 'blue' : 'amber'} />
        </div>

        <aside className="cc-dark-panel cc-detail-panel">
          <p className="cc-section-label">Coach guardrails</p>
          <h3>How answers are structured</h3>
          <div className="cc-dark-list">
            {['Direct answer', 'Evidence basis', 'Capability comparison', 'Geographic signal', 'Safe language', 'Recommended next move'].map((item) => (
              <article key={item}><ShieldCheck size={17} /><strong>{item}</strong><p>The coach keeps guidance practical, evidence based, and field safe.</p></article>
            ))}
          </div>
        </aside>
      </section>

      {askResponse ? (
        <section className="cc-feature-panel">
          <div className="cc-panel-head">
            <div>
              <p className="cc-section-label">Coach answer</p>
              <h3>Source-backed advisor response</h3>
            </div>
            <Badge tone={toneForStatus(askResponse.confidence)}>{displayStatus(askResponse.confidence)}</Badge>
          </div>
          <div className="cc-answer-grid">
            {sections.map((section, index) => (
              <article key={`${section}-${index}`}>
                {index === 0 ? <Sparkles size={18} /> : <MessageSquareText size={18} />}
                <strong>{['Direct answer', 'Evidence basis', 'Capability comparison', 'Geographic signal', 'Safe language', 'Recommended next move'][index] || 'Advisor note'}</strong>
                <p>{section.replace(/^(direct answer|evidence basis|capability comparison|geographic signal|safe language|recommended next move):\s*/i, '')}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
