import type { CompetitorInput, IntelligenceReport } from '../../lib/types';
import type { AnalyzeHealth, AskResponse, CatalogItem, ReportSummary, RuntimeInfo } from './model';
import { sanitizeUserFacingError } from './helpers';

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

export type ScanLifecycleStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timed_out';

export type ScanLifecycleUpdate = {
  jobId: string;
  status: ScanLifecycleStatus;
  progress: { done: number; total: number };
  warnings: string[];
  errors: string[];
};

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
    throw new ApiError(sanitizeUserFacingError(`service response unavailable ${response.status}`), response.status);
  }

  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(sanitizeUserFacingError(`The server returned malformed JSON from ${url}.`), response.status);
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? String((payload as { error?: unknown }).error)
      : `Request failed with status ${response.status}.`;
    throw new ApiError(sanitizeUserFacingError(message), response.status);
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

export async function runAnalysis(
  competitors: CompetitorInput[],
  maxPagesPerSite = 8,
  onProgress?: (update: ScanLifecycleUpdate) => void
) {
  const start = await apiFetch<{ jobId: string; status: 'queued' | 'running' | 'completed' | 'failed' | 'timed_out' }>('/api/analyze', {
    method: 'POST',
    body: {
      competitors,
      maxPagesPerSite,
      save: true,
      useAI: true
    }
  });
  const startedAt = Date.now();
  const timeoutMs = 240000;
  onProgress?.({
    jobId: start.jobId,
    status: start.status,
    progress: { done: 0, total: competitors.length },
    warnings: [],
    errors: []
  });
  while (Date.now() - startedAt < timeoutMs) {
    const status = await apiFetch<{
      status: 'queued' | 'running' | 'completed' | 'failed' | 'timed_out';
      progress: { done: number; total: number };
      warnings: string[];
      errors: string[];
      report?: IntelligenceReport | null;
    }>(`/api/analyze/status?jobId=${encodeURIComponent(start.jobId)}`);
    onProgress?.({
      jobId: start.jobId,
      status: status.status,
      progress: status.progress,
      warnings: status.warnings || [],
      errors: status.errors || []
    });
    if (status.status === 'completed' || status.status === 'timed_out') {
      if (status.report) return status.report;
      throw new ApiError('The scan completed but report payload is missing.');
    }
    if (status.status === 'failed') {
      throw new ApiError(status.errors[0] || 'Intelligence scan failed.');
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  throw new ApiError('The intelligence scan timed out while waiting for completion.');
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
