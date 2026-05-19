"use client"

import { useState } from "react"
import { Send, Bot, User } from "lucide-react"
import type { Message } from "@/lib/types"

const sampleQuestions = [
  "How does Andwell compare to Amedisys in wound care?",
  "What are Amedisys's biggest weaknesses?",
  "Which competitors are expanding into new counties?",
]

export default function AskTheHubPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    const res = await fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input }),
    })
    const data = await res.json()
    setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Ask the Hub</h2>
        <p className="text-zinc-500 text-sm mt-1">Query competitive intelligence and growth data</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm mb-4">Ask a question about your competitive landscape</p>
            <div className="flex flex-wrap justify-center gap-2">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); sendMessage() }}
                  className="text-xs px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${
              m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about competitors, markets, or strategy..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
        <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
