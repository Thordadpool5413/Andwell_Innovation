import { Competitor, ServiceLine, Evidence, Battlecard, Report, CountyDemand, GrowthScenario, LaunchPlanStep, CatalogItem } from "./types"

export const serviceCatalog: ServiceLine[] = [
  { id: "sl1", name: "Home Healthcare", category: "home-healthcare", description: "Skilled nursing, PT, OT, speech therapy, and home health aide services" },
  { id: "sl2", name: "Mobile Wound Care", category: "mobile-wound", description: "Advanced wound management and mobile nursing for chronic wounds" },
  { id: "sl3", name: "Therapy Care", category: "therapy-care", description: "Physical, occupational, and speech therapy across settings" },
]

export const mockCompetitors: Competitor[] = [
  { id: "c1", name: "Amedisys", website: "https://amedisys.com", url: "https://amedisys.com", lastScraped: "2026-05-18", status: "complete" },
  { id: "c2", name: "LHC Group", website: "https://lhcgroup.com", url: "https://lhcgroup.com", lastScraped: "2026-05-17", status: "complete" },
  { id: "c3", name: "Enhabit", website: "https://enhabit.com", url: "https://enhabit.com", lastScraped: "2026-05-16", status: "complete" },
  { id: "c4", name: "AccentCare", website: "https://accentcare.com", url: "https://accentcare.com", lastScraped: "2026-05-15", status: "complete" },
]

export const mockEvidence: Evidence[] = [
  { id: "e1", competitorId: "c1", source: "Press Release", snippet: "Amedisys launched a new telehealth platform for chronic care management across 35 states", date: "2026-04-20", relevance: 8 },
  { id: "e2", competitorId: "c1", source: "Annual Report", snippet: "Reported 12% YoY growth in home health admissions, expanding into 8 new counties", date: "2026-03-15", relevance: 9 },
  { id: "e3", competitorId: "c2", source: "Website", snippet: "LHC Group partnered with 3 major hospital systems for post-acute care referrals", date: "2026-04-10", relevance: 7 },
  { id: "e4", competitorId: "c3", source: "Investor Call", snippet: "Enhabit restructuring focus toward higher-acuity home health patients", date: "2026-02-28", relevance: 6 },
  { id: "e5", competitorId: "c4", source: "News", snippet: "AccentCare expanding wound care certification program for field clinicians", date: "2026-05-01", relevance: 8 },
]

export const mockBattlecards: Battlecard[] = [
  {
    id: "bc1", competitorId: "c1", competitorName: "Amedisys",
    strengths: ["Large telehealth infrastructure", "Strong payer relationships", "35-state reach"],
    weaknesses: ["Higher cost structure", "Slower local decision-making", "Less personalized care"],
    andwellAdvantage: ["Superior outcomes in wound care", "Faster onboarding of new clinicians", "Local community presence"],
    winRate: 62, lastUpdated: "2026-05-18",
  },
  {
    id: "bc2", competitorId: "c2", competitorName: "LHC Group",
    strengths: ["Hospital system partnerships", "Strong referral network", "Breadth of service lines"],
    weaknesses: ["Integration challenges post-merger", "Inconsistent quality across regions", "Longer wait times for new patients"],
    andwellAdvantage: ["Faster referral-to-admission cycle", "Higher patient satisfaction scores", "Superior wound care outcomes"],
    winRate: 55, lastUpdated: "2026-05-17",
  },
  {
    id: "bc3", competitorId: "c3", competitorName: "Enhabit",
    strengths: ["Focus on higher-acuity patients", "Efficient cost structure", "Strong in rural markets"],
    weaknesses: ["Limited service line breadth", "Smaller geographic footprint", "Less investment in technology"],
    andwellAdvantage: ["Full continuum of care", "Advanced wound care capability", "Better technology platform"],
    winRate: 58, lastUpdated: "2026-05-16",
  },
  {
    id: "bc4", competitorId: "c4", competitorName: "AccentCare",
    strengths: ["Wound care specialization", "Clinician training programs", "Growing national presence"],
    weaknesses: ["Limited therapy services", "Smaller scale than top competitors", "Less brand recognition in new markets"],
    andwellAdvantage: ["Integrated therapy + wound care", "Scalable mobile wound platform", "Data-driven outcomes reporting"],
    winRate: 65, lastUpdated: "2026-05-15",
  },
]

export const mockReports: Report[] = [
  { id: "r1", title: "Q2 2026 Competitive Landscape", type: "competitive", createdAt: "2026-05-01", summary: "Analysis of top 4 competitors across 12 metrics including service breadth, technology investment, and market share trends." },
  { id: "r2", title: "Home Health Growth Opportunity Analysis", type: "growth", createdAt: "2026-04-28", summary: "County-level demand modeling identifying 18 high-priority counties for home health expansion in Q3-Q4 2026." },
  { id: "r3", title: "Board Presentation: Market Position & Strategy", type: "board", createdAt: "2026-04-15", summary: "Comprehensive board-level overview of competitive positioning, financial upside, and recommended strategic priorities." },
]

export const mockCounties: CountyDemand[] = [
  { county: "Harris", state: "TX", population: 4730000, homeHealthDemand: 18500, mobileWoundDemand: 4200, therapyCareDemand: 8900, competitionIntensity: "high", priorityScore: 92 },
  { county: "Maricopa", state: "AZ", population: 4420000, homeHealthDemand: 16200, mobileWoundDemand: 3800, therapyCareDemand: 7600, competitionIntensity: "medium", priorityScore: 88 },
  { county: "Clark", state: "NV", population: 2270000, homeHealthDemand: 9800, mobileWoundDemand: 2100, therapyCareDemand: 4500, competitionIntensity: "medium", priorityScore: 78 },
  { county: "Orange", state: "CA", population: 3186000, homeHealthDemand: 12400, mobileWoundDemand: 2800, therapyCareDemand: 5900, competitionIntensity: "high", priorityScore: 72 },
  { county: "Collin", state: "TX", population: 1100000, homeHealthDemand: 5200, mobileWoundDemand: 1100, therapyCareDemand: 2400, competitionIntensity: "low", priorityScore: 85 },
  { county: "Bexar", state: "TX", population: 2010000, homeHealthDemand: 8100, mobileWoundDemand: 1800, therapyCareDemand: 3700, competitionIntensity: "medium", priorityScore: 74 },
  { county: "Hillsborough", state: "FL", population: 1470000, homeHealthDemand: 6300, mobileWoundDemand: 1400, therapyCareDemand: 2900, competitionIntensity: "low", priorityScore: 80 },
]

export const mockScenarios: GrowthScenario[] = [
  { id: "gs1", name: "Home Health Southeast Expansion", serviceLine: "Home Healthcare", counties: ["Harris, TX", "Collin, TX", "Hillsborough, FL"], projectedRevenue: 4200000, staffingRequired: 48, timelineMonths: 9, confidence: 82 },
  { id: "gs2", name: "Mobile Wound Southwest Launch", serviceLine: "Mobile Wound Care", counties: ["Maricopa, AZ", "Clark, NV"], projectedRevenue: 2100000, staffingRequired: 24, timelineMonths: 6, confidence: 75 },
  { id: "gs3", name: "Therapy Care California Entry", serviceLine: "Therapy Care", counties: ["Orange, CA"], projectedRevenue: 1800000, staffingRequired: 30, timelineMonths: 12, confidence: 65 },
]

export const mockLaunchPlanSteps: LaunchPlanStep[] = [
  { week: 1, action: "Finalize priority county selection and market analysis", owner: "Strategy", status: "complete" },
  { week: 2, action: "Begin licensing and regulatory applications for target counties", owner: "Legal", status: "in-progress" },
  { week: 3, action: "Initiate recruiter engagement for key clinical roles", owner: "HR", status: "pending" },
  { week: 4, action: "Secure referral partnerships with top 5 hospital systems per county", owner: "Sales", status: "pending" },
  { week: 5, action: "Procure and configure mobile wound care units", owner: "Ops", status: "pending" },
  { week: 6, action: "Hire and onboard clinical leadership team", owner: "HR", status: "pending" },
  { week: 8, action: "Launch marketing campaign targeting discharge planners and case managers", owner: "Marketing", status: "pending" },
  { week: 10, action: "Go live: accept first patients in priority counties", owner: "Ops", status: "pending" },
  { week: 12, action: "90-day performance review and strategy adjustment", owner: "Leadership", status: "pending" },
]

export const mockCatalogItems: CatalogItem[] = [
  { id: "ci1", name: "Skilled Nursing Visits", description: "RN and LPN visits for medication management, wound care, patient education, and monitoring", category: "Home Healthcare", evidence: ["e1", "e4"] },
  { id: "ci2", name: "Mobile Wound Debridement", description: "Sharp, enzymatic, and mechanical debridement performed at patient bedside or home", category: "Mobile Wound Care", evidence: ["e5"] },
  { id: "ci3", name: "Physical Therapy", description: "Restorative and maintenance physical therapy for home health and outpatient settings", category: "Therapy Care", evidence: ["e2"] },
  { id: "ci4", name: "Wound VAC Therapy", description: "Negative pressure wound therapy for complex chronic wounds with remote monitoring", category: "Mobile Wound Care", evidence: ["e4", "e5"] },
]
