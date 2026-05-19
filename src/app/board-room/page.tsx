"use client"

import { Building2, TrendingUp, Shield, AlertTriangle, MapPin } from "lucide-react"
import { mockBattlecardsOld, mockCounties, mockScenarios, maineOverview } from "@/lib/data"

export default function BoardRoomPage() {
  const totalUpside = mockScenarios.reduce((s, c) => s + c.projectedRevenue, 0)
  const priorityCounties = [...mockCounties].filter(c => c.priorityScore >= 85).sort((a, b) => b.priorityScore - a.priorityScore)
  const avgWinRate = Math.round(mockBattlecardsOld.reduce((s, b) => s + b.winRate, 0) / mockBattlecardsOld.length)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Board Room</h2>
        <p className="text-zinc-500 text-sm mt-1">Maine market financial upside, priority counties, and competitive risk overlay</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Financial Upside</span>
          </div>
          <div className="text-3xl font-bold text-white">${(totalUpside / 1000000).toFixed(1)}M</div>
          <p className="text-sm text-zinc-500 mt-1">Projected expansion revenue across Maine</p>
          <div className="mt-3 text-xs text-zinc-600 space-y-1">
            {mockScenarios.map((s) => (
              <div key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-white">${(s.projectedRevenue / 1000000).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Priority Counties</span>
          </div>
          <div className="space-y-2">
            {priorityCounties.map((c) => (
              <div key={c.county} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-zinc-300">{c.county}, {c.state}</span>
                  <span className="text-xs text-zinc-600 ml-2">{c.population.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${c.priorityScore}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500">{c.priorityScore}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3">{priorityCounties.length} counties with priority score ≥ 85</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Competitive Position</span>
          </div>
          <div className="text-3xl font-bold text-white">{avgWinRate}%</div>
          <p className="text-sm text-zinc-500 mt-1">Average win rate vs Maine competitors</p>
          <div className="mt-3 text-xs space-y-1">
            {mockBattlecardsOld.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span className="text-zinc-600">{b.competitorName}</span>
                <span className={b.winRate >= 60 ? "text-green-400" : "text-amber-400"}>{b.winRate}% win | {b.maineMarketShare}% share</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-semibold text-zinc-300">Competitive Risk Overlay — Maine Market</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {mockBattlecardsOld.map((b) => (
            <div key={b.id} className="bg-zinc-950 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white text-sm">{b.competitorName}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  b.winRate >= 60 ? "bg-green-900 text-green-300" : "bg-amber-900 text-amber-400"
                }`}>
                  {b.winRate >= 60 ? "Manageable" : "Watch"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-1">Maine share: {b.maineMarketShare}%</p>
              <p className="text-xs text-zinc-600">Top strength: {b.strengths[0]}</p>
              <p className="text-xs text-zinc-600">Key weakness: {b.weaknesses[0]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-zinc-300">Maine Market Summary</span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-white">{maineOverview.population.toLocaleString()}</div>
            <div className="text-xs text-zinc-600 mt-1">Maine Population</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{maineOverview.over65Percent}%</div>
            <div className="text-xs text-zinc-600 mt-1">Aged 65+</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{maineOverview.homeHealthPatients.toLocaleString()}</div>
            <div className="text-xs text-zinc-600 mt-1">Annual Home Health Patients</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{maineOverview.unservedRuralPatients.toLocaleString()}</div>
            <div className="text-xs text-zinc-600 mt-1">Unserved Rural Need</div>
          </div>
        </div>
      </div>
    </div>
  )
}
