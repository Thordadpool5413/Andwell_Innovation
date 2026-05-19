"use client"

import { useState, useMemo } from "react"
import { Target, ArrowUp, ArrowDown, Minus, Search, Download, FileText } from "lucide-react"
import { mockEvidence } from "@/lib/data"
import { subServices } from "@/lib/taxonomy"
import type { GapFinding } from "@/lib/types"

export default function GapFinderPage() {
  const [priority, setPriority] = useState<string>("all")
  const [search, setSearch] = useState("")

  const gaps = useMemo(() => {
    const findings = mockEvidence
    const result: GapFinding[] = []

    for (const ss of subServices) {
      const compFindings = findings.filter(f => f.subServiceId === ss.id)
      const compsWithEvidence = new Set(compFindings.map(f => f.competitorId))
      const confirmed = compFindings.filter(f => f.confidence === "confirmed").length

      if (compsWithEvidence.size < 3 || confirmed < 2) {
        result.push({
          serviceId: ss.serviceId,
          subServiceId: ss.id,
          serviceName: ss.serviceId === "home-health" ? "Home Healthcare" : ss.serviceId === "mobile-wound" ? "Mobile Wound Care" : "Therapy Care",
          subServiceName: ss.name,
          opportunity: `Andwell can lead in ${ss.name} — limited competitor evidence in Maine`,
          competitorGap: `${compsWithEvidence.size} competitor(s) with public evidence, ${confirmed} confirmed finding(s)`,
          andwellStrength: ss.description,
          priority: compsWithEvidence.size <= 1 ? "high" : "medium",
        })
      }
    }
    return result
  }, [])

  const filtered = gaps.filter(g => {
    const matchSearch = g.subServiceName.toLowerCase().includes(search.toLowerCase()) || g.serviceName.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priority === "all" || g.priority === priority
    return matchSearch && matchPriority
  })

  const priorityIcon = (p: string) => {
    switch (p) {
      case "high": return <ArrowUp className="w-4 h-4 text-red-400" />
      case "medium": return <Minus className="w-4 h-4 text-amber-400" />
      default: return <ArrowDown className="w-4 h-4 text-green-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gap Finder</h2>
          <p className="text-zinc-500 text-sm mt-1">Service-level gaps where Andwell can differentiate from competitors</p>
        </div>
        <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((g, i) => (
          <div key={i} className={`bg-zinc-900 border rounded-xl p-5 ${g.priority === "high" ? "border-red-900" : "border-zinc-800"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">{g.subServiceName}</h3>
                  <span className="text-xs text-zinc-500">{g.serviceName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {priorityIcon(g.priority)}
                <span className={`text-xs font-medium ${g.priority === "high" ? "text-red-400" : "text-amber-400"}`}>
                  {g.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg mb-3">
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold mb-1">
                <ArrowUp className="w-3 h-3" /> Opportunity
              </div>
              <p className="text-sm text-green-200">{g.opportunity}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-950 rounded-lg">
                <div className="text-xs text-zinc-600 mb-1">Competitor Gap</div>
                <p className="text-sm text-zinc-300">{g.competitorGap}</p>
              </div>
              <div className="p-3 bg-zinc-950 rounded-lg">
                <div className="text-xs text-zinc-600 mb-1">Andwell Strength</div>
                <p className="text-sm text-zinc-300">{g.andwellStrength}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-600">
          <FileText className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p>No gaps found matching your filters</p>
        </div>
      )}

      <p className="text-xs text-zinc-600">{filtered.length} gap(s) identified from {subServices.length} subservices analyzed</p>
    </div>
  )
}
