"use client"

import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { mockBattlecards } from "@/lib/data"

export default function BattlecardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Battlecards</h2>
        <p className="text-zinc-500 text-sm mt-1">Competitive positioning cards for each tracked competitor</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {mockBattlecards.map((bc) => (
          <div key={bc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{bc.competitorName}</h3>
              <div className="flex items-center gap-1 text-sm">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className={bc.winRate >= 60 ? "text-green-400" : "text-amber-400"}>{bc.winRate}% win rate</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mb-2">
                  <TrendingUp className="w-3 h-3" /> Strengths
                </div>
                <ul className="space-y-1">
                  {bc.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold mb-2">
                  <TrendingDown className="w-3 h-3" /> Weaknesses
                </div>
                <ul className="space-y-1">
                  {bc.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-2">
                  <Minus className="w-3 h-3" /> Andwell Advantage
                </div>
                <ul className="space-y-1">
                  {bc.andwellAdvantage.map((a, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
