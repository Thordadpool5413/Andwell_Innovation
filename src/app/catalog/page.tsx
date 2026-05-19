"use client"

import { BookOpen, Search } from "lucide-react"
import { useState } from "react"
import { mockCatalogItems } from "@/lib/data"

export default function CatalogPage() {
  const [search, setSearch] = useState("")
  const filtered = mockCatalogItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Andwell Catalog</h2>
        <p className="text-zinc-500 text-sm mt-1">Service catalog with evidence-backed capability descriptions</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search catalog..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 inline-block mt-1">{item.category}</span>
                <p className="text-sm text-zinc-400 mt-2">{item.description}</p>
                <div className="mt-3">
                  <span className="text-xs text-zinc-600">{item.evidence.length} evidence items</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
