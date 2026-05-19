import { NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { Report } from "@/lib/types"

export async function GET() {
  return NextResponse.json({ reports: store.getReports() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const reports = store.getReports()
  const report: Report = {
    id: `r${Date.now()}`,
    title: body.title,
    type: body.type || "competitive",
    createdAt: new Date().toISOString().split("T")[0],
    summary: body.summary || "",
    findings: body.findings || [],
    exportFormats: [],
  }
  store.saveReports([report, ...reports])
  return NextResponse.json({ report })
}
