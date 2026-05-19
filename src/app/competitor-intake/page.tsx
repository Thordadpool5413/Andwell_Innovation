"use client"

import { useState } from "react"
import { Plus, RefreshCw, CheckCircle, Clock, AlertCircle, MapPin, FileText, ExternalLink } from "lucide-react"
import { mockCompetitors } from "@/lib/data"
import type { Competitor, CrawlResult } from "@/lib/types"
import Link from "next/link"

export default function CompetitorIntakePage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(mockCompetitors)
  const [url, setUrl] = useState("")
  const [scraping, setScraping] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, CrawlResult>>({})

  const addCompetitor = async () => {
    if (!url.trim()) return
    const name = url.replace(/https?:\/\/(www\.)?/, "").split(".")[0]
    const id = `c${Date.now()}`
    const newComp: Competitor = {
      id,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      website: url,
      addedAt: new Date().toISOString().split("T")[0],
      lastCrawled: null,
      status: "crawling",
      maineCounties: [],
      threatLevel: "low",
    }
    setCompetitors([...competitors, newComp])
    setUrl("")
    setScraping(id)

    try {
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, competitorId: id }),
      })
      const crawlData = await crawlRes.json()
      const crawl = crawlData.crawl as CrawlResult

      setResults((prev) => ({ ...prev, [id]: crawl }))
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: "complete", threatLevel: crawl.maineMentions.length > 0 ? "medium" : "low", lastCrawled: new Date().toISOString().split("T")[0] }
            : c
        )
      )
    } catch {
      setCompetitors((prev) => prev.map((c) => (c.id === id ? { ...c, status: "error" } : c)))
    }
    setScraping(null)
  }

  const statusIcon = (s: Competitor["status"]) => {
    switch (s) {
      case "complete": return <CheckCircle className="w-4 h-4 text-green-400" />
      case "crawling": return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-zinc-500" />
    }
  }

  const threatColor = (t: string) => {
    switch (t) {
      case "critical": return "bg-red-900 text-red-300"
      case "high": return "bg-orange-900 text-orange-300"
      case "medium": return "bg-amber-900 text-amber-300"
      default: return "bg-green-900 text-green-300"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Competitor Intake</h2>
        <p className="text-zinc-500 text-sm mt-1">Add competitor URLs to research their Maine market presence</p>
      </div>
      <div className="flex gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
          placeholder="https://competitor.com"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
        <button onClick={addCompetitor} disabled={scraping !== null} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {scraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {scraping ? "Researching..." : "Add & Research"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {competitors.map((c) => {
          const result = results[c.id]
          return (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{statusIcon(c.status)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/competitors/${c.id}`} className="font-semibold text-white hover:text-blue-400 transition-colors">
                        {c.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${threatColor(c.threatLevel)}`}>
                        {c.threatLevel}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">{c.website}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-zinc-600">Added: {c.addedAt}</span>
                      {c.lastCrawled && <span className="text-xs text-zinc-600">Crawled: {c.lastCrawled}</span>}
                    </div>
                    {c.maineCounties.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                        <MapPin className="w-3 h-3" />
                        {c.maineCounties.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/competitors/${c.id}`}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Profile
                </Link>
              </div>

              {result && (
                <div className="border-t border-zinc-800 px-5 py-4 bg-zinc-950">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                    <FileText className="w-3.5 h-3.5" />
                    Crawl Results
                  </div>
                  <p className="text-sm text-zinc-300 mb-3">{result.summary}</p>
                  {result.servicesFound.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-zinc-600">Services: </span>
                      <span className="text-xs text-zinc-400">{result.servicesFound.join(", ")}</span>
                    </div>
                  )}
                  {result.maineMentions.length > 0 && (
                    <div>
                      <span className="text-xs text-zinc-600">Maine mentions: </span>
                      <span className="text-xs text-zinc-400">{result.maineMentions.length} found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-zinc-600">{competitors.length} competitor(s) tracked</p>
    </div>
  )
}
