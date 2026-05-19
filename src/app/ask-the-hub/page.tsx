"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import type { Message } from "@/lib/types"

const sampleQuestions = [
  "How does Andwell compare to Northern Light in Maine?",
  "Which Maine counties have the most unserved home health need?",
  "What is Amedisys doing in Maine?",
  "Who has the highest market share in Maine?",
  "What are the top expansion opportunities for Andwell?",
]

export default function AskTheHubPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (question?: string) => {
    const q = question || input
    if (!q.trim() || loading) return
    const userMsg: Message = { role: "user", content: q }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I could not process that request. Please try again." }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Ask the Hub</h2>
        <p className="text-zinc-500 text-sm mt-1">AI-powered competitive intelligence for the Maine market</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-zinc-400 font-medium mb-1">Ask about Maine&apos;s home health market</p>
            <p className="text-zinc-600 text-sm mb-6">Get AI-powered insights on competitors, counties, and growth strategy</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-left"
                >
                  <Sparkles className="w-3 h-3 inline mr-1 text-blue-400" />
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
            <div className={`max-w-2xl rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
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
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-zinc-800 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about competitors, Maine counties, or growth strategy..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white p-2.5 rounded-lg transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
