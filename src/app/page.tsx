"use client"

import { BarChart3, Crosshair, TrendingUp, Building2, Shield, AlertCircle, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { mockCompetitors, mockCounties, mockBattlecardsOld, maineOverview, mockEvidence } from "@/lib/data"
import { useLens } from "@/lib/lens-context"
import Link from "next/link"

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4"]

export default function DashboardPage() {
  const { lens } = useLens()

  const pendingReviews = mockEvidence.filter(e => !e.confidence || e.confidence === "possible").length
  const approvedCount = mockEvidence.filter(e => e.confidence === "confirmed").length
  const criticalCompetitors = mockCompetitors.filter(c => c.threatLevel === "high" || c.threatLevel === "critical").length

  const stats = [
    { label: "Maine Competitors Tracked", value: `${mockCompetitors.length}`, change: `${criticalCompetitors} with critical/high threat`, icon: Crosshair, color: "text-blue-400" },
    { label: "Avg Win Rate", value: `${Math.round(mockBattlecardsOld.reduce((s, b) => s + b.winRate, 0) / mockBattlecardsOld.length)}%`, change: "Across all Maine competitors", icon: BarChart3, color: "text-green-400" },
    { label: "Unserved Rural Patients", value: `${(maineOverview.unservedRuralPatients / 1000).toFixed(1)}K+`, change: "Addressable in 6 priority counties", icon: TrendingUp, color: "text-purple-400" },
    { label: "Maine Counties Covered", value: "16/16", change: "Full state coverage", icon: Building2, color: "text-amber-400" },
    { label: "Evidence Items", value: `${mockEvidence.length}`, change: `${approvedCount} confirmed`, icon: Shield, color: "text-cyan-400" },
    { label: "Pending Review", value: `${pendingReviews}`, change: "Awaiting approval", icon: Clock, color: "text-rose-400" },
  ]

  const shareData = mockBattlecardsOld.map(b => ({ name: b.competitorName, share: b.maineMarketShare, winRate: b.winRate }))
  const countyData = [...mockCounties].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8)
  const lensLabel = { executive: "Executive", "sales-leader": "Sales Leader", "sales-rep": "Sales Rep", admin: "Admin" }[lens]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Command Center</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300">{lensLabel} Lens</span>
          </div>
          <p className="text-zinc-500 text-sm mt-1">Maine-focused competitive intelligence and growth planning</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm">
            <span className="text-zinc-500">Maine Market</span>
            <span className="text-white ml-2 font-semibold">{maineOverview.population.toLocaleString()} residents</span>
          </div>
          <Link
            href="/review-center"
            className="flex items-center gap-2 bg-amber-900/30 border border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-300 hover:bg-amber-900/50 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {pendingReviews} pending review
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-zinc-600">Maine</span>
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
          <h3 className="font-semibold text-white mb-4">Maine Market Share</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shareData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#d4d4d8", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="share" name="Market Share" radius={[0, 4, 4, 0]}>
                  {shareData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Win Rate vs Competitors</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shareData}>
                <XAxis dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                  {shareData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Top Priority Maine Counties by Demand</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countyData}>
              <XAxis dataKey="county" tick={{ fill: "#d4d4d8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fff" }} />
              <Bar dataKey="homeHealthDemand" name="Home Health" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mobileWoundDemand" name="Wound Care" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="therapyCareDemand" name="Therapy" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
