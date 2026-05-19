"use client"

import { FileText, Download, Eye } from "lucide-react"
import { mockReports } from "@/lib/data"

const typeColors: Record<string, string> = {
  competitive: "bg-blue-900 text-blue-300",
  growth: "bg-green-900 text-green-300",
  board: "bg-purple-900 text-purple-300",
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reports</h2>
        <p className="text-zinc-500 text-sm mt-1">Saved competitive, growth, and board-ready reports</p>
      </div>
      <div className="space-y-3">
        {mockReports.map((r) => (
          <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-zinc-600 mt-1" />
              <div>
                <h3 className="font-semibold text-white">{r.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{r.summary}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[r.type] || "bg-zinc-800 text-zinc-400"}`}>
                    {r.type}
                  </span>
                  <span className="text-xs text-zinc-600">{r.createdAt}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
