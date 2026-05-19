import { NextResponse } from "next/server"
import { mockCompetitors, mockEvidence } from "@/lib/data"

export async function GET() {
  return NextResponse.json({ competitors: mockCompetitors, evidence: mockEvidence })
}
