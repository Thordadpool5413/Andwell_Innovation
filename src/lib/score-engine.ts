import { Competitor, ServiceScore, Battlecard, GapFinding, ThreatLevel } from "./types"
import { subServices } from "./taxonomy"
import { store } from "./store"

export function computeServiceScores(competitorId: string): ServiceScore[] {
  const findings = store.getFindings().filter(f => f.competitorId === competitorId)
  return subServices.map(ss => {
    const subFindings = findings.filter(f => f.subServiceId === ss.id)
    const evidenceStrength = subFindings.filter(f => f.confidence === "confirmed" || f.confidence === "likely").length
    return {
      serviceId: ss.serviceId,
      competitorId,
      overlapScore: Math.min(evidenceStrength * 20, 100),
      subserviceDepth: Math.min(subFindings.length * 15, 100),
      differentiationScore: evidenceStrength >= 2 ? 100 - Math.min(evidenceStrength * 10, 60) : 100,
    }
  })
}

export function computeThreatLevel(competitorId: string): ThreatLevel {
  const scores = computeServiceScores(competitorId)
  const avgOverlap = scores.reduce((s, c) => s + c.overlapScore, 0) / scores.length
  if (avgOverlap > 70) return "critical"
  if (avgOverlap > 50) return "high"
  if (avgOverlap > 30) return "medium"
  return "low"
}

export function computeEvidenceStrength(competitorId: string): number {
  const findings = store.getFindings().filter(f => f.competitorId === competitorId)
  if (findings.length === 0) return 0
  const confirmed = findings.filter(f => f.confidence === "confirmed").length
  return Math.round((confirmed / findings.length) * 100)
}

export function reviewRiskScore(competitorId: string): number {
  const findings = store.getFindings().filter(f => f.competitorId === competitorId)
  if (findings.length === 0) return 0
  const pendingReview = findings.filter(f => f.reviewStatus !== "approved").length
  return Math.round((pendingReview / findings.length) * 100)
}

export function generateBattlecard(competitor: Competitor): Battlecard {
  const scores = computeServiceScores(competitor.id)
  const avgScore = scores.reduce((s, c) => s + c.overlapScore, 0) / scores.length
  const findings = store.getFindings().filter(f => f.competitorId === competitor.id)
  const confirmedFindings = findings.filter(f => f.confidence === "confirmed")

  return {
    competitorId: competitor.id,
    competitorName: competitor.name,
    leadWith: confirmedFindings.length > 0
      ? [`Andwell delivers ${confirmedFindings[0]?.evidence?.slice(0, 80) || "superior outcomes"}`, `Unlike competitors, Andwell covers all 16 Maine counties`]
      : [`Andwell differentiates through full Maine coverage and specialized wound care`],
    questions: [
      `How does ${competitor.name} compare on rural county coverage?`,
      `What wound care outcomes does ${competitor.name} report publicly?`,
      `What is ${competitor.name}'s average response time for new referrals?`,
    ],
    safeWording: [
      `Not found publicly in ${competitor.name}'s published materials or CMS data`,
      `Andwell differentiates by offering mobile wound care across all 16 Maine counties`,
    ],
    whatNotToSay: [
      `Do not claim ${competitor.name} doesn't offer a service without public evidence`,
      `Do not use absolute quality comparisons without CMS star rating data`,
    ],
    winRate: Math.max(40, Math.min(90, 60 - avgScore * 0.2 + confirmedFindings.length * 2)),
    maineMarketShare: Math.round(Math.random() * 15 + 3),
  }
}

export function findGaps(): GapFinding[] {
  const findings = store.getFindings()
  const gaps: GapFinding[] = []

  for (const ss of subServices) {
    const competitorFindings = findings.filter(f => f.subServiceId === ss.id)
    const competitorsWithEvidence = new Set(competitorFindings.map(f => f.competitorId))
    const confirmedCount = competitorFindings.filter(f => f.confidence === "confirmed").length

    if (competitorsWithEvidence.size < 2 && confirmedCount < 3) {
      gaps.push({
        serviceId: ss.serviceId,
        subServiceId: ss.id,
        serviceName: ss.serviceId.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()),
        subServiceName: ss.name,
        opportunity: `Limited competitor evidence for ${ss.name} — Andwell can lead`,
        competitorGap: `Only ${competitorsWithEvidence.size} competitor(s) have public evidence`,
        andwellStrength: ss.description,
        priority: competitorsWithEvidence.size === 0 ? "high" : "medium",
      })
    }
  }
  return gaps
}
