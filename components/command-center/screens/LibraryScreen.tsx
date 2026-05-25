'use client';

import { Database, Search } from 'lucide-react';
import type { CompetitorInput } from '../../../lib/types';
import type { ReviewableFinding } from '../model';
import { compactUrl, displayStatus, scrubOutputText, toneForStatus } from '../helpers';
import { Badge, Button, Card, EmptyState } from '../ui';

export function LibraryScreenView({
  approvedItems,
  allApprovedCount,
  search,
  setSearch,
  competitors,
  onDelete,
  onBuild
}: {
  approvedItems: ReviewableFinding[];
  allApprovedCount: number;
  search: string;
  setSearch: (value: string) => void;
  competitors: CompetitorInput[];
  onDelete: (url: string) => void;
  onBuild: () => void;
}) {
  return (
    <div className="cc-stack">
      <Card title="Built intelligence outputs" action={<Badge tone="green">{allApprovedCount} built</Badge>}>
        <div className="cc-search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competitor, service, evidence, or safe wording" />
        </div>
        {approvedItems.length ? (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr><th>Competitor</th><th>Service</th><th>Status</th><th>Confidence</th><th>Evidence</th><th>Safe wording</th></tr>
              </thead>
              <tbody>
                {approvedItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.competitorName}</td>
                    <td><strong>{item.serviceLine}</strong>{'subservice' in item ? <span>{item.subservice}</span> : null}</td>
                    <td><Badge tone={toneForStatus(item.competitorStatus)}>{displayStatus(item.competitorStatus)}</Badge></td>
                    <td>{displayStatus(item.confidence)}</td>
                    <td><Badge tone={item.evidenceStrength === 'Strong' ? 'green' : item.evidenceStrength === 'Moderate' ? 'blue' : item.evidenceStrength === 'Weak' ? 'amber' : 'red'}>{item.evidenceStrength || 'Evidence governed'}</Badge></td>
                    <td>{scrubOutputText(item.safeSalesWording)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Built outputs ready to generate" body="Enter public sources and build intelligence to create trusted outputs, source-based guidance, and strategy signals." action={<Button onClick={onBuild}>Build Andwell Intelligence</Button>} />}
      </Card>

      <Card title="Competitor sources" action={<Badge tone="blue">{competitors.length} stored</Badge>}>
        {competitors.length ? (
          <div className="cc-source-grid">
            {competitors.map((competitor) => (
              <div key={competitor.url} className="cc-source-card">
                <Database size={18} />
                <strong>{competitor.name || compactUrl(competitor.url)}</strong>
                <span>{compactUrl(competitor.url)}</span>
                <Button variant="danger" onClick={() => onDelete(competitor.url)}>Delete</Button>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Source library ready" body="Competitor sources appear here after source intake and intelligence builds." />}
      </Card>
    </div>
  );
}
