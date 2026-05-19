import { DhhsFiling, Finding } from "../types"
import { store } from "../store"

const DHHS_CON_URL = "https://www.maine.gov/dhhs/mecdc/certificate-of-need"
const DHHS_LICENSE_URL = "https://www.maine.gov/dhhs/mecdc/home-health-licensing"

async function fetchPageText(url: string): Promise<string> {
  try {
    const { chromium } = await import("playwright")
    const browser = await chromium.launch({ headless: true })
    try {
      const context = await browser.newContext({ userAgent: "AndwellIntelligence/1.0" })
      const page = await context.newPage()
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
      await page.waitForTimeout(3000)
      const text = await page.innerText("body")
      await context.close()
      return text
    } finally {
      await browser.close()
    }
  } catch {
    return ""
  }
}

function extractFilings(text: string, type: DhhsFiling["type"], keywords: RegExp): DhhsFiling[] {
  const filings: DhhsFiling[] = []
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (keywords.test(line.toLowerCase())) {
      filings.push({
        id: `${type.slice(0, 3)}-${Date.now()}-${i}`,
        type,
        filerName: extractFiler(line),
        description: line.slice(0, 200),
        county: extractCounty(line) || "Unknown",
        date: new Date().toISOString().split("T")[0],
        status: line.toLowerCase().includes("approved") ? "approved" : "pending",
      })
    }
  }
  return filings
}

const CON_KEYWORDS = /home.?health|wound|home.?care|notice|application|filing/
const LICENSE_KEYWORDS = /license|certified|approved|home.?health|home.?care|skilled.?nursing/

async function scrapeConFilings(): Promise<DhhsFiling[]> {
  const text = await fetchPageText(DHHS_CON_URL)
  return text ? extractFilings(text, "certificate-of-need", CON_KEYWORDS) : []
}

async function scrapeLicenseNotices(): Promise<DhhsFiling[]> {
  const text = await fetchPageText(DHHS_LICENSE_URL)
  return text ? extractFilings(text, "license", LICENSE_KEYWORDS) : []
}

const MAINE_COUNTIES = [
  "Cumberland", "York", "Penobscot", "Kennebec", "Androscoggin",
  "Oxford", "Hancock", "Somerset", "Aroostook", "Knox", "Waldo",
  "Washington", "Lincoln", "Sagadahoc", "Franklin", "Piscataquis",
]

function extractCounty(text: string): string | null {
  for (const c of MAINE_COUNTIES) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c
  }
  return null
}

function extractFiler(text: string): string {
  const knownCompetitors = ["Northern Light", "MaineHealth", "Gentiva", "Amedisys", "Interim", "VNA"]
  for (const kc of knownCompetitors) {
    if (text.includes(kc)) return kc
  }
  const match = text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/)
  return match ? match[1] : "Unknown"
}

export const dhhsScraper = {
  async scrape(): Promise<Finding[]> {
    const [conFilings, licenseFilings] = await Promise.all([
      scrapeConFilings(),
      scrapeLicenseNotices(),
    ])

    const allFilings = [...conFilings, ...licenseFilings]
    const findings: Finding[] = []

    const competitorMap: Record<string, string> = {
      "Northern Light": "c1",
      "MaineHealth": "c2",
      "Gentiva": "c3",
      "Amedisys": "c4",
      "Interim": "c5",
      "VNA": "c6",
    }

    for (const f of allFilings) {
      const compId = competitorMap[f.filerName] || ""
      findings.push({
        id: f.id,
        competitorId: compId,
        serviceId: "home-health",
        subServiceId: "hh-skilled-nursing",
        evidence: `${f.filerName} filed ${f.type.replace("-", " ")} in ${f.county} county: ${f.description}`,
        source: "Maine DHHS",
        date: f.date,
        confidence: "confirmed",
        reviewStatus: "pending",
      })
    }

    if (findings.length > 0) {
      const existing = store.getFindings()
      store.saveFindings([...findings, ...existing])
    }

    return findings
  },
}
