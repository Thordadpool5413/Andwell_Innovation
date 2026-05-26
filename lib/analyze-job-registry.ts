import type { AnalyzeJob, IntelligenceReport } from './types';

export type RuntimeAnalyzeJob = AnalyzeJob & {
  report?: IntelligenceReport | null;
};

const registryKey = '__andwellAnalyzeJobRegistry';

function registry() {
  const globalStore = globalThis as typeof globalThis & {
    [registryKey]?: Map<string, RuntimeAnalyzeJob>;
  };
  if (!globalStore[registryKey]) globalStore[registryKey] = new Map<string, RuntimeAnalyzeJob>();
  return globalStore[registryKey];
}

export function setRuntimeAnalyzeJob(job: RuntimeAnalyzeJob) {
  registry().set(job.id, job);
  return job;
}

export function getRuntimeAnalyzeJob(jobId: string) {
  return registry().get(jobId) || null;
}

export function patchRuntimeAnalyzeJob(jobId: string, patch: Partial<RuntimeAnalyzeJob>) {
  const current = getRuntimeAnalyzeJob(jobId);
  if (!current) return null;
  const next = { ...current, ...patch, timing: { ...current.timing, ...(patch.timing || {}) } };
  registry().set(jobId, next);
  return next;
}
