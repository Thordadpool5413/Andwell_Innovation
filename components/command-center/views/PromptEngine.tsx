'use client';

import React from 'react';
import { Badge, Panel } from '../Shared';
import { expertPromptModules, fullCompetitiveIntelligenceInstruction } from '../../../lib/expert-prompts';

export function PromptEngine() {
  return <><section className="section"><div><h1>Methodology</h1><p>The governed instruction layer for healthcare competitive intelligence, service extraction, sales positioning, and review governance.</p></div><Badge tone="blue">Governed intelligence</Badge></section><Panel title="Master Intelligence Instruction" className="featurePanel"><p>{fullCompetitiveIntelligenceInstruction}</p></Panel><div className="grid cols2">{expertPromptModules.map((module) => <div className="promptCard" key={module.id}><Badge tone="dark">{module.id}</Badge><h3>{module.title}</h3><p>{module.purpose}</p><div className="promptBlock"><strong>Instructions</strong>{module.instructions.map((item) => <span key={item}>{item}</span>)}</div><div className="promptBlock output"><strong>Required output</strong>{module.requiredOutput.map((item) => <span key={item}>{item}</span>)}</div></div>)}</div></>;
}
