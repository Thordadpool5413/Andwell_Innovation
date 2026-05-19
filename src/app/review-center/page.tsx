"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Edit3, Clock, AlertCircle, Search } from "lucide-react"
import { mockEvidence } from "@/lib/data"
import type { Finding, ReviewStatus } from "@/lib/types"

export default function ReviewCenterPage() {
  const [evidence, setEvidence] = useState<Finding[]>(
    mockEvidence.map(e => ({
      id: e.id,
      competitorId: e.competitorId,
      serviceId: e.serviceId || "home-health",
      subServiceId: e.subServiceId || "hh-skilled-nursing",
      evidence: e.snippet,
      source: e.source,
      date: e.date,
      confidence: (e.confidence as Finding["confidence"]) || "possible",
      reviewStatus: "pending" as ReviewStatus,
    }))
  )
  const [tab, setTab] = useState<ReviewStatus | "all">("pending")
  const [search, setSearch] = useState("")

  const updateStatus = (id: string, status: ReviewStatus, note?: string) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, reviewStatus: status, reviewNote: note || e.reviewNote } : e))
  }

  const tabs = [
    { id: "all" as const, label: "All", icon: Clock, color: "text-zinc-400" },
    { id: "pending" as const, label: "Pending", icon: AlertCircle, color: "text-amber-400" },
    { id: "approved" as const, label: "Approved", icon: CheckCircle, color: "text-green-400" },
    { id: "edited" as const, label: "Edited", icon: Edit3, color: "text-blue-400" },
    { id: "rejected" as const, label: "Rejected", icon: XCircle, color: "text-red-400" },
  ]

  const filtered = evidence.filter(e => {
    const matchTab = tab === "all" || e.reviewStatus === tab
    const matchSearch = e.evidence.toLowerCase().includes(search.toLowerCase()) || e.source.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts = {
    all: evidence.length,
    pending: evidence.filter(e => e.reviewStatus === "pending").length,
    approved: evidence.filter(e => e.reviewStatus === "approved").length,
    edited: evidence.filter(e => e.reviewStatus === "edited").length,
    rejected: evidence.filter(e => e.reviewStatus === "rejected").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Review Center</h2>
        <p className="text-zinc-500 text-sm mt-1">Approve, edit, or reject intelligence findings before they appear in battlecards</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                {t.label}
                <span className="text-xs text-zinc-600 ml-0.5">({counts[t.id]})</span>
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence..."
            className="bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ev) => (
          <div key={ev.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-zinc-200">{ev.evidence}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                  <span>{ev.source}</span>
                  <span>•</span>
                  <span>{ev.date}</span>
                  <span>•</span>
                  <span className={ev.confidence === "confirmed" ? "text-green-400" : ev.confidence === "likely" ? "text-blue-400" : "text-zinc-500"}>
                    {ev.confidence}
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ml-4 ${
                ev.reviewStatus === "approved" ? "bg-green-900 text-green-300" :
                ev.reviewStatus === "rejected" ? "bg-red-900 text-red-300" :
                ev.reviewStatus === "edited" ? "bg-blue-900 text-blue-300" :
                "bg-amber-900 text-amber-300"
              }`}>
                {ev.reviewStatus}
              </span>
            </div>

            {ev.reviewStatus === "pending" && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => updateStatus(ev.id, "approved")}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => {
                    const note = prompt("Edit comment (optional):")
                    updateStatus(ev.id, "edited", note || undefined)
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    const note = prompt("Rejection reason (optional):")
                    updateStatus(ev.id, "rejected", note || undefined)
                  }}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}

            {ev.reviewNote && (
              <div className="mt-2 text-xs text-zinc-500 italic">
                Note: {ev.reviewNote}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-600">{filtered.length} of {evidence.length} evidence items</p>
    </div>
  )
}
