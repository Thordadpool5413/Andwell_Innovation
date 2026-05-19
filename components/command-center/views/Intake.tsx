'use client';

import React from 'react';
import { Badge, Panel } from '../Shared';
import type { CompetitorInput } from '../../../lib/types';

export function Intake({ competitors, setCompetitors, urlInput, setUrlInput, addUrls, saveCompetitors, runAnalysis, busy }: { competitors: CompetitorInput[]; setCompetitors: (items: CompetitorInput[]) => void; urlInput: string; setUrlInput: (value: string) => void; addUrls: () => void; saveCompetitors: () => void; runAnalysis: () => void; busy: boolean }) {
  return <><section className="section"><div><h1>Competitor Intake</h1><p>Paste up to 25 competitor websites. The backend validates public URLs, crawls high value pages, applies rule based analysis, then uses OpenAI extraction when configured.</p></div><Badge>{competitors.length} of 25 selected</Badge></section><Panel title="Add Competitor URLs"><textarea className="textarea largeInput" value={urlInput} onChange={(event) => setUrlInput(event.target.value)} placeholder="https://competitorone.org\nhttps://competitortwo.org" /><div className="row"><button className="btn" onClick={addUrls}>Add URLs</button><button className="btn" disabled={busy} onClick={saveCompetitors}>Save library</button><button className="btn primary" disabled={busy} onClick={runAnalysis}>{busy ? 'Running competitive scan' : 'Run Competitive Scan'}</button></div></Panel><div className="grid cols2">{competitors.map((competitor, index) => <Panel key={`${competitor.url}${index}`} title={competitor.name || 'Competitor'}><p>{competitor.url}</p><Badge>{competitor.market || 'Needs review'}</Badge><br /><button className="btn danger" onClick={() => setCompetitors(competitors.filter((_, i) => i !== index))}>Remove</button></Panel>)}</div></>;
}
