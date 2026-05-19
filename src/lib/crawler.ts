import { CrawlResult } from "./types"
import { store } from "./store"
import { changeDetector } from "./change-detector"

const MAINE_COUNTIES = [
  "Cumberland", "York", "Penobscot", "Kennebec", "Androscoggin",
  "Oxford", "Hancock", "Somerset", "Aroostook", "Knox", "Waldo",
  "Washington", "Lincoln", "Sagadahoc", "Franklin", "Piscataquis",
]

const SERVICE_KEYWORDS: Record<string, RegExp> = {
  "Home Healthcare": /home.?health|skilled.?nurs|home.?care|home.?health/i,
  "Mobile Wound Care": /wound.?care|ostomy|debridement|wound.?vac|negative.?pressure|chronic.?wound|compression.?therapy/i,
  "Therapy Care": /physical.?ther|occupational.?ther|speech.?ther|rehab.?ther|pulmonary.?rehab/i,
  "Palliative Care": /palliative|hospice|end.?of.?life|comfort.?care/i,
  "Personal Care": /personal.?care|companion.?care|aide.?service|homemaker/i,
}

const CRAWL_DELAY_MS = 1000
const MAX_PAGES = 25

interface PageResult {
  url: string
  text: string
  title: string
}

async function fetchRobotsTxt(domain: string): Promise<string[]> {
  const disallowed: string[] = []
  try {
    const res = await fetch(`https://${domain}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    const text = await res.text()
    for (const line of text.split("\n")) {
      if (line.toLowerCase().startsWith("disallow:")) {
        const path = line.split(":").slice(1).join(":").trim()
        if (path) disallowed.push(path)
      }
    }
  } catch {}
  return disallowed
}

function isAllowed(url: string, disallowed: string[]): boolean {
  const path = new URL(url).pathname
  return !disallowed.some(d => path.startsWith(d))
}

async function discoverSitemapUrls(domain: string): Promise<string[]> {
  const urls: string[] = []
  try {
    const res = await fetch(`https://${domain}/sitemap.xml`, { signal: AbortSignal.timeout(5000) })
    const xml = await res.text()
    const matches = xml.match(/<loc>(.*?)<\/loc>/g)
    if (matches) {
      for (const m of matches) {
        const url = m.replace(/<\/?loc>/g, "")
        if (url.includes(domain)) urls.push(url)
      }
    }
  } catch {}
  return urls.slice(0, MAX_PAGES)
}

async function crawlPagePlaywright(url: string): Promise<PageResult> {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ userAgent: "AndwellIntelligence/1.0" })
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 })
    await page.waitForTimeout(2000)
    const text = await page.innerText("body")
    const title = await page.title()
    return { url, text: text.slice(0, 50000), title }
  } finally {
    await context.close()
    await browser.close()
  }
}

async function buildResult(
  url: string,
  domain: string,
  allPages: PageResult[],
  competitorId?: string
): Promise<{ result: CrawlResult; findings: { snippet: string; source: string; serviceId: string }[] }> {
  const combinedText = allPages.map(p => p.text).join("\n").toLowerCase()
  const servicesFound: string[] = []
  for (const [service, pattern] of Object.entries(SERVICE_KEYWORDS)) {
    if (pattern.test(combinedText)) servicesFound.push(service)
  }

  const maineMentions: { page: string; snippet: string }[] = []
  const countiesMentioned: string[] = []
  for (const county of MAINE_COUNTIES) {
    const idx = combinedText.indexOf(county.toLowerCase())
    if (idx !== -1) {
      const start = Math.max(0, idx - 60)
      const end = Math.min(combinedText.length, idx + county.length + 60)
      maineMentions.push({ page: allPages[0]?.url || url, snippet: combinedText.slice(start, end).replace(/\s+/g, " ").trim() })
      countiesMentioned.push(county)
    }
  }

  const findings: { snippet: string; source: string; serviceId: string }[] = []
  const sentences = combinedText.match(/[^.!?\n]+[.!?]/g) || []
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length < 30) continue
    for (const [service, pattern] of Object.entries(SERVICE_KEYWORDS)) {
      if (pattern.test(trimmed)) {
        findings.push({
          snippet: trimmed,
          source: allPages[0]?.url || url,
          serviceId: service.toLowerCase().replace(/\s+/g, "-"),
        })
        break
      }
    }
  }

  const result: CrawlResult = {
    url,
    pagesScraped: allPages.length,
    servicesFound,
    subservicesFound: [],
    maineMentions,
    rawContent: allPages.map(p => `[${p.title}](${p.url}): ${p.text.slice(0, 500)}`).join("\n\n").slice(0, 10000),
    summary: allPages.length > 0
      ? `Scraped ${allPages.length} page(s) from ${domain} — found ${servicesFound.length} service keywords, ${maineMentions.length} Maine county mentions`
      : "Could not fetch page content. The site may block automated access.",
    countiesMentioned: countiesMentioned.length > 0 ? countiesMentioned : undefined,
  }

  if (competitorId) {
    const competitors = store.getCompetitors()
    store.saveCompetitors(competitors.map(c =>
      c.id === competitorId
        ? {
            ...c,
            status: "complete" as const,
            lastCrawled: new Date().toISOString().split("T")[0],
            maineCounties: countiesMentioned.length > 0 ? [...new Set([...c.maineCounties, ...countiesMentioned])] : c.maineCounties,
            threatLevel: countiesMentioned.length > 2 ? "high" : countiesMentioned.length > 0 ? "medium" : c.threatLevel,
          }
        : c
    ))

    await changeDetector.check(url, combinedText)
  }

  return { result, findings }
}

export async function crawlUrl(
  url: string,
  competitorId?: string
): Promise<{ result: CrawlResult; findings: { snippet: string; source: string; serviceId: string }[] }> {
  const domain = new URL(url).hostname.replace("www.", "")
  const disallowed = await fetchRobotsTxt(domain)
  const sitemapUrls = await discoverSitemapUrls(domain)

  const allPages: PageResult[] = []

  try {
    if (sitemapUrls.length > 0) {
      const allowed = sitemapUrls.filter(u => isAllowed(u, disallowed))
      const batch = allowed.slice(0, MAX_PAGES)
      for (const pu of batch) {
        const pr = await crawlPagePlaywright(pu)
        allPages.push(pr)
        await new Promise(r => setTimeout(r, CRAWL_DELAY_MS))
      }
    }

    if (allPages.length === 0 && isAllowed(url, disallowed)) {
      const pr = await crawlPagePlaywright(url)
      allPages.push(pr)
    }
  } catch {
    const fallbackText = await fetch(url, { signal: AbortSignal.timeout(8000) }).then(r => r.text()).catch(() => "")
    if (fallbackText) {
      allPages.push({ url, text: fallbackText.slice(0, 50000), title: "" })
    }
  }

  return buildResult(url, domain, allPages, competitorId)
}
