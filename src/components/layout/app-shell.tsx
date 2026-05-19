"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import type { Lens } from "@/lib/types"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [lens, setLens] = useState<Lens>("executive")

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header lens={lens} onLensChange={setLens} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
