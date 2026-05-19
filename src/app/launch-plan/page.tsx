"use client"

import { Rocket, CheckCircle, Clock, Circle } from "lucide-react"
import { mockLaunchPlanSteps, mockScenarios } from "@/lib/data"

export default function LaunchPlanPage() {
  const totalStaff = mockScenarios.reduce((s, c) => s + c.staffingRequired, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Launch Plan</h2>
        <p className="text-zinc-500 text-sm mt-1">Staffing model, 90-day execution timeline, and priority account plays</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-3xl font-bold text-white">{totalStaff}</div>
          <p className="text-sm text-zinc-500 mt-1">Total Staff Required</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-3xl font-bold text-white">{mockScenarios.length}</div>
          <p className="text-sm text-zinc-500 mt-1">Active Launch Scenarios</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-3xl font-bold text-white">{mockLaunchPlanSteps.filter(s => s.status === "complete").length}/{mockLaunchPlanSteps.length}</div>
          <p className="text-sm text-zinc-500 mt-1">Steps Completed</p>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">90-Day Execution Timeline</h3>
        <div className="space-y-0">
          {mockLaunchPlanSteps.map((step, i) => {
            const Icon = step.status === "complete" ? CheckCircle : step.status === "in-progress" ? Clock : Circle
            const color = step.status === "complete" ? "text-green-400" : step.status === "in-progress" ? "text-blue-400" : "text-zinc-600"
            return (
              <div key={i} className="flex items-start gap-4 pb-4 border-l-2 border-zinc-800 ml-2 pl-6 last:pb-0 relative">
                <div className={`absolute left-[-9px] bg-zinc-900 p-0.5 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-300">{step.action}</p>
                    <span className="text-xs text-zinc-600 shrink-0 ml-4">Week {step.week}</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">Owner: {step.owner}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
