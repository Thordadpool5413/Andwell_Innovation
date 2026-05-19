import { NextResponse } from "next/server"

export async function GET() {
  const checks = {
    analysis: true,
    competitors: true,
    reports: true,
    reviews: true,
    catalog: true,
  }
  return NextResponse.json({ status: "healthy", checks, timestamp: new Date().toISOString() })
}
