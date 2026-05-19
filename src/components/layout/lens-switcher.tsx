"use client"

import { Lens } from "@/lib/types"

const lenses: { id: Lens; label: string; icon: string }[] = [
  { id: "executive", label: "Executive", icon: "◇" },
  { id: "sales-leader", label: "Sales Leader", icon: "◆" },
  { id: "sales-rep", label: "Sales Rep", icon: "○" },
  { id: "admin", label: "Admin", icon: "●" },
]

export function LensSwitcher({ current, onSwitch }: { current: Lens; onSwitch: (l: Lens) => void }) {
  return (
    <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
      {lenses.map((l) => (
        <button
          key={l.id}
          onClick={() => onSwitch(l.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            current === l.id
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          <span>{l.icon}</span>
          {l.label}
        </button>
      ))}
    </div>
  )
}
