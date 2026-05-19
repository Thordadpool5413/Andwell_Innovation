import fs from "fs"
import path from "path"
import { Competitor, Finding, Report, ReviewDecision, Battlecard, GapFinding } from "./types"

const DATA_DIR = path.join(process.cwd(), ".data")
const FILES: Record<string, string> = {
  competitors: "competitors.json",
  findings: "findings.json",
  reports: "reports.json",
  reviews: "reviews.json",
  battlecards: "battlecards.json",
  gaps: "gaps.json",
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function read<T>(key: string, fallback: T): T {
  ensureDir()
  const file = path.join(DATA_DIR, FILES[key] || `${key}.json`)
  if (!fs.existsSync(file)) return fallback
  try {
    const raw = fs.readFileSync(file, "utf-8")
    return JSON.parse(raw)
  } catch { return fallback }
}

function write<T>(key: string, data: T) {
  ensureDir()
  const file = path.join(DATA_DIR, FILES[key] || `${key}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export const store = {
  getCompetitors: () => read<Competitor[]>("competitors", []),
  saveCompetitors: (d: Competitor[]) => write("competitors", d),
  getFindings: () => read<Finding[]>("findings", []),
  saveFindings: (d: Finding[]) => write("findings", d),
  getReports: () => read<Report[]>("reports", []),
  saveReports: (d: Report[]) => write("reports", d),
  getReviews: () => read<ReviewDecision[]>("reviews", []),
  saveReviews: (d: ReviewDecision[]) => write("reviews", d),
  getBattlecards: () => read<Battlecard[]>("battlecards", []),
  saveBattlecards: (d: Battlecard[]) => write("battlecards", d),
  getGaps: () => read<GapFinding[]>("gaps", []),
  saveGaps: (d: GapFinding[]) => write("gaps", d),
}
