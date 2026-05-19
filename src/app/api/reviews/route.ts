import { NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { ReviewDecision } from "@/lib/types"

export async function GET() {
  return NextResponse.json({ reviews: store.getReviews() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const reviews = store.getReviews()
  const decision: ReviewDecision = {
    id: `rev${Date.now()}`,
    findingId: body.findingId,
    status: body.status || "pending",
    comment: body.comment || "",
    reviewedAt: new Date().toISOString(),
    reviewer: body.reviewer || "system",
  }
  store.saveReviews([decision, ...reviews])

  const findings = store.getFindings()
  store.saveFindings(findings.map(f =>
    f.id === body.findingId ? { ...f, reviewStatus: body.status, reviewNote: body.comment } : f
  ))
  return NextResponse.json({ review: decision })
}
