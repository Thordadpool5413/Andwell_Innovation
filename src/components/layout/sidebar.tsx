"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLens } from "@/lib/lens-context"
import { BarChart3, Crosshair, Shield, FileText, MessageSquare, BookOpen, TrendingUp, Building2, Rocket, Activity, Settings, CheckSquare, Target } from "lucide-react"

const allNavItems = [
  { href: "/", label: "Dashboard", icon: BarChart3, lenses: ["executive", "sales-leader", "sales-rep", "admin"] as const },
  { href: "/competitor-intake", label: "Competitor Intake", icon: Crosshair, lenses: ["executive", "sales-leader", "admin"] as const },
  { href: "/evidence-matrix", label: "Evidence Matrix", icon: Shield, lenses: ["executive", "sales-leader", "sales-rep", "admin"] as const },
  { href: "/gap-finder", label: "Gap Finder", icon: Target, lenses: ["executive", "sales-leader", "admin"] as const },
  { href: "/battlecards", label: "Battlecards", icon: FileText, lenses: ["executive", "sales-leader", "sales-rep", "admin"] as const },
  { href: "/reports", label: "Reports", icon: FileText, lenses: ["executive", "sales-leader", "admin"] as const },
  { href: "/review-center", label: "Review Center", icon: CheckSquare, lenses: ["executive", "sales-leader", "admin"] as const },
  { href: "/ask-the-hub", label: "Ask the Hub", icon: MessageSquare, lenses: ["executive", "sales-leader", "sales-rep", "admin"] as const },
  { href: "/catalog", label: "Andwell Catalog", icon: BookOpen, lenses: ["sales-leader", "sales-rep", "admin"] as const },
  { href: "/growth-command", label: "Growth Command", icon: TrendingUp, lenses: ["executive", "sales-leader", "admin"] as const },
  { href: "/board-room", label: "Board Room", icon: Building2, lenses: ["executive", "admin"] as const },
  { href: "/launch-plan", label: "Launch Plan", icon: Rocket, lenses: ["executive", "sales-leader", "admin"] as const },
  { href: "/system-check", label: "System Check", icon: Activity, lenses: ["admin"] as const },
  { href: "/admin", label: "Settings", icon: Settings, lenses: ["admin"] as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const { lens } = useLens()
  const navItems = allNavItems.filter((item) => item.lenses.some((l) => l === lens))

  return (
    <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">Andwell</h1>
        <p className="text-xs text-zinc-500">Innovation Command Center</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
