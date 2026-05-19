import { NextResponse } from "next/server"
import { mockReports } from "@/lib/data"

export async function GET() {
  return NextResponse.json({ reports: mockReports })
}
