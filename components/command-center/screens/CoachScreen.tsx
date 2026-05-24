'use client';

import { RefreshCcw, Send, Sparkles } from 'lucide-react';
import type { AdvantageMatrix, GrowthMap } from '../../../lib/intelligence-views';
import type { IntelligenceReport } from '../../../lib/types';
import type { AskResponse } from '../model';
import { displayStatus, scrubOutputText, toneForStatus } from '../helpers';
import { Badge, Button, Card, Notice } from '../ui';

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
  const starters = ['What should I say to a referral source?', 'What differentiates Andwell here?', 'Where should Andwell focus growth?', 'What source evidence supports this?'];
  return (
    <div className="cc-stack">
      <Card title="AI Intelligence Coach" action={<Badge tone={report ? 'green' : 'amber'}>{report ? 'Evidence package loaded' : 'Coach engine ready'}</Badge>}>
        <div className="cc-coach-intro"><Sparkles size={20} /><div><strong>Ask from stored evidence only.</strong><p>The coach answers from the latest report and keeps language inside safe guardrails.</p></div></div>
        <div className="cc-prompt-row">{starters.map((starter) => <button key={starter} type="button" onClick={() => setQuestion(starter)}>{starter}</button>)}</div>
        <textarea className="cc-textarea compact" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask the system..." />
        <div className="cc-action-row">
          <Button variant="primary" disabled={askBusy || !question.trim() || !report} onClick={onAsk}>{askBusy ? <RefreshCcw size={16} className="cc-spin" /> : <Send size={16} />} Ask AI Coach</Button>
        </div>
        <Notice title="Evidence intelligence ready" body={report ? `Answers use stored evidence plus ${matrix.summary.capabilitiesMapped} capability signals and ${growthMap.areas.length} market areas.` : 'Build intelligence from public sources first.'} tone={report ? 'blue' : 'amber'} />
      </Card>
      {askResponse ? <Card title="Coach answer" action={<Badge tone={toneForStatus(askResponse.confidence)}>{displayStatus(askResponse.confidence)}</Badge>}><p className="cc-answer">{scrubOutputText(askResponse.answer)}</p></Card> : null}
    </div>
  );
}
