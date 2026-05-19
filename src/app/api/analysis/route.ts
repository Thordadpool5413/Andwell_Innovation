import { NextRequest, NextResponse } from "next/server"
import { mockEvidence, mockBattlecards } from "@/lib/data"

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  const lower = query.toLowerCase()
  const relevantEvidence = mockEvidence.filter(e => e.snippet.toLowerCase().includes(lower))
  const relevantBcs = mockBattlecards.filter(b => b.competitorName.toLowerCase().includes(lower))

  let answer = ""
  if (relevantBcs.length > 0) {
    const bc = relevantBcs[0]
    answer = `**${bc.competitorName}** - Win rate: ${bc.winRate}%\n\n`
    answer += `**Strengths:** ${bc.strengths.join(", ")}\n`
    answer += `**Weaknesses:** ${bc.weaknesses.join(", ")}\n`
    answer += `**Andwell Advantage:** ${bc.andwellAdvantage.join(", ")}\n`
  }
  if (relevantEvidence.length > 0) {
    answer += `\n**Recent intelligence:**\n`
    answer += relevantEvidence.slice(0, 3).map(e => `• ${e.snippet}`).join("\n")
  }
  if (!answer) {
    answer = `I found ${mockEvidence.length} evidence items and ${mockBattlecards.length} battlecards. Try asking about a specific competitor like Amedisys, LHC Group, Enhabit, or AccentCare.`
  }

  return NextResponse.json({ answer })
}
