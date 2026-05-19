"use client"

import { Activity, CheckCircle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface ServiceStatus {
  name: string
  endpoint: string
  status?: "healthy" | "unhealthy" | "checking"
  latency?: string
}

const services: ServiceStatus[] = [
  { name: "Analysis API", endpoint: "/api/analysis" },
  { name: "Competitors API", endpoint: "/api/competitors" },
  { name: "Reports API", endpoint: "/api/reports" },
  { name: "Reviews API", endpoint: "/api/reviews" },
  { name: "Catalog API", endpoint: "/api/catalog" },
  { name: "Health Check", endpoint: "/api/health" },
  { name: "Version Info", endpoint: "/api/version" },
]

export default function SystemCheckPage() {
  const [checks, setChecks] = useState(services)

  useEffect(() => {
    async function checkAll() {
      const results = await Promise.all(
        services.map(async (s) => {
          const start = performance.now()
          try {
            const res = await fetch(s.endpoint)
            const latency = `${(performance.now() - start).toFixed(0)}ms`
            return { ...s, status: res.ok ? "healthy" as const : "unhealthy" as const, latency }
          } catch {
            return { ...s, status: "unhealthy" as const, latency: "err" }
          }
        })
      )
      setChecks(results)
    }
    checkAll()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Check</h2>
        <p className="text-zinc-500 text-sm mt-1">Diagnostics and service health monitoring</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-green-400" />
          <span className="text-sm text-zinc-400">All {checks.filter(c => c.status === "healthy").length}/{checks.length} services operational</span>
        </div>
        <div className="space-y-2">
          {checks.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-950">
              <div className="flex items-center gap-3">
                {!s.status || s.status === "checking" ? (
                  <Activity className="w-4 h-4 text-zinc-600 animate-pulse" />
                ) : s.status === "healthy" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-zinc-300">{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">{s.endpoint}</span>
                {s.latency && <span className="text-xs text-zinc-500">{s.latency}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
