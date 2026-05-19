import { ExportData } from "./types"
import { store } from "./store"

export function buildExportData(): ExportData {
  return {
    competitors: store.getCompetitors(),
    findings: store.getFindings(),
    reports: store.getReports(),
    battlecards: store.getBattlecards(),
    gaps: store.getGaps(),
  }
}

export function toCSV(data: ExportData): string {
  const rows: string[] = ["Type,Name,Detail,Date"]
  data.competitors.forEach(c => rows.push(`Competitor,${c.name},${c.website},${c.addedAt}`))
  data.findings.forEach(f => rows.push(`Finding,${f.id},${f.evidence.slice(0, 100)},${f.date}`))
  data.reports.forEach(r => rows.push(`Report,${r.title},${r.summary.slice(0, 100)},${r.createdAt}`))
  return rows.join("\n")
}

export function toJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

export function toHTML(data: ExportData): string {
  const compRows = data.competitors.map(c =>
    `<tr><td>${c.name}</td><td>${c.website}</td><td>${c.status}</td><td>${c.threatLevel}</td></tr>`
  ).join("")
  const findingRows = data.findings.map(f =>
    `<tr><td>${f.id}</td><td>${f.evidence.slice(0, 80)}</td><td>${f.confidence}</td><td>${f.reviewStatus}</td></tr>`
  ).join("")

  return `<!DOCTYPE html>
<html><head><title>Andwell Export</title>
<style>body{font-family:sans-serif;max-width:1200px;margin:auto;padding:20px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}</style></head>
<body>
<h1>Andwell Intelligence Export</h1>
<h2>Competitors (${data.competitors.length})</h2>
<table><tr><th>Name</th><th>Website</th><th>Status</th><th>Threat</th></tr>${compRows}</table>
<h2>Findings (${data.findings.length})</h2>
<table><tr><th>ID</th><th>Evidence</th><th>Confidence</th><th>Review</th></tr>${findingRows}</table>
</body></html>`
}
