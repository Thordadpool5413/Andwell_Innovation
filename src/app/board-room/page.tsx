"use client"

import { Building2, TrendingUp, Shield, AlertTriangle } from "lucide-react"
import { mockBattlecards, mockCounties, mockScenarios } from "@/lib/data"

export default function BoardRoomPage() {
  const totalUpside = mockScenarios.reduce((s, c) => s + c.projectedRevenue, 0)
  const topCounties = [...mockCounties].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3)
  const avgWinRate = Math.round(mockBattlecards.reduce((s, b) => s + b.winRate, 0) / mockBattlecards.length)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Board Room</h2>
        <p className="text-zinc-500 text-sm mt-1">Executive-ready financial upside, priority counties, and competitive risk overlay</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Financial Upside</span>
          </div>
          <div className="text-3xl font-bold text-white">${(totalUpside / 1000000).toFixed(1)}M</div>
          <p className="text-sm text-zinc-500 mt-1">Projected annual revenue from growth scenarios</p>
          <div className="mt-3 text-xs text-zinc-600">
            <div>Home Healthcare: ${(mockScenarios[0]?.projectedRevenue / 1000000).toFixed(1)}M</div>
            <div>Mobile Wound: ${(mockScenarios[1]?.projectedRevenue / 1000000).toFixed(1)}M</div>
            <div>Therapy Care: ${(mockScenarios[2]?.projectedRevenue / 1000000).toFixed(1)}M</div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Priority Counties</span>
          </div>
          <div className="space-y-2">
            {topCounties.map((c) => (
              <div key={c.county} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{c.county}, {c.state}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.competitionIntensity === "low" ? "bg-green-900 text-green-300"
                  : c.competitionIntensity === "medium" ? "bg-amber-900 text-amber-300"
                  : "bg-red-900 text-red-300"
                }`}>{c.competitionIntensity}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Competitive Position</span>
          </div>
          <div className="text-3xl font-bold text-white">{avgWinRate}%</div>
          <p className="text-sm text-zinc-500 mt-1">Average win rate vs competitors</p>
          <div className="mt-3 text-xs text-zinc-600">
            {mockBattlecards.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span>{b.competitorName}</span>
                <span className={b.winRate >= 60 ? "text-green-400" : "text-amber-400"}>{b.winRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-red-400 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Competitive Risk Overlay</span>
        </div>
        <div className="space-y-3">
          {mockBattlecards.map((b) => (
            <div key={b.id} className="flex items-center justify-between pb-3 border-b border-zinc-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-300">{b.competitorName}</p>
                <p className="text-xs text-zinc-600">Top risk: {b.strengths[0]}</p>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                b.winRate >= 60 ? "bg-green-900 text-green-300" : "bg-amber-900 text-amber-400"
              }`}>
                {b.winRate >= 60 ? "Manageable" : "Monitor"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
