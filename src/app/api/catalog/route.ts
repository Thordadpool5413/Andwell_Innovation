import { NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"

export async function GET() {
  return NextResponse.json({ catalog: store.getFindings() })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const findings = store.getFindings()
  store.saveFindings(findings.map(f => f.id === body.id ? { ...f, ...body } : f))
  return NextResponse.json({ ok: true })
}
