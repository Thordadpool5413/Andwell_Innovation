"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Crosshair, Shield, FileText, MessageSquare, BookOpen, TrendingUp, Building2, Rocket, Activity } from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/competitor-intake", label: "Competitor Intake", icon: Crosshair },
  { href: "/evidence-matrix", label: "Evidence Matrix", icon: Shield },
  { href: "/battlecards", label: "Battlecards", icon: FileText },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/ask-the-hub", label: "Ask the Hub", icon: MessageSquare },
  { href: "/catalog", label: "Andwell Catalog", icon: BookOpen },
  { href: "/growth-command", label: "Growth Command", icon: TrendingUp },
  { href: "/board-room", label: "Board Room", icon: Building2 },
  { href: "/launch-plan", label: "Launch Plan", icon: Rocket },
  { href: "/system-check", label: "System Check", icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()

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
