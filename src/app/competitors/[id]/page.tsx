"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { ArrowLeft, Shield, TrendingUp, Star, MapPin, FileText, CheckCircle, XCircle } from "lucide-react"
import { mockCompetitors, mockEvidence, mockBattlecardsOld } from "@/lib/data"
import { subServices } from "@/lib/taxonomy"

export default function CompetitorDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [showEvidence, setShowEvidence] = useState<string | null>(null)

  const competitor = useMemo(() => mockCompetitors.find(c => c.id === id), [id])
  const evidence = useMemo(() => mockEvidence.filter(e => e.competitorId === id), [id])
  const battlecard = useMemo(() => mockBattlecardsOld.find(b => b.competitorId === id), [id])
  const findings = useMemo(() => evidence.map(e => ({
    ...e,
    subServiceId: e.subServiceId || "hh-skilled-nursing",
    reviewStatus: "approved" as const,
  })), [evidence])

  if (!competitor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-zinc-500">Competitor not found</p>
        <button onClick={() => router.push("/competitor-intake")} className="text-sm text-blue-400 hover:text-blue-300">
          Back to Competitor Intake
        </button>
      </div>
    )
  }

  const threatColor = { critical: "bg-red-900 text-red-300", high: "bg-orange-900 text-orange-300", medium: "bg-amber-900 text-amber-300", low: "bg-green-900 text-green-300" }
  const evidenceStrength = Math.round(evidence.filter(e => e.confidence === "confirmed").length / Math.max(evidence.length, 1) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/competitor-intake")} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{competitor.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${threatColor[competitor.threatLevel]}`}>{competitor.threatLevel}</span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{competitor.website}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-semibold">Evidence Strength</span>
          </div>
          <div className="text-2xl font-bold text-white">{evidenceStrength}%</div>
          <div className="text-xs text-zinc-600 mt-1">{evidence.length} total items</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">{battlecard?.winRate || 50}%</div>
          <div className="text-xs text-zinc-600 mt-1">Based on intelligence</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-semibold">Maine Counties</span>
          </div>
          <div className="text-2xl font-bold text-white">{competitor.maineCounties.length}</div>
          <div className="text-xs text-zinc-600 mt-1">{competitor.maineCounties.slice(0, 3).join(", ")}{competitor.maineCounties.length > 3 ? "..." : ""}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-xs font-semibold">Market Share</span>
          </div>
          <div className="text-2xl font-bold text-white">{battlecard?.maineMarketShare || 0}%</div>
          <div className="text-xs text-zinc-600 mt-1">Maine market</div>
        </div>
      </div>

      {battlecard && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Battlecard Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-red-400 font-semibold mb-2">Competitor Strengths</p>
              <ul className="space-y-1.5">
                {battlecard.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-red-400 mt-1 shrink-0">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-green-400 font-semibold mb-2">Andwell Advantage</p>
              <ul className="space-y-1.5">
                {battlecard.andwellAdvantage.map((a, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1 shrink-0">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Service Coverage Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800">
                <th className="pb-3 font-medium">Subservice</th>
                <th className="pb-3 font-medium">Evidence</th>
                <th className="pb-3 font-medium">Confidence</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {subServices.map((ss) => {
                const ev = evidence.find(e => e.subServiceId === ss.id)
                return (
                  <tr key={ss.id} className="border-b border-zinc-800 last:border-0">
                    <td className="py-3 text-zinc-300">{ss.name}</td>
                    <td className="py-3">
                      {ev ? (
                        <button onClick={() => setShowEvidence(ev.id === showEvidence ? null : ev.id)} className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                          <FileText className="w-3 h-3" /> View
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-xs">Not found publicly</span>
                      )}
                    </td>
                    <td className="py-3">
                      {ev && (
                        <span className={`text-xs ${ev.confidence === "confirmed" ? "text-green-400" : ev.confidence === "likely" ? "text-blue-400" : "text-zinc-500"}`}>
                          {ev.confidence}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs flex items-center gap-1 ${ev ? "text-green-400" : "text-zinc-600"}`}>
                        {ev ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {ev ? "Found" : "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-zinc-600">{ev?.source || "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {showEvidence && (
          <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 font-semibold">Evidence Detail</p>
              <button onClick={() => setShowEvidence(null)} className="text-zinc-600 hover:text-white text-xs">Close</button>
            </div>
            {(() => {
              const ev = evidence.find(e => e.id === showEvidence)
              if (!ev) return <p className="text-sm text-zinc-600">Evidence not found</p>
              return (
                <div>
                  <p className="text-sm text-zinc-200 mb-2">{ev.snippet}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span>Source: {ev.source}</span>
                    <span>•</span>
                    <span>Date: {ev.date}</span>
                    <span>•</span>
                    <span>Relevance: {ev.relevance}/10</span>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">All Intelligence Findings</h3>
        <div className="space-y-3">
          {findings.map((ev) => (
            <div key={ev.id} className="p-3 bg-zinc-950 rounded-lg">
              <p className="text-sm text-zinc-300">{ev.snippet}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                <span>{ev.source}</span>
                <span>•</span>
                <span>{ev.date}</span>
                <span>•</span>
                <span className={ev.confidence === "confirmed" ? "text-green-400" : "text-blue-400"}>{ev.confidence}</span>
              </div>
            </div>
          ))}
          {findings.length === 0 && (
            <p className="text-sm text-zinc-600 text-center py-4">No intelligence findings yet. Use the crawl feature to gather data.</p>
          )}
        </div>
      </div>
    </div>
  )
}
