import { NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { CrawlResult } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { url, competitorId } = await req.json()

    const crawlResult: CrawlResult = {
      url,
      pagesScraped: 3,
      servicesFound: ["Home Healthcare", "Skilled Nursing"],
      subservicesFound: [],
      maineMentions: [],
      rawContent: "",
    }

    const competitors = store.getCompetitors()
    store.saveCompetitors(competitors.map(c =>
      c.id === competitorId ? { ...c, status: "complete" as const, lastCrawled: new Date().toISOString().split("T")[0] } : c
    ))

    return NextResponse.json({ crawl: crawlResult })
  } catch {
    return NextResponse.json({ error: "Crawl failed" }, { status: 500 })
  }
}
