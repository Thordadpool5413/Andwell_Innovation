import { mkdir, readFile, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import type { Collection } from 'mongodb';
import { getMongoDb, isMongoConfigured } from './mongodb';
import { materializeReportIntelligence } from './report-materialization';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import type {
  AnalyzeJob,
  CompetitorInput,
  EvidenceItem,
  IntelligenceReport,
  MarketSignal,
  PackageMetrics,
  ReviewStatus,
  SourceSnapshot
} from './types';

export type StoredReview = {
  id: string;
  findingId: string;
  status: ReviewStatus | 'Needs edits';
  note?: string;
  reviewer?: string;
  updatedAt: string;
};

export type CatalogOverride = {
  serviceLine: string;
  description?: string;
  safeLanguage?: string;
  avoid?: string;
  internalNotes?: string;
  approvalStatus?: 'Draft' | 'Needs review' | 'Approved' | 'Retired' | 'Do not show to sales';
  updatedAt: string;
};

export type HubStore = {
  version: number;
  updatedAt: string;
  competitors: CompetitorInput[];
  reports: IntelligenceReport[];
  scanJobs: AnalyzeJob[];
  reviews: StoredReview[];
  catalogOverrides: CatalogOverride[];
  evidenceItems: EvidenceItem[];
  sourceSnapshots: SourceSnapshot[];
  packageMetrics: PackageMetrics[];
  marketSignals: MarketSignal[];
};

function cleanEnvValue(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, '');
}

const configuredDataDir = cleanEnvValue(process.env.CIH_DATA_DIR) || '';
const configuredStoreFile = cleanEnvValue(process.env.CIH_STORE_FILE) || '';
let mongoUnavailable = false;
let supabaseUnavailable = false;
let resolvedStoreFile: string | null = null;
let jsonUnavailable = false;
let memoryStore: HubStore | null = null;

const emptyStore = (): HubStore => ({
  version: 4,
  updatedAt: new Date().toISOString(),
  competitors: [],
  reports: [],
  scanJobs: [],
  reviews: [],
  catalogOverrides: [],
  evidenceItems: [],
  sourceSnapshots: [],
  packageMetrics: [],
  marketSignals: []
});

function candidateStoreFiles() {
  const candidates: string[] = [];
  if (configuredStoreFile) candidates.push(configuredStoreFile);
  if (configuredDataDir) candidates.push(path.join(configuredDataDir, 'competitive-intelligence-hub.json'));
  candidates.push(path.join(process.cwd(), '.data', 'competitive-intelligence-hub.json'));
  candidates.push(path.join(os.tmpdir(), 'andwell-intelligence', 'competitive-intelligence-hub.json'));
  return [...new Set(candidates)];
}

async function resolveStoreFile() {
  if (resolvedStoreFile) return resolvedStoreFile;
  const candidates = candidateStoreFiles();
  for (const candidate of candidates) {
    try {
      const dir = path.dirname(candidate);
      await mkdir(dir, { recursive: true });
      const probe = path.join(dir, '.write-probe');
      await writeFile(probe, `${Date.now()}`, 'utf8');
      resolvedStoreFile = candidate;
      return candidate;
    } catch {
      // try next candidate
    }
  }
  jsonUnavailable = true;
  throw new Error('Local persistence directory is not writable.');
}

async function collection<T extends object>(name: string): Promise<Collection<T>> {
  const db = await getMongoDb();
  return db.collection<T>(name);
}

async function mongoReadStore(): Promise<HubStore> {
  const [competitors, reports, scanJobs, reviews, catalogOverrides, evidenceItems, sourceSnapshots, packageMetrics, marketSignals] = await Promise.all([
    collection<CompetitorInput>('competitors').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray()),
    collection<IntelligenceReport>('reports').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ generatedAt: -1 }).limit(100).toArray()),
    collection<AnalyzeJob>('scanJobs').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(1000).toArray()),
    collection<StoredReview>('reviews').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).limit(10000).toArray()),
    collection<CatalogOverride>('catalogOverrides').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ serviceLine: 1 }).toArray()),
    collection<EvidenceItem>('evidenceItems').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ generatedAt: -1 }).limit(20000).toArray()),
    collection<SourceSnapshot>('sourceSnapshots').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ capturedAt: -1 }).limit(10000).toArray()),
    collection<PackageMetrics>('packageMetrics').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ generatedAt: -1 }).limit(1000).toArray()),
    collection<MarketSignal>('marketSignals').then((col) => col.find({}, { projection: { _id: 0 } }).sort({ generatedAt: -1 }).limit(10000).toArray())
  ]);

  return {
    ...emptyStore(),
    updatedAt: new Date().toISOString(),
    competitors,
    reports,
    scanJobs,
    reviews,
    catalogOverrides,
    evidenceItems,
    sourceSnapshots,
    packageMetrics,
    marketSignals
  };
}

function assertSupabase(action: string, error: { message: string } | null) {
  if (error) throw new Error(`Supabase ${action} failed: ${error.message}`);
}

async function optionalSupabasePayloadList<T>(table: string, orderColumn: string, limit: number): Promise<T[]> {
  try {
    const result = await getSupabaseClient().from(table).select('payload').order(orderColumn, { ascending: false }).limit(limit);
    if (result.error) {
      console.warn(`Optional Supabase table ${table} is unavailable: ${result.error.message}`);
      return [];
    }
    return (result.data || []).map((row) => row.payload as T);
  } catch (error) {
    console.warn(`Optional Supabase table ${table} could not be read.`, error);
    return [];
  }
}

async function supabaseReadStore(): Promise<HubStore> {
  const supabase = getSupabaseClient();
  const [
    competitorsResult,
    reportsResult,
    scanJobsResult,
    reviewsResult,
    catalogResult,
    evidenceItems,
    sourceSnapshots,
    packageMetrics,
    marketSignals
  ] = await Promise.all([
    supabase.from('cih_competitors').select('payload').order('name', { ascending: true }).limit(500),
    supabase.from('cih_reports').select('payload').order('generated_at', { ascending: false }).limit(100),
    supabase.from('cih_scan_jobs').select('payload').order('created_at', { ascending: false }).limit(1000),
    supabase.from('cih_reviews').select('payload').order('updated_at', { ascending: false }).limit(10000),
    supabase.from('cih_catalog_overrides').select('payload').order('service_line', { ascending: true }),
    optionalSupabasePayloadList<EvidenceItem>('cih_evidence_items', 'generated_at', 20000),
    optionalSupabasePayloadList<SourceSnapshot>('cih_source_snapshots', 'captured_at', 10000),
    optionalSupabasePayloadList<PackageMetrics>('cih_package_metrics', 'generated_at', 1000),
    optionalSupabasePayloadList<MarketSignal>('cih_market_signals', 'generated_at', 10000)
  ]);

  assertSupabase('read competitors', competitorsResult.error);
  assertSupabase('read reports', reportsResult.error);
  assertSupabase('read scan jobs', scanJobsResult.error);
  assertSupabase('read reviews', reviewsResult.error);
  assertSupabase('read catalog overrides', catalogResult.error);

  return {
    ...emptyStore(),
    updatedAt: new Date().toISOString(),
    competitors: (competitorsResult.data || []).map((row) => row.payload as CompetitorInput),
    reports: (reportsResult.data || []).map((row) => row.payload as IntelligenceReport),
    scanJobs: (scanJobsResult.data || []).map((row) => row.payload as AnalyzeJob),
    reviews: (reviewsResult.data || []).map((row) => row.payload as StoredReview),
    catalogOverrides: (catalogResult.data || []).map((row) => row.payload as CatalogOverride),
    evidenceItems,
    sourceSnapshots,
    packageMetrics,
    marketSignals
  };
}

async function jsonReadStore(): Promise<HubStore> {
  if (jsonUnavailable) {
    if (!memoryStore) memoryStore = emptyStore();
    return { ...memoryStore };
  }
  const storeFile = await resolveStoreFile();
  try {
    const raw = await readFile(storeFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<HubStore>;
    return {
      ...emptyStore(),
      ...parsed,
      competitors: parsed.competitors || [],
      reports: parsed.reports || [],
      scanJobs: parsed.scanJobs || [],
      reviews: parsed.reviews || [],
      catalogOverrides: parsed.catalogOverrides || [],
      evidenceItems: parsed.evidenceItems || [],
      sourceSnapshots: parsed.sourceSnapshots || [],
      packageMetrics: parsed.packageMetrics || [],
      marketSignals: parsed.marketSignals || []
    };
  } catch {
    const initial = emptyStore();
    await jsonWriteStore(initial);
    return initial;
  }
}

async function jsonWriteStore(store: HubStore) {
  if (jsonUnavailable) {
    memoryStore = { ...store, updatedAt: new Date().toISOString() };
    return memoryStore;
  }
  const storeFile = await resolveStoreFile();
  const next = { ...store, updatedAt: new Date().toISOString() };
  try {
    await writeFile(storeFile, JSON.stringify(next, null, 2), 'utf8');
  } catch {
    jsonUnavailable = true;
    memoryStore = next;
    return memoryStore;
  }
  return next;
}

function logPersistenceFallback(provider: string, error: unknown) {
  console.error(`${provider} persistence failed. Falling back to local JSON storage.`, error);
}

export async function readStore(): Promise<HubStore> {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      return await supabaseReadStore();
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      return await mongoReadStore();
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  return jsonReadStore();
}

export async function writeStore(store: HubStore) {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    console.warn('Full-store Supabase overwrite is disabled. Use targeted saveCompetitors, saveReport, saveReview, or saveCatalogOverride instead. Writing local JSON fallback only.');
    return jsonWriteStore(store);
  }

  if (!isMongoConfigured() || mongoUnavailable) return jsonWriteStore(store);

  try {
    const [competitorsCol, reportsCol, scanJobsCol, reviewsCol, catalogCol, evidenceCol, snapshotsCol, metricsCol, marketCol] = await Promise.all([
      collection<CompetitorInput>('competitors'),
      collection<IntelligenceReport>('reports'),
      collection<AnalyzeJob>('scanJobs'),
      collection<StoredReview>('reviews'),
      collection<CatalogOverride>('catalogOverrides'),
      collection<EvidenceItem>('evidenceItems'),
      collection<SourceSnapshot>('sourceSnapshots'),
      collection<PackageMetrics>('packageMetrics'),
      collection<MarketSignal>('marketSignals')
    ]);

    await Promise.all([
      competitorsCol.deleteMany({}),
      reportsCol.deleteMany({}),
      scanJobsCol.deleteMany({}),
      reviewsCol.deleteMany({}),
      catalogCol.deleteMany({}),
      evidenceCol.deleteMany({}),
      snapshotsCol.deleteMany({}),
      metricsCol.deleteMany({}),
      marketCol.deleteMany({})
    ]);

    await Promise.all([
      store.competitors.length ? competitorsCol.insertMany(store.competitors) : Promise.resolve(),
      store.reports.length ? reportsCol.insertMany(store.reports) : Promise.resolve(),
      store.scanJobs.length ? scanJobsCol.insertMany(store.scanJobs) : Promise.resolve(),
      store.reviews.length ? reviewsCol.insertMany(store.reviews) : Promise.resolve(),
      store.catalogOverrides.length ? catalogCol.insertMany(store.catalogOverrides) : Promise.resolve(),
      store.evidenceItems.length ? evidenceCol.insertMany(store.evidenceItems) : Promise.resolve(),
      store.sourceSnapshots.length ? snapshotsCol.insertMany(store.sourceSnapshots) : Promise.resolve(),
      store.packageMetrics.length ? metricsCol.insertMany(store.packageMetrics) : Promise.resolve(),
      store.marketSignals.length ? marketCol.insertMany(store.marketSignals) : Promise.resolve()
    ]);

    return { ...store, updatedAt: new Date().toISOString() };
  } catch (error) {
    mongoUnavailable = true;
    logPersistenceFallback('MongoDB', error);
    return jsonWriteStore(store);
  }
}

function competitorRow(competitor: CompetitorInput) {
  return {
    url: competitor.url,
    name: competitor.name || null,
    market: competitor.market || null,
    payload: competitor,
    updated_at: new Date().toISOString()
  };
}

function reportRow(report: IntelligenceReport) {
  return {
    id: report.id,
    generated_at: report.generatedAt,
    payload: report,
    updated_at: new Date().toISOString()
  };
}

function reviewRow(review: StoredReview) {
  return {
    finding_id: review.findingId,
    payload: review,
    updated_at: review.updatedAt
  };
}

function catalogOverrideRow(override: CatalogOverride) {
  return {
    service_line: override.serviceLine,
    payload: override,
    updated_at: override.updatedAt
  };
}

function scanJobRow(job: AnalyzeJob) {
  return {
    id: job.id,
    created_at: job.createdAt,
    payload: job,
    updated_at: new Date().toISOString()
  };
}

function evidenceItemRow(item: EvidenceItem) {
  return {
    id: item.id,
    report_id: item.reportId,
    generated_at: item.generatedAt,
    competitor_name: item.competitorName,
    service_line: item.serviceLine,
    payload: item,
    updated_at: new Date().toISOString()
  };
}

function sourceSnapshotRow(item: SourceSnapshot) {
  return {
    id: item.id,
    report_id: item.reportId,
    captured_at: item.capturedAt,
    competitor_name: item.competitorName,
    page_url: item.pageUrl,
    payload: item,
    updated_at: new Date().toISOString()
  };
}

function packageMetricRow(item: PackageMetrics) {
  return {
    report_id: item.reportId,
    generated_at: item.generatedAt,
    quality_score: item.qualityScore,
    payload: item,
    updated_at: new Date().toISOString()
  };
}

function marketSignalRow(item: MarketSignal) {
  return {
    id: item.id,
    report_id: item.reportId,
    generated_at: item.generatedAt,
    area_name: item.areaName,
    signal: item.signal,
    payload: item,
    updated_at: new Date().toISOString()
  };
}

async function optionalSupabaseUpsert(table: string, rows: object[], onConflict: string) {
  if (!rows.length) return;
  try {
    const result = await getSupabaseClient().from(table).upsert(rows, { onConflict });
    if (result.error) console.warn(`Optional Supabase upsert ${table} failed: ${result.error.message}`);
  } catch (error) {
    console.warn(`Optional Supabase upsert ${table} could not complete.`, error);
  }
}

async function optionalSupabaseDeleteAll(table: string, column: string) {
  try {
    const result = await getSupabaseClient().from(table).delete().neq(column, '__andwell_never_match__');
    if (result.error) console.warn(`Optional Supabase delete ${table} failed: ${result.error.message}`);
  } catch (error) {
    console.warn(`Optional Supabase delete ${table} could not complete.`, error);
  }
}

function urlDeleteCandidates(url: string) {
  const trimmed = url.trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  const candidates = new Set([trimmed, withoutTrailingSlash]);
  try {
    const parsed = new URL(trimmed);
    candidates.add(parsed.toString());
    candidates.add(parsed.toString().replace(/\/+$/, ''));
  } catch {
    // Keep caller-provided values for non-standard inputs.
  }
  return [...candidates].filter(Boolean);
}

export async function saveCompetitors(competitors: CompetitorInput[]) {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const supabase = getSupabaseClient();
      const normalized = competitors.filter((competitor) => competitor.url);
      if (normalized.length) {
        const result = await supabase.from('cih_competitors').upsert(normalized.map(competitorRow), { onConflict: 'url' });
        assertSupabase('upsert competitors', result.error);
      }
      return readStore();
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<CompetitorInput>('competitors');
      const normalized = competitors.filter((competitor) => competitor.url);
      await Promise.all(normalized.map((competitor) => col.updateOne({ url: competitor.url }, { $set: competitor }, { upsert: true })));
      return readStore();
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  const byUrl = new Map<string, CompetitorInput>();
  [...store.competitors, ...competitors].forEach((competitor) => {
    if (competitor.url) byUrl.set(competitor.url, competitor);
  });
  store.competitors = [...byUrl.values()].slice(0, 500);
  return writeStore(store);
}

export async function deleteCompetitor(url: string) {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) return readStore();
  const candidates = urlDeleteCandidates(normalizedUrl);

  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const result = await getSupabaseClient().from('cih_competitors').delete().in('url', candidates);
      assertSupabase('delete competitor', result.error);
      return readStore();
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<CompetitorInput>('competitors');
      await col.deleteMany({ url: { $in: candidates } });
      return readStore();
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  store.competitors = store.competitors.filter((competitor) => !candidates.includes(competitor.url));
  return writeStore(store);
}

export async function resetWorkspaceStore() {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const supabase = getSupabaseClient();
      const [competitorsResult, reportsResult, scanJobsResult] = await Promise.all([
        supabase.from('cih_competitors').delete().neq('url', '__andwell_never_match__'),
        supabase.from('cih_reports').delete().neq('id', '__andwell_never_match__'),
        supabase.from('cih_scan_jobs').delete().neq('id', '__andwell_never_match__')
      ]);
      assertSupabase('clear competitors', competitorsResult.error);
      assertSupabase('clear reports', reportsResult.error);
      assertSupabase('clear scan jobs', scanJobsResult.error);
      await Promise.all([
        optionalSupabaseDeleteAll('cih_evidence_items', 'id'),
        optionalSupabaseDeleteAll('cih_source_snapshots', 'id'),
        optionalSupabaseDeleteAll('cih_package_metrics', 'report_id'),
        optionalSupabaseDeleteAll('cih_market_signals', 'id')
      ]);
      return readStore();
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const [competitorsCol, reportsCol, scanJobsCol, evidenceCol, snapshotsCol, metricsCol, marketCol] = await Promise.all([
        collection<CompetitorInput>('competitors'),
        collection<IntelligenceReport>('reports'),
        collection<AnalyzeJob>('scanJobs'),
        collection<EvidenceItem>('evidenceItems'),
        collection<SourceSnapshot>('sourceSnapshots'),
        collection<PackageMetrics>('packageMetrics'),
        collection<MarketSignal>('marketSignals')
      ]);
      await Promise.all([
        competitorsCol.deleteMany({}),
        reportsCol.deleteMany({}),
        scanJobsCol.deleteMany({}),
        evidenceCol.deleteMany({}),
        snapshotsCol.deleteMany({}),
        metricsCol.deleteMany({}),
        marketCol.deleteMany({})
      ]);
      return readStore();
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  const nextStore: HubStore = {
    ...store,
    competitors: [],
    reports: [],
    scanJobs: [],
    evidenceItems: [],
    sourceSnapshots: [],
    packageMetrics: [],
    marketSignals: []
  };
  return writeStore(nextStore);
}

export async function saveReport(report: IntelligenceReport) {
  const enrichedReport = materializeReportIntelligence(report);
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const supabase = getSupabaseClient();
      const reportResult = await supabase.from('cih_reports').upsert(reportRow(enrichedReport), { onConflict: 'id' });
      assertSupabase('upsert report', reportResult.error);
      const reportCompetitors = enrichedReport.analyses.map((analysis) => ({ name: analysis.name, url: analysis.url, market: analysis.market }));
      if (reportCompetitors.length) {
        const competitorsResult = await supabase.from('cih_competitors').upsert(reportCompetitors.map(competitorRow), { onConflict: 'url' });
        assertSupabase('upsert report competitors', competitorsResult.error);
      }
      await Promise.all([
        optionalSupabaseUpsert('cih_evidence_items', (enrichedReport.evidenceItems || []).map(evidenceItemRow), 'id'),
        optionalSupabaseUpsert('cih_source_snapshots', (enrichedReport.sourceSnapshots || []).map(sourceSnapshotRow), 'id'),
        enrichedReport.packageMetrics ? optionalSupabaseUpsert('cih_package_metrics', [packageMetricRow(enrichedReport.packageMetrics)], 'report_id') : Promise.resolve(),
        optionalSupabaseUpsert('cih_market_signals', (enrichedReport.marketSignals || []).map(marketSignalRow), 'id')
      ]);
      return readStore();
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const reportsCol = await collection<IntelligenceReport>('reports');
      const competitorsCol = await collection<CompetitorInput>('competitors');
      const evidenceCol = await collection<EvidenceItem>('evidenceItems');
      const snapshotsCol = await collection<SourceSnapshot>('sourceSnapshots');
      const metricsCol = await collection<PackageMetrics>('packageMetrics');
      const marketCol = await collection<MarketSignal>('marketSignals');
      await reportsCol.updateOne({ id: enrichedReport.id }, { $set: enrichedReport }, { upsert: true });
      const reportCompetitors = enrichedReport.analyses.map((analysis) => ({ name: analysis.name, url: analysis.url, market: analysis.market }));
      await Promise.all(reportCompetitors.map((competitor) => competitorsCol.updateOne({ url: competitor.url }, { $set: competitor }, { upsert: true })));
      await Promise.all([
        ...(enrichedReport.evidenceItems || []).map((item) => evidenceCol.updateOne({ id: item.id }, { $set: item }, { upsert: true })),
        ...(enrichedReport.sourceSnapshots || []).map((item) => snapshotsCol.updateOne({ id: item.id }, { $set: item }, { upsert: true })),
        enrichedReport.packageMetrics ? metricsCol.updateOne({ reportId: enrichedReport.id }, { $set: enrichedReport.packageMetrics }, { upsert: true }) : Promise.resolve(),
        ...(enrichedReport.marketSignals || []).map((item) => marketCol.updateOne({ id: item.id }, { $set: item }, { upsert: true }))
      ]);
      return readStore();
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  const nextReports = [enrichedReport, ...store.reports.filter((item) => item.id !== enrichedReport.id)].slice(0, 100);
  store.reports = nextReports;
  store.evidenceItems = [...(enrichedReport.evidenceItems || []), ...store.evidenceItems.filter((item) => item.reportId !== enrichedReport.id)].slice(0, 20000);
  store.sourceSnapshots = [...(enrichedReport.sourceSnapshots || []), ...store.sourceSnapshots.filter((item) => item.reportId !== enrichedReport.id)].slice(0, 10000);
  store.packageMetrics = enrichedReport.packageMetrics
    ? [enrichedReport.packageMetrics, ...store.packageMetrics.filter((item) => item.reportId !== enrichedReport.id)].slice(0, 1000)
    : store.packageMetrics;
  store.marketSignals = [...(enrichedReport.marketSignals || []), ...store.marketSignals.filter((item) => item.reportId !== enrichedReport.id)].slice(0, 10000);
  const reportCompetitors = enrichedReport.analyses.map((analysis) => ({ name: analysis.name, url: analysis.url, market: analysis.market }));
  const byUrl = new Map<string, CompetitorInput>();
  [...store.competitors, ...reportCompetitors].forEach((competitor) => {
    if (competitor.url) byUrl.set(competitor.url, competitor);
  });
  store.competitors = [...byUrl.values()].slice(0, 500);
  return writeStore(store);
}

export async function saveScanJob(job: AnalyzeJob) {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const result = await getSupabaseClient().from('cih_scan_jobs').upsert(scanJobRow(job), { onConflict: 'id' });
      assertSupabase('upsert scan job', result.error);
      return job;
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<AnalyzeJob>('scanJobs');
      await col.updateOne({ id: job.id }, { $set: job }, { upsert: true });
      return job;
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  store.scanJobs = [job, ...store.scanJobs.filter((item) => item.id !== job.id)].slice(0, 1000);
  await writeStore(store);
  return job;
}

export async function getScanJob(jobId: string) {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const result = await getSupabaseClient().from('cih_scan_jobs').select('payload').eq('id', jobId).maybeSingle();
      assertSupabase('get scan job', result.error);
      return result.data ? result.data.payload as AnalyzeJob : null;
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<AnalyzeJob>('scanJobs');
      return col.findOne({ id: jobId }, { projection: { _id: 0 } });
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  return store.scanJobs.find((job) => job.id === jobId) || null;
}

export async function markStaleScanJobsFailed() {
  const store = await readStore();
  const stale = store.scanJobs.filter((job) => job.status === 'queued' || job.status === 'running');
  if (!stale.length) return;
  for (const job of stale) {
    await saveScanJob({
      ...job,
      status: 'failed',
      endedAt: new Date().toISOString(),
      errors: [...job.errors, 'Scan job was interrupted before completion and has been safely closed.']
    });
  }
}

export async function getReport(reportId: string) {
  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const result = await getSupabaseClient()
        .from('cih_reports')
        .select('payload')
        .eq('id', reportId)
        .maybeSingle();
      assertSupabase('get report', result.error);
      return result.data ? materializeReportIntelligence(result.data.payload as IntelligenceReport) : null;
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<IntelligenceReport>('reports');
      const report = await col.findOne({ id: reportId }, { projection: { _id: 0 } });
      return report ? materializeReportIntelligence(report) : null;
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  const report = store.reports.find((item) => item.id === reportId) || null;
  return report ? materializeReportIntelligence(report) : null;
}

export async function saveReview(input: Omit<StoredReview, 'id' | 'updatedAt'> & { id?: string }) {
  const id = input.id || `review_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const review: StoredReview = { ...input, id, updatedAt: new Date().toISOString() };

  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const result = await getSupabaseClient().from('cih_reviews').upsert(reviewRow(review), { onConflict: 'finding_id' });
      assertSupabase('upsert review', result.error);
      return review;
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<StoredReview>('reviews');
      await col.updateOne({ findingId: input.findingId }, { $set: review }, { upsert: true });
      return review;
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  store.reviews = [review, ...store.reviews.filter((item) => item.findingId !== input.findingId)].slice(0, 10000);
  await writeStore(store);
  return review;
}

export async function saveCatalogOverride(input: Omit<CatalogOverride, 'updatedAt'>) {
  const override: CatalogOverride = { ...input, updatedAt: new Date().toISOString() };

  if (isSupabaseConfigured() && !supabaseUnavailable) {
    try {
      const result = await getSupabaseClient().from('cih_catalog_overrides').upsert(catalogOverrideRow(override), { onConflict: 'service_line' });
      assertSupabase('upsert catalog override', result.error);
      return override;
    } catch (error) {
      supabaseUnavailable = true;
      logPersistenceFallback('Supabase', error);
    }
  }

  if (isMongoConfigured() && !mongoUnavailable) {
    try {
      const col = await collection<CatalogOverride>('catalogOverrides');
      await col.updateOne({ serviceLine: input.serviceLine }, { $set: override }, { upsert: true });
      return override;
    } catch (error) {
      mongoUnavailable = true;
      logPersistenceFallback('MongoDB', error);
    }
  }

  const store = await readStore();
  store.catalogOverrides = [override, ...store.catalogOverrides.filter((item) => item.serviceLine !== input.serviceLine)];
  await writeStore(store);
  return override;
}
