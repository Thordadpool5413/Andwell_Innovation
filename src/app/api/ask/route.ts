import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are Andwell's competitive intelligence analyst, focused on Maine's home healthcare market.
Answer questions using ONLY the provided intelligence data. Never fabricate information.
Use "Not found publicly" for anything without evidence.
Key competitors: Northern Light Home Care (22% share), MaineHealth Home Health (18%), Gentiva (8%), Amedisys (5%).
Andwell covers all 16 Maine counties with Home Healthcare, Mobile Wound Care, and Therapy Care.`

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json()
    if (!query) return NextResponse.json({ answer: "Please provide a question." })

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${context || ""}\n\nQuestion: ${query}\n\nAnswer based on available intelligence. Use "Not found publicly" for unsupported claims.` },
      ],
      max_tokens: 800,
      temperature: 0.2,
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      return NextResponse.json({
        answer: "AI analysis unavailable. Using stored intelligence data.",
        sources: [],
      })
    }

    const data = await res.json()
    return NextResponse.json({
      answer: data.choices?.[0]?.message?.content || "Analysis complete based on available data.",
      sources: [],
    })
  } catch {
    return NextResponse.json({ answer: "Analysis unavailable. Using stored intelligence.", sources: [] })
  }
}
