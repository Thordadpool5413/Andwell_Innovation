import { NextResponse } from "next/server"
import { mockEvidence } from "@/lib/data"

export async function GET() {
  return NextResponse.json({ reviews: mockEvidence.filter(e => e.relevance >= 7) })
}
