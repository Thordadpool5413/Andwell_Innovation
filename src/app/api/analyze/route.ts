import { NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { computeServiceScores, computeThreatLevel, computeEvidenceStrength, reviewRiskScore, generateBattlecard, findGaps } from "@/lib/score-engine"
import { Report } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { competitorId } = await req.json()

    if (competitorId) {
      const competitor = store.getCompetitors().find(c => c.id === competitorId)
      if (!competitor) return NextResponse.json({ error: "Competitor not found" }, { status: 404 })

      const scores = computeServiceScores(competitorId)
      const threatLevel = computeThreatLevel(competitorId)
      const evidenceStrength = computeEvidenceStrength(competitorId)
      const riskScore = reviewRiskScore(competitorId)
      const battlecard = generateBattlecard(competitor)

      store.saveBattlecards([
        ...store.getBattlecards().filter(b => b.competitorId !== competitorId),
        battlecard,
      ])

      const report: Report = {
        id: `r${Date.now()}`,
        title: `${competitor.name} Intelligence Report`,
        type: "competitive",
        createdAt: new Date().toISOString().split("T")[0],
        summary: `Analysis of ${competitor.name}. Threat level: ${threatLevel}. Evidence strength: ${evidenceStrength}%. Review risk: ${riskScore}%.`,
        findings: scores.map(s => `${s.serviceId}: overlap ${s.overlapScore}%, depth ${s.subserviceDepth}%, differentiation ${s.differentiationScore}%`),
        exportFormats: [],
      }
      store.saveReports([report, ...store.getReports()])

      return NextResponse.json({ scores, threatLevel, evidenceStrength, riskScore, battlecard, report })
    }

    const gaps = findGaps()
    store.saveGaps(gaps)

    return NextResponse.json({ gaps })
  } catch (err) {
    console.error("Analyze error:", err)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
