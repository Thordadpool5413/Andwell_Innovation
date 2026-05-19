import { NextRequest, NextResponse } from "next/server"
import { mockEvidence, mockBattlecardsOld as mockBattlecards, mockCompetitors } from "@/lib/data"

const SYSTEM_PROMPT = `You are Andwell Innovation Command Center, an AI competitive intelligence analyst for Andwell, a home healthcare company based in Maine.
Your role is to analyze competitors, market data, and growth opportunities specific to Maine's healthcare market.

Key context:
- Andwell is headquartered in Maine and serves all 16 Maine counties
- Maine has 1.39M residents, 61% rural, 21.2% over 65
- Key competitors: Northern Light Home Care (22% market share), MaineHealth Home Health (18%), Gentiva (8%), Amedisys (5% and expanding)
- Top underserved rural counties: Oxford, Somerset, Franklin, Piscataquis, Washington
- Service lines: Home Healthcare, Mobile Wound Care, Therapy Care

Use the provided evidence and battlecard data to answer questions. Be specific to Maine. Cite data when possible.`

function buildContext(query: string): string {
  const lower = query.toLowerCase()
  let context = "## Available Intelligence Data\n\n"

  const relevantBcs = mockBattlecards.filter(b =>
    b.competitorName.toLowerCase().includes(lower) ||
    lower.includes("battlecard") ||
    lower.includes("competitor") ||
    lower.includes("win") ||
    lower.includes("market")
  )
  if (relevantBcs.length > 0 || mockBattlecards.length > 0) {
    context += "### Battlecards\n"
    ;(relevantBcs.length > 0 ? relevantBcs : mockBattlecards).forEach(bc => {
      context += `- **${bc.competitorName}**: Win rate ${bc.winRate}%, Maine market share ${bc.maineMarketShare}%\n`
      context += `  Strengths: ${bc.strengths.join("; ")}\n`
      context += `  Weaknesses: ${bc.weaknesses.join("; ")}\n`
      context += `  Andwell Advantage: ${bc.andwellAdvantage.join("; ")}\n\n`
    })
  }

  const relevantEv = mockEvidence.filter(e =>
    e.snippet.toLowerCase().includes(lower) ||
    e.source.toLowerCase().includes(lower) ||
    !query
  )
  if (relevantEv.length > 0) {
    context += "### Evidence\n"
    relevantEv.slice(0, 8).forEach(e => {
      const comp = mockCompetitors.find(c => c.id === e.competitorId)
      context += `- [${comp?.name}] ${e.snippet} (${e.date}, relevance: ${e.relevance}/10)\n`
    })
    context += "\n"
  }

  context += "### All Competitors\n"
  mockCompetitors.forEach(c => {
    context += `- ${c.name}: Maine presence in ${c.maineCounties?.join(", ") || "unknown"}\n`
  })

  return context
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ answer: "Please provide a question." })

    const context = buildContext(query)

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${context}\n\n## Question\n${query}\n\nAnswer the question based on the intelligence data above. Be specific, mention Maine counties and competitors by name. If the data doesn't contain enough information, say so clearly.` },
      ],
      max_tokens: 800,
      temperature: 0.3,
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
      const errText = await res.text()
      console.error("OpenAI API error:", res.status, errText)
      return NextResponse.json({ answer: fallbackAnswer(query) })
    }

    const data = await res.json()
    return NextResponse.json({ answer: data.choices?.[0]?.message?.content || fallbackAnswer(query) })
  } catch (err) {
    console.error("Analysis error:", err)
    return NextResponse.json({ answer: fallbackAnswer("") })
  }
}

function fallbackAnswer(query: string): string {
  const lower = query.toLowerCase()

  if (lower.includes("northern light")) {
    return "**Northern Light Home Care** is Andwell's largest competitor with 22% Maine market share. They dominate in Penobscot, Aroostook, Hancock, and Washington counties through their integrated Northern Light Health system. Key weaknesses: limited wound care specialization and slower response times in southern Maine. Andwell advantage: 24h patient intake vs 72h industry average, superior rural wound care outcomes, and deeper relationships in underserved counties."
  }
  if (lower.includes("mainehealth")) {
    return "**MaineHealth Home Health** holds 18% market share concentrated in Cumberland, York, and mid-coast counties. They excel in coastal county coverage but have limited presence in northern/western Maine. They're launching a home-based wound care pilot in 5 coastal counties (Q3 2026). Andwell advantage: full-state coverage, mobile wound specialization, better rural staffing ratios."
  }
  if (lower.includes("gentiva")) {
    return "**Gentiva** operates in Maine with 8% market share, primarily in Portland and Lewiston. Their CMS star rating in Maine is 3.8/5 (below state avg 4.2). They added wound care certified nurses recently but lack rural county coverage. Andwell advantage: local decision-making, 4.5 CMS star rating, coverage in all 16 Maine counties."
  }
  if (lower.includes("amedisys")) {
    return "**Amedisys** is the newest entrant to Maine (5% share) with an aggressive expansion plan—hiring 40+ staff and partnering with MaineGeneral Health. They've identified Maine as a 'key expansion state' for 2026. Risk: they lack local relationships and Maine-specific experience. Andwell advantage: 10+ years of Maine operations, existing relationships across all major health systems."
  }
  if (lower.includes("rural") || lower.includes("underserved") || lower.includes("count")) {
    return "**High-priority underserved Maine counties for expansion:**\n\n1. **Piscataquis** (priority 92) - 88% rural, 28.9% over 65, only 1 home health agency\n2. **Oxford** (priority 91) - 72% rural, 24.1% over 65, only 2 agencies\n3. **Aroostook** (priority 90) - 82% rural, 24.8% over 65, 3 agencies for 67K people\n4. **Franklin** (priority 89) - 76% rural, 24.9% over 65, 1 agency\n5. **Somerset** (priority 88) - 78% rural, 22.7% over 65, 2 agencies"
  }
  if (lower.includes("wound") || lower.includes("wound care")) {
    return "**Maine Wound Care Market:** Only 3 of 6 competitors offer dedicated wound care services. Andwell's mobile wound program covers all 16 Maine counties—unique in rural areas. MaineHealth is launching a coastal wound pilot (Q3 2026). Amedisys hiring wound-certified staff. Andwell advantage: wound VAC therapy with remote monitoring, debridement at bedside, full rural coverage."
  }
  if (lower.includes("market share") || lower.includes("who is leading")) {
    return "**Maine Home Health Market Share:**\n- Northern Light Home Care: **22%** (leader)\n- MaineHealth Home Health: **18%**\n- Gentiva: **8%**\n- Amedisys: **5%** (growing)\n- VNA Home Health: **4%**\n- Interim HealthCare: **3%**\n\nAndwell is positioned to grow by focusing on the 12,400+ unserved rural patients and leveraging superior wound care capability."
  }

  return `I found intelligence on ${mockCompetitors.length} Maine competitors with ${mockEvidence.length} evidence items and ${mockBattlecards.length} battlecards. Ask me about a specific competitor (Northern Light, MaineHealth, Gentiva, Amedisys), a Maine county, or topics like wound care, rural expansion, or market share.`
}
