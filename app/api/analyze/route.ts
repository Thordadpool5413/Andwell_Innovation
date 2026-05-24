import { NextRequest, NextResponse } from 'next/server';
import { crawlSite } from '../../../lib/crawler';
import { analyzeCompetitor, buildReport } from '../../../lib/analysis';
import { extractCompetitorIntelligence, isAIExtractionConfigured } from '../../../lib/ai-extractor';
import { enrichProvidersWithFreeSources } from '../../../lib/free-health-intel';
import { enrichReportIntelligence } from '../../../lib/intelligence-policy';
import { getScanJob, markStaleScanJobsFailed, saveReport, saveScanJob } from '../../../lib/store';
import { rateLimit, requestIp } from '../../../lib/rate-limit';
import { parseAllowedHostPatterns, validatePublicHttpUrl } from '../../../lib/url-safety';
import type { AnalyzeJob, AnalyzeJobStatus, CompetitorAnalysis, CompetitorInput, CrawledPage, SourceHealth } from '../../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnalyzeResult = {
  analysis: CompetitorAnalysis;
  crawlError?: { url: string; error: string };
  aiError?: { url: string; error: string };
};

const runningJobs = new Map<string, Promise<void>>();

function sourceQualityScore(url: string) {
  const parsed = new URL(url);
  let score = parsed.protocol === 'https:' ? 72 : 62;
  if (parsed.pathname && parsed.pathname !== '/') score += 8;
  if (parsed.hostname.startsWith('www.')) score += 2;
  return Math.min(100, score);
}

function diagnoseCompetitorInputs(items: CompetitorInput[], limit: number) {
  const patterns = parseAllowedHostPatterns(process.env.CRAWL_ALLOWED_HOSTS);
  const seen = new Set<string>();
  const competitors: CompetitorInput[] = [];
  const sourceHealth: SourceHealth[] = [];

  items.forEach((item, index) => {
    const rawUrl = item.url || '';
    if (!rawUrl.trim()) return;
    if (index >= limit) {
      sourceHealth.push({ input: rawUrl, status: 'skipped', reason: `Skipped because this scan accepts up to ${limit} competitor source${limit === 1 ? '' : 's'}.`, qualityScore: 0 });
      return;
    }

    const result = validatePublicHttpUrl(rawUrl, patterns);
    if (!result.ok || !result.url) {
      sourceHealth.push({ input: rawUrl, host: result.host, status: 'rejected', reason: result.reason, qualityScore: 0 });
      return;
    }

    if (seen.has(result.url)) {
      sourceHealth.push({ input: rawUrl, url: result.url, host: result.host, status: 'duplicate', reason: 'Duplicate source skipped so the scan does not spend time crawling the same website twice.', qualityScore: 35 });
      return;
    }

    seen.add(result.url);
    competitors.push({ ...item, url: result.url });
    sourceHealth.push({ input: rawUrl, url: result.url, host: result.host, status: 'accepted', reason: result.reason, qualityScore: sourceQualityScore(result.url) });
  });

  return { competitors, sourceHealth };
}

function mergeCrawlSourceHealth(sourceHealth: SourceHealth[], analyses: CompetitorAnalysis[], crawlErrors: { url: string; error: string }[]) {
  const pagesByUrl = new Map(analyses.map((analysis) => [analysis.url, analysis.pagesReviewed.length]));
  const errorsByUrl = new Map(crawlErrors.map((error) => [error.url, error.error]));
  return sourceHealth.map((source) => {
    if (!source.url || (source.status !== 'accepted' && source.status !== 'crawled')) return source;
    const error = errorsByUrl.get(source.url);
    if (error) {
      return { ...source, status: 'warning' as const, reason: 'The source was accepted, but crawling produced a warning.', error, pagesReviewed: pagesByUrl.get(source.url) || 0, qualityScore: Math.min(source.qualityScore, 42) };
    }
    const pagesReviewed = pagesByUrl.get(source.url) || 0;
    return { ...source, status: 'crawled' as const, reason: pagesReviewed ? `${pagesReviewed} public page${pagesReviewed === 1 ? '' : 's'} reviewed.` : 'The source was accepted but produced limited readable content.', pagesReviewed, qualityScore: Math.min(100, source.qualityScore + Math.min(18, pagesReviewed * 3)) };
  });
}

function applyAIEnhancement(analysis: CompetitorAnalysis, aiExtraction: NonNullable<CompetitorAnalysis['aiExtraction']>): CompetitorAnalysis {
  const findings = analysis.findings.map((finding) => {
    const aiService = aiExtraction.serviceLineDepth.find((item) => item.serviceLine.toLowerCase() === finding.serviceLine.toLowerCase());
    if (!aiService) return finding;
    return {
      ...finding,
      aiInterpretation: `${finding.aiInterpretation} AI extraction: ${aiService.summary}`,
      andwellAdvantage: aiService.andwellAdvantages.length ? aiService.andwellAdvantages.join(' ') : finding.andwellAdvantage,
      competitorAdvantage: aiService.competitorAdvantages.length ? aiService.competitorAdvantages.join(' ') : finding.competitorAdvantage,
      safeSalesWording: aiExtraction.safeSalesLanguage[0] || finding.safeSalesWording,
      avoidSaying: aiExtraction.doNotSayLanguage[0] || finding.avoidSaying,
      subserviceDepthScore: Math.max(finding.subserviceDepthScore, aiService.depthScore)
    };
  });

  const subserviceFindings = analysis.subserviceFindings.map((finding) => {
    const aiSub = aiExtraction.subserviceDepth.find((item) => item.serviceLine.toLowerCase() === finding.serviceLine.toLowerCase() && item.subservice.toLowerCase() === finding.subservice.toLowerCase());
    if (!aiSub) return finding;
    return {
      ...finding,
      competitorStatus: aiSub.status,
      confidence: aiSub.confidence,
      evidenceExcerpt: aiSub.evidenceExcerpt || finding.evidenceExcerpt,
      sourceUrl: aiSub.sourceUrl || finding.sourceUrl,
      aiInterpretation: `${finding.aiInterpretation} AI extraction reviewed this subservice and classified it as ${aiSub.status}.`,
      safeSalesWording: aiSub.safeSalesLanguage || finding.safeSalesWording,
      avoidSaying: aiSub.doNotSayLanguage || finding.avoidSaying
    };
  });

  return { ...analysis, findings, subserviceFindings, aiExtraction, aiEnhanced: true };
}

function analyzeConcurrency(shouldUseAI: boolean) {
  const fallback = shouldUseAI ? 5 : 8;
  const requested = Number(process.env.ANALYZE_CONCURRENCY || fallback);
  const ceiling = shouldUseAI ? 5 : 8;
  if (!Number.isFinite(requested)) return fallback;
  return Math.max(1, Math.min(ceiling, Math.floor(requested)));
}

function crawlMaxPagesLimit() {
  const requested = Number(process.env.CRAWL_MAX_PAGES_PER_SITE || 8);
  if (!Number.isFinite(requested)) return 8;
  return Math.max(4, Math.min(35, Math.floor(requested)));
}

function maxCompetitorsLimit() {
  const requested = Number(process.env.ANALYZE_MAX_COMPETITORS || 25);
  if (!Number.isFinite(requested)) return 25;
  return Math.max(1, Math.min(25, Math.floor(requested)));
}

function assertRequestSize(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') || 0);
  const maxBytes = Math.max(8000, Math.min(100000, Number(process.env.ANALYZE_MAX_BODY_BYTES || 30000)));
  if (contentLength && contentLength > maxBytes) throw new Error(`Request body is too large. Limit is ${maxBytes} bytes.`);
}

function timeoutMsFromEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function updateJob(job: AnalyzeJob, patch: Partial<AnalyzeJob>) {
  const next = { ...job, ...patch, timing: { ...job.timing, ...(patch.timing || {}) } };
  await saveScanJob(next);
  return next;
}

async function runAnalyzeJob(params: {
  job: AnalyzeJob;
  competitors: CompetitorInput[];
  sourceHealth: SourceHealth[];
  maxPages: number;
  shouldUseAI: boolean;
  concurrency: number;
  save: boolean;
}) {
  let job = await updateJob(params.job, { status: 'running', startedAt: new Date().toISOString() });
  const started = Date.now();
  const totalTimeoutMs = timeoutMsFromEnv('ANALYZE_TOTAL_TIMEOUT_MS', 110000, 30000, 240000);
  const perCompetitorTimeoutMs = timeoutMsFromEnv('ANALYZE_COMPETITOR_TIMEOUT_MS', 35000, 10000, 120000);
  const crawlErrors: { url: string; error: string }[] = [];
  const aiErrors: { url: string; error: string }[] = [];
  const analyses: CompetitorAnalysis[] = [];
  const perCompetitorMs: Record<string, number> = {};

  let timedOut = false;
  const limitReached = () => Date.now() - started >= totalTimeoutMs;

  for (let i = 0; i < params.competitors.length; i += 1) {
    if (limitReached()) {
      timedOut = true;
      break;
    }
    const competitor = params.competitors[i];
    const oneStarted = Date.now();
    try {
      const result = await withTimeout((async () => {
        const pages = await crawlSite(competitor.url, params.maxPages);
        let analysis = analyzeCompetitor(competitor, pages, i);
        if (params.shouldUseAI) {
          try {
            const aiExtraction = await extractCompetitorIntelligence(competitor, pages);
            if (aiExtraction) analysis = applyAIEnhancement(analysis, aiExtraction);
          } catch (error) {
            aiErrors.push({ url: competitor.url, error: error instanceof Error ? error.message : 'Unknown AI extraction error' });
          }
        }
        return { analysis };
      })(), perCompetitorTimeoutMs, `Competitor processing timed out after ${perCompetitorTimeoutMs}ms.`);
      analyses.push(result.analysis);
    } catch (error) {
      const fallbackPage: CrawledPage = { url: competitor.url, title: 'Crawl limitation', text: '', excerpt: 'No readable public content could be extracted from this website.' };
      analyses.push(analyzeCompetitor(competitor, [fallbackPage], i));
      crawlErrors.push({ url: competitor.url, error: error instanceof Error ? error.message : 'Unknown crawl error' });
    }

    perCompetitorMs[competitor.url] = Date.now() - oneStarted;
    job = await updateJob(job, {
      progress: { done: analyses.length, total: params.competitors.length },
      timing: { ...job.timing, elapsedMs: Date.now() - started, perCompetitorMs }
    });
  }

  const finalSourceHealth = mergeCrawlSourceHealth(params.sourceHealth, analyses, crawlErrors);
  const report = buildReport(analyses, [...crawlErrors, ...aiErrors.map((item) => ({ url: item.url, error: `AI extraction: ${item.error}` }))]);
  const enrichment = await enrichProvidersWithFreeSources(params.competitors).catch(() => ({
    providerEnrichment: [],
    geographicSignals: [],
    externalDataSummary: { providersEnriched: 0, providerMatches: 0, geographicSignals: 0, lastEnrichedAt: new Date().toISOString() }
  }));
  const aiSummaries = analyses.map((analysis) => analysis.aiExtraction?.leadershipSummary).filter(Boolean);
  const enhancedReport = enrichReportIntelligence({
    ...report,
    aiEnabled: params.shouldUseAI,
    aiModel: process.env.OPENAI_MODEL || 'gpt-4.1-nano',
    analysisConcurrency: params.concurrency,
    crawlMaxPagesPerSite: params.maxPages,
    aiLeadershipSummary: aiSummaries.length ? aiSummaries.join('\n\n') : undefined,
    executiveSummary: aiSummaries.length ? `${report.executiveSummary}\n\nAI leadership summary: ${aiSummaries.join(' ')}` : report.executiveSummary,
    providerEnrichment: enrichment.providerEnrichment,
    geographicSignals: enrichment.geographicSignals,
    externalDataSummary: enrichment.externalDataSummary
  }, finalSourceHealth);

  if (params.save !== false) await saveReport(enhancedReport);

  const warnings: string[] = [];
  if (timedOut) warnings.push('Scan reached the total execution budget and returned a partial intelligence package.');
  if (crawlErrors.length) warnings.push(`${crawlErrors.length} source crawl warning${crawlErrors.length === 1 ? '' : 's'} were handled with safe fallback analysis.`);
  if (aiErrors.length) warnings.push(`${aiErrors.length} AI enrichment warning${aiErrors.length === 1 ? '' : 's'} were handled with deterministic intelligence processing.`);

  await updateJob(job, {
    status: timedOut ? 'timed_out' : 'completed',
    endedAt: new Date().toISOString(),
    warnings,
    errors: [...crawlErrors.map((item) => item.error), ...aiErrors.map((item) => item.error)],
    reportId: enhancedReport.id,
    timing: { elapsedMs: Date.now() - started, perCompetitorMs }
  });
}

export async function GET() {
  const aiConfigured = isAIExtractionConfigured();
  await markStaleScanJobsFailed();
  return NextResponse.json({
    ok: true,
    route: '/api/analyze',
    aiConfigured,
    analyzeConcurrency: analyzeConcurrency(aiConfigured),
    crawlMaxPagesPerSiteLimit: crawlMaxPagesLimit(),
    maxCompetitorsPerScan: maxCompetitorsLimit(),
    urlValidation: 'shared public URL safety policy at request, competitor, and crawler boundaries',
    message: aiConfigured ? 'Analyze API route is active with asynchronous job processing and OpenAI extraction enabled.' : 'Analyze API route is active with asynchronous job processing and deterministic intelligence.',
    checkedAt: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    assertRequestSize(req);
    const ip = requestIp(req.headers);
    const limit = rateLimit(`analyze:${ip}`, Number(process.env.ANALYZE_RATE_LIMIT || 8), Number(process.env.ANALYZE_RATE_WINDOW_MS || 15 * 60 * 1000));
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many intelligence scans were requested from this connection. Please wait before running another scan.', resetAt: new Date(limit.resetAt).toISOString() }, { status: 429 });
    }

    const body = await req.json() as { competitors?: CompetitorInput[]; maxPagesPerSite?: number; save?: boolean; useAI?: boolean };
    const { competitors, sourceHealth } = diagnoseCompetitorInputs(body.competitors || [], maxCompetitorsLimit());
    if (!competitors.length) {
      return NextResponse.json({ error: 'Add at least one valid public competitor URL. Only public http or https URLs are allowed. Localhost, private IPs, link-local addresses, internal hostnames, and credentialed URLs are blocked.', sourceHealth }, { status: 400 });
    }

    const maxPagesLimit = crawlMaxPagesLimit();
    const requestedMaxPages = Number(body.maxPagesPerSite || maxPagesLimit);
    const maxPages = Math.min(Math.max(Number.isFinite(requestedMaxPages) ? requestedMaxPages : maxPagesLimit, 4), maxPagesLimit);
    const shouldUseAI = body.useAI !== false && isAIExtractionConfigured();
    const concurrency = analyzeConcurrency(shouldUseAI);

    const job: AnalyzeJob = {
      id: `scan_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
      status: 'queued',
      createdAt: new Date().toISOString(),
      inputSummary: { competitors: competitors.length, maxPagesPerSite: maxPages, useAI: shouldUseAI },
      progress: { done: 0, total: competitors.length },
      warnings: [],
      errors: [],
      timing: { elapsedMs: 0, perCompetitorMs: {} }
    };
    await saveScanJob(job);

    if (!runningJobs.has(job.id)) {
      const runner = runAnalyzeJob({ job, competitors, sourceHealth, maxPages, shouldUseAI, concurrency, save: body.save !== false })
        .catch(async (error) => {
          const current = await getScanJob(job.id);
          if (current) {
            await saveScanJob({
              ...current,
              status: 'failed',
              endedAt: new Date().toISOString(),
              errors: [...current.errors, error instanceof Error ? error.message : 'Unknown job error']
            });
          }
        })
        .finally(() => {
          runningJobs.delete(job.id);
        });
      runningJobs.set(job.id, runner);
    }

    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      route: '/api/analyze',
      error: error instanceof Error ? error.message : 'Unknown analysis error',
      checkedAt: new Date().toISOString()
    }, { status: 500 });
  }
}
