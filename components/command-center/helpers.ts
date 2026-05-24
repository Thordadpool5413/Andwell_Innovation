import type { CompetitorInput, IntelligenceReport } from '../../lib/types';
import { validatePublicHttpUrl } from '../../lib/url-safety';
import type { ReviewableFinding, SourcePreviewItem } from './model';
import { userCopy } from './copy';

export function parseSourceInput(value: string): CompetitorInput[] {
  return sourcePreview(value)
    .filter((item) => item.valid && item.url)
    .map((item) => ({ url: item.url as string }));
}

export function sourcePreview(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 25)
    .map((entry): SourcePreviewItem => {
      const result = validatePublicHttpUrl(entry);
      if (!result.ok || !result.url) {
        return {
          raw: entry,
          input: entry,
          url: result.url,
          host: result.host,
          valid: false,
          status: 'rejected',
          reason: result.reason,
          qualityScore: 0
        };
      }
      if (seen.has(result.url)) {
        return {
          raw: entry,
          input: entry,
          url: result.url,
          host: result.host,
          valid: false,
          status: 'duplicate',
          reason: 'Duplicate source skipped.',
          qualityScore: 35
        };
      }
      seen.add(result.url);
      return {
        raw: entry,
        input: entry,
        url: result.url,
        host: result.host,
        valid: true,
        status: 'accepted',
        reason: result.reason,
        qualityScore: result.url.startsWith('https://') ? 72 : 62
      };
    });
}

export function toReviewable(report: IntelligenceReport | null): ReviewableFinding[] {
  if (!report) return [];
  const serviceItems: ReviewableFinding[] = report.allFindings.map((item) => ({
    ...item,
    kind: 'service'
  }));
  const subserviceItems: ReviewableFinding[] = report.allSubserviceFindings.map((item) => ({
    ...item,
    kind: 'subservice'
  }));
  return [...serviceItems, ...subserviceItems];
}

export function toneForStatus(status: string): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  if (status.includes('Approved') || status.includes('Sales usable') || status.includes('Clearly offered')) return 'green';
  if (status.includes('review') || status.includes('suggested') || status.includes('Mentioned')) return 'amber';
  if (status.includes('Rejected') || status.includes('Not found')) return 'red';
  if (status.includes('Related') || status.includes('Unclear')) return 'blue';
  return 'slate';
}

export function compactUrl(url?: string) {
  if (!url) return 'No source URL';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

export function scrubOutputText(value?: string) {
  return value || '';
}

export function displayStatus(value: string) {
  if (value === 'Approved for sales use') return 'Sales usable with evidence';
  if (value === 'Manager review suggested') return 'Guarded language';
  if (value === 'Needs human review') return 'Evidence limited';
  if (value === 'Needs review') return 'Evidence limited';
  return scrubOutputText(value);
}

export function currentNextAction(hasReport: boolean) {
  if (!hasReport) return 'Ready for source intelligence. Enter public sources and build the first intelligence package.';
  return 'Intelligence engine active. Source evidence is connected into matrix, growth map, strategy, coaching, and executive outputs.';
}

export function scanProgressPercent(done = 0, total = 0) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function sanitizeUserFacingError(message?: string) {
  const raw = (message || '').trim();
  if (!raw) return userCopy.build.unavailable;
  const lower = raw.toLowerCase();
  if (lower.includes('enoent') || lower.includes('/var/task') || lower.includes('mkdir') || lower.includes('.data')) {
    return userCopy.build.storageTemporary;
  }
  if (lower.includes('not json') || lower.includes('preview:') || lower.includes('gateway') || lower.includes('timeout')) {
    return userCopy.build.delayed;
  }
  if (lower.includes('500') || lower.includes('503') || lower.includes('504')) {
    return userCopy.build.unavailable;
  }
  return raw.replace(/\/var\/task\/\.data/gi, 'storage path');
}
