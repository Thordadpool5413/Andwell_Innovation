import type { CompetitorInput, IntelligenceReport } from '../../lib/types';
import type { AnalyzeHealth, AskResponse, CatalogItem, ReportSummary, RuntimeInfo } from './model';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiFetch<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!contentType.includes('application/json')) {
    const preview = text.trim().slice(0, 160);
    throw new ApiError(`The server returned ${response.status} ${response.statusText || ''} but not JSON. Preview: ${preview || 'empty response'}`, response.status);
  }

  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(`The server returned malformed JSON from ${url}.`, response.status);
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? String((payload as { error?: unknown }).error)
      : `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function fetchReports() {
  return apiFetch<{ reports: ReportSummary[] }>('/api/reports');
}

export async function fetchReport(id: string) {
  return apiFetch<{ report: IntelligenceReport }>(`/api/reports?id=${encodeURIComponent(id)}`);
}

export async function fetchCompetitors() {
  return apiFetch<{ competitors: CompetitorInput[] }>('/api/competitors');
}

export async function fetchCatalog() {
  return apiFetch<{ catalog: CatalogItem[]; overrides: unknown[] }>('/api/catalog');
}

export async function fetchAnalyzeHealth() {
  return apiFetch<AnalyzeHealth>('/api/analyze');
}

export async function fetchRuntime() {
  return apiFetch<RuntimeInfo>('/api/runtime');
}

export async function runAnalysis(competitors: CompetitorInput[], maxPagesPerSite = 8) {
  return apiFetch<IntelligenceReport>('/api/analyze', {
    method: 'POST',
    body: {
      competitors,
      maxPagesPerSite,
      save: true,
      useAI: true
    }
  });
}

export async function deleteCompetitor(url: string) {
  return apiFetch<{ competitors: CompetitorInput[] }>('/api/competitors', {
    method: 'DELETE',
    body: { url }
  });
}

export async function askHub(question: string, reportId?: string) {
  return apiFetch<AskResponse>('/api/ask', {
    method: 'POST',
    body: { question, reportId }
  });
}
