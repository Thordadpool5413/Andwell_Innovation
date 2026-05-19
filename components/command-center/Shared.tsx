'use client';

import React from 'react';

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'dark' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}><h3>{title}</h3>{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="metricCard"><p>{label}</p><strong>{value}</strong>{hint ? <span>{hint}</span> : null}</div>;
}

export function TagList({ items }: { items?: string[] }) {
  const safeItems = (items || []).filter(Boolean);
  if (!safeItems.length) return <p className="muted">No items returned yet.</p>;
  return <div className="tagCloud">{safeItems.map((item) => <span key={item}>{item}</span>)}</div>;
}
