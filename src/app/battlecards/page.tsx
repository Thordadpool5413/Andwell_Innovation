"use client"

"use client"

import { Shield, TrendingUp, TrendingDown, Minus, ExternalLink, MessageSquare } from "lucide-react"
import { useState } from "react"
import { mockBattlecardsOld, mockEvidence } from "@/lib/data"

export default function BattlecardsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)

  const bc = mockBattlecardsOld
  const evidence = mockEvidence

  const selectedCard = selected ? bc.find(b => b.id === selected) : null
  const selectedEvidence = selectedCard
    ? evidence.filter(e => e.competitorId === selectedCard.competitorId)
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Battlecards</h2>
        <p className="text-zinc-500 text-sm mt-1">Competitive positioning cards with talk tracks for each Maine competitor</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {bc.map((b) => (
          <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{b.competitorName}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                  {b.maineMarketShare}% share
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className={b.winRate >= 60 ? "text-green-400" : "text-amber-400"}>{b.winRate}% win rate</span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
              <p className="text-xs text-blue-400 font-semibold mb-1">Lead With</p>
              <p className="text-sm text-blue-200">{b.andwellAdvantage[0]}</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mb-2">
                  <TrendingUp className="w-3 h-3" /> Competitor Strengths
                </div>
                <ul className="space-y-1">
                  {b.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold mb-2">
                  <TrendingDown className="w-3 h-3" /> Exploitable Gaps
                </div>
                <ul className="space-y-1">
                  {b.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5 shrink-0">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-2">
                  <Minus className="w-3 h-3" /> Andwell Advantage
                </div>
                <ul className="space-y-1">
                  {b.andwellAdvantage.map((a, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5 shrink-0">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-zinc-600">
                <MessageSquare className="w-3 h-3" />
                <span>Last updated {b.lastUpdated}</span>
              </div>
              <button
                onClick={() => { setSelected(b.id); setShowDrawer(true) }}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3" /> View Evidence
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDrawer && selectedCard && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="bg-black/50 absolute inset-0" onClick={() => setShowDrawer(false)} />
          <div className="relative w-96 bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">{selectedCard.competitorName} Evidence</h3>
              <button onClick={() => setShowDrawer(false)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-4">
              {selectedEvidence.map((ev) => (
                <div key={ev.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <p className="text-sm text-zinc-300">{ev.snippet}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
                    <span>{ev.source}</span>
                    <span>•</span>
                    <span>{ev.date}</span>
                    <span>•</span>
                    <span>Relevance: {ev.relevance}/10</span>
                  </div>
                </div>
              ))}
              {selectedEvidence.length === 0 && (
                <p className="text-sm text-zinc-600">No evidence items found for this competitor.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
