"use client"

import { useState } from "react"
import { Globe, Plus, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { mockCompetitors } from "@/lib/data"
import type { Competitor } from "@/lib/types"

export default function CompetitorIntakePage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(mockCompetitors)
  const [url, setUrl] = useState("")

  const addCompetitor = () => {
    if (!url.trim()) return
    const name = url.replace(/https?:\/\/(www\.)?/, "").split(".")[0]
    const newComp: Competitor = {
      id: `c${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      website: url,
      url: url,
      lastScraped: "-",
      status: "pending",
    }
    setCompetitors([...competitors, newComp])
    setUrl("")
  }

  const statusIcon = (s: Competitor["status"]) => {
    switch (s) {
      case "complete": return <CheckCircle className="w-4 h-4 text-green-400" />
      case "scraping": return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-zinc-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Competitor Intake</h2>
        <p className="text-zinc-500 text-sm mt-1">Monitor up to 25 public competitor websites for intelligence</p>
      </div>
      <div className="flex gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
          placeholder="https://competitor.com"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
        <button onClick={addCompetitor} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Website</th>
              <th className="p-4 font-medium">Last Scraped</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800 last:border-0 text-zinc-300">
                <td className="p-4">{statusIcon(c.status)}</td>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-zinc-500">{c.website}</td>
                <td className="p-4 text-zinc-500">{c.lastScraped}</td>
                <td className="p-4">
                  <button className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-600">{competitors.length}/25 URLs used</p>
    </div>
  )
}
