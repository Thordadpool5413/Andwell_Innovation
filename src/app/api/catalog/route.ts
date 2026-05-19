import { NextResponse } from "next/server"
import { mockCatalogItems } from "@/lib/data"

export async function GET() {
  return NextResponse.json({ catalog: mockCatalogItems })
}
