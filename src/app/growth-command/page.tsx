"use client"

import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react"
import { mockScenarios, mockCounties } from "@/lib/data"

export default function GrowthCommandPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Growth Command</h2>
        <p className="text-zinc-500 text-sm mt-1">Scenario engine for county demand, service-line opportunity, and launch sequencing</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {mockScenarios.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">{s.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  <span>Revenue</span>
                </div>
                <span className="text-white font-medium">${(s.projectedRevenue / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Staffing</span>
                </div>
                <span className="text-white font-medium">{s.staffingRequired}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Timeline</span>
                </div>
                <span className="text-white font-medium">{s.timelineMonths}mo</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Confidence</span>
                <span className={s.confidence >= 75 ? "text-green-400" : "text-amber-400"}>{s.confidence}%</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-600">{s.counties.join(", ")}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">County Demand Analysis</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-zinc-800">
              <th className="pb-3 font-medium">County</th>
              <th className="pb-3 font-medium">Population</th>
              <th className="pb-3 font-medium">Home Health</th>
              <th className="pb-3 font-medium">Wound Care</th>
              <th className="pb-3 font-medium">Therapy</th>
              <th className="pb-3 font-medium">Competition</th>
              <th className="pb-3 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody>
            {mockCounties.map((c) => (
              <tr key={c.county} className="border-b border-zinc-800 last:border-0 text-zinc-300">
                <td className="py-3 font-medium">{c.county}, {c.state}</td>
                <td className="py-3">{(c.population / 1000000).toFixed(1)}M</td>
                <td className="py-3">{c.homeHealthDemand.toLocaleString()}</td>
                <td className="py-3">{c.mobileWoundDemand.toLocaleString()}</td>
                <td className="py-3">{c.therapyCareDemand.toLocaleString()}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.competitionIntensity === "low" ? "bg-green-900 text-green-300"
                    : c.competitionIntensity === "medium" ? "bg-amber-900 text-amber-300"
                    : "bg-red-900 text-red-300"
                  }`}>{c.competitionIntensity}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        c.priorityScore >= 80 ? "bg-green-500" : c.priorityScore >= 70 ? "bg-amber-500" : "bg-zinc-600"
                      }`} style={{ width: `${c.priorityScore}%` }} />
                    </div>
                    <span className="text-xs">{c.priorityScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
