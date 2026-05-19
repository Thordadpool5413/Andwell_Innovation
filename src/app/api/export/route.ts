import { NextRequest, NextResponse } from "next/server"
import { buildExportData, toCSV, toJSON, toHTML } from "@/lib/export"

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "json"
  const data = buildExportData()

  switch (format) {
    case "csv":
      return new NextResponse(toCSV(data), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=andwell-export.csv" },
      })
    case "html":
      return new NextResponse(toHTML(data), {
        headers: { "Content-Type": "text/html", "Content-Disposition": "attachment; filename=andwell-export.html" },
      })
    default:
      return new NextResponse(toJSON(data), {
        headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=andwell-export.json" },
      })
  }
}
