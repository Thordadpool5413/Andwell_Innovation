import type { CompetitorInput, IntelligenceReport } from '../../lib/types';
import { validatePublicHttpUrl } from '../../lib/url-safety';
import type { ReviewableFinding, SourcePreviewItem } from './model';
import { userCopy } from './copy';

export function parseSourceInput(value: string): CompetitorInput[] {
  return sourcePreview(value)
    .filter((item) => item.valid && item.url)
    .map((item) => ({ name: item.name, url: item.url as string }));
}

function cleanCandidateUrl(value: string) {
  return value
    .trim()
    .replace(/[)\].,;]+$/g, '')
    .replace(/^[(\[]+/g, '');
}

function extractSourceCandidate(entry: string) {
  const explicitUrl = entry.match(/https?:\/\/[^\s|<>"']+/i)?.[0];
  if (explicitUrl) return cleanCandidateUrl(explicitUrl);

  const webUrl = entry.match(/\bwww\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\/[^\s|<>"']*)?/i)?.[0];
  if (webUrl) return cleanCandidateUrl(webUrl);

  const domainUrl = entry.match(/\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s|<>"']*)?/i)?.[0];
  if (domainUrl) return cleanCandidateUrl(domainUrl);

  return '';
}

function hasSourceCandidate(entry: string) {
  return Boolean(extractSourceCandidate(entry));
}

function sourceEntries(value: string) {
  const explicitOrDomain = /(?:https?:\/\/[^\s|<>"']+|www\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\/[^\s|<>"']*)?|\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s|<>"']*)?)/gi;
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const entries: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const entry = lines[index];
    const next = lines[index + 1];

    if (!hasSourceCandidate(entry) && next && hasSourceCandidate(next)) {
      entries.push(`${entry} | ${next}`);
      index += 1;
      continue;
    }

    const matches = [...entry.matchAll(explicitOrDomain)].map((match) => cleanCandidateUrl(match[0]));
    if (matches.length > 1) entries.push(...matches);
    else entries.push(entry);
  }

  return entries
    .flatMap((entry) => {
      if (!entry) return [];
      const matches = [...entry.matchAll(explicitOrDomain)].map((match) => cleanCandidateUrl(match[0]));
      return matches.length > 1 ? matches : [entry];
    })
    .filter(Boolean);
}

function extractSourceName(entry: string, url: string) {
  const index = entry.toLowerCase().indexOf(url.toLowerCase());
  if (index <= 0) return undefined;
  const beforeUrl = entry.slice(0, index).replace(/[|\-–—:]+$/g, '').trim();
  return beforeUrl || undefined;
}

export function sourcePreview(value: string) {
  const seen = new Set<string>();
  return sourceEntries(value)
    .slice(0, 25)
    .map((entry): SourcePreviewItem => {
      const candidate = extractSourceCandidate(entry);
      const displayInput = candidate || entry;
      const result = validatePublicHttpUrl(candidate || entry);
      if (!result.ok || !result.url) {
        return {
          raw: entry,
          input: displayInput,
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
        input: candidate,
        name: extractSourceName(entry, candidate),
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
