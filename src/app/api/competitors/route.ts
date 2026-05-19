import { NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { Competitor } from "@/lib/types"

export async function GET() {
  return NextResponse.json({ competitors: store.getCompetitors() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const competitors = store.getCompetitors()
  const newComp: Competitor = {
    id: `c${Date.now()}`,
    name: body.name || body.url?.replace(/https?:\/\/(www\.)?/, "").split(".")[0],
    website: body.url || "",
    addedAt: new Date().toISOString().split("T")[0],
    lastCrawled: null,
    status: "pending",
    maineCounties: [],
    threatLevel: "low",
  }
  store.saveCompetitors([...competitors, newComp])
  return NextResponse.json({ competitor: newComp })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const competitors = store.getCompetitors()
  store.saveCompetitors(competitors.map(c => c.id === body.id ? { ...c, ...body } : c))
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  store.saveCompetitors(store.getCompetitors().filter(c => c.id !== id))
  return NextResponse.json({ ok: true })
}
