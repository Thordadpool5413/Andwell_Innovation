"use client"

import { BarChart3, Crosshair, TrendingUp, Building2, Rocket, Activity } from "lucide-react"

const stats = [
  { label: "Competitors Tracked", value: "4", change: "+2 this quarter", icon: Crosshair, color: "text-blue-400" },
  { label: "Win Rate", value: "62%", change: "+5% vs Q1", icon: BarChart3, color: "text-green-400" },
  { label: "Priority Counties", value: "18", change: "3 new identified", icon: TrendingUp, color: "text-purple-400" },
  { label: "Board Readiness", value: "87%", change: "Updated today", icon: Building2, color: "text-amber-400" },
  { label: "Active Launches", value: "3", change: "On track", icon: Rocket, color: "text-cyan-400" },
  { label: "System Health", value: "All OK", change: "7/7 services", icon: Activity, color: "text-emerald-400" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Command Center</h2>
        <p className="text-zinc-500 text-sm mt-1">Executive overview of competitive intelligence and growth planning</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-zinc-600">Last 24h</span>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
              <div className="text-xs text-zinc-600 mt-2">{s.change}</div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Recent Intelligence</h3>
          <div className="space-y-3">
            {[
              { title: "Amedisys telehealth expansion", source: "Press Release", time: "2h ago" },
              { title: "LHC Group partnership with 3 hospital systems", source: "News", time: "1d ago" },
              { title: "Enhabit Q2 earnings - restructuring update", source: "Investor Call", time: "2d ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{item.title}</p>
                  <p className="text-xs text-zinc-600">{item.source} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Growth Pipeline</h3>
          <div className="space-y-3">
            {[
              { county: "Harris, TX", action: "Home Health expansion", status: "Planning" },
              { county: "Maricopa, AZ", action: "Mobile Wound launch", status: "Licensing" },
              { county: "Collin, TX", action: "Full service entry", status: "Recruiting" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-300">{item.county}</p>
                  <p className="text-xs text-zinc-600">{item.action}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
