import { Competitor, Evidence, BattlecardOld, Report, MaineCounty, CountyDemand, GrowthScenario, LaunchPlanStep, CatalogItem } from "./types"

export const serviceCatalog = [
  { id: "sl1", name: "Home Healthcare", category: "home-healthcare", description: "Skilled nursing, PT, OT, speech therapy, and home health aide services across Maine" },
  { id: "sl2", name: "Mobile Wound Care", category: "mobile-wound", description: "Advanced wound management and mobile nursing for chronic wounds across Maine's rural communities" },
  { id: "sl3", name: "Therapy Care", category: "therapy-care", description: "Physical, occupational, and speech therapy across home and community settings in Maine" },
]

export const maineCounties: MaineCounty[] = [
  { name: "Cumberland", population: 303069, over65Percent: 18.2, medianIncome: 72438, ruralPercent: 28, homeHealthAgencies: 12 },
  { name: "York", population: 211972, over65Percent: 21.4, medianIncome: 67128, ruralPercent: 42, homeHealthAgencies: 8 },
  { name: "Penobscot", population: 152199, over65Percent: 20.1, medianIncome: 54327, ruralPercent: 55, homeHealthAgencies: 7 },
  { name: "Kennebec", population: 123358, over65Percent: 21.8, medianIncome: 56214, ruralPercent: 48, homeHealthAgencies: 5 },
  { name: "Androscoggin", population: 108320, over65Percent: 19.5, medianIncome: 53182, ruralPercent: 35, homeHealthAgencies: 6 },
  { name: "Oxford", population: 58232, over65Percent: 24.1, medianIncome: 48215, ruralPercent: 72, homeHealthAgencies: 2 },
  { name: "Hancock", population: 55112, over65Percent: 25.3, medianIncome: 56431, ruralPercent: 68, homeHealthAgencies: 3 },
  { name: "Somerset", population: 50484, over65Percent: 22.7, medianIncome: 42187, ruralPercent: 78, homeHealthAgencies: 2 },
  { name: "Aroostook", population: 67105, over65Percent: 24.8, medianIncome: 44321, ruralPercent: 82, homeHealthAgencies: 3 },
  { name: "Knox", population: 40061, over65Percent: 26.2, medianIncome: 56123, ruralPercent: 58, homeHealthAgencies: 2 },
  { name: "Waldo", population: 39993, over65Percent: 23.5, medianIncome: 52341, ruralPercent: 65, homeHealthAgencies: 1 },
  { name: "Washington", population: 31395, over65Percent: 27.1, medianIncome: 39872, ruralPercent: 85, homeHealthAgencies: 1 },
  { name: "Lincoln", population: 34637, over65Percent: 28.4, medianIncome: 58321, ruralPercent: 62, homeHealthAgencies: 2 },
  { name: "Sagadahoc", population: 36198, over65Percent: 22.1, medianIncome: 65432, ruralPercent: 40, homeHealthAgencies: 2 },
  { name: "Franklin", population: 29456, over65Percent: 24.9, medianIncome: 44567, ruralPercent: 76, homeHealthAgencies: 1 },
  { name: "Piscataquis", population: 16865, over65Percent: 28.9, medianIncome: 39234, ruralPercent: 88, homeHealthAgencies: 1 },
]

export const mockCompetitors: Competitor[] = [
  { id: "c1", name: "Northern Light Home Care", website: "https://northernlighthealth.org", url: "https://northernlighthealth.org/home-care", lastScraped: "2026-05-19", addedAt: "2026-01-15", lastCrawled: "2026-05-19", status: "complete", mainePresence: "yes", threatLevel: "high", maineCounties: ["Penobscot", "Aroostook", "Hancock", "Washington"] },
  { id: "c2", name: "MaineHealth Home Health", website: "https://mainehealth.org", url: "https://mainehealth.org/services/home-health", lastScraped: "2026-05-19", addedAt: "2026-01-15", lastCrawled: "2026-05-19", status: "complete", mainePresence: "yes", threatLevel: "high", maineCounties: ["Cumberland", "York", "Lincoln", "Sagadahoc", "Knox", "Waldo"] },
  { id: "c3", name: "Gentiva", website: "https://gentiva.com", url: "https://gentiva.com/locations/maine", lastScraped: "2026-05-18", addedAt: "2026-02-01", lastCrawled: "2026-05-18", status: "complete", mainePresence: "yes", threatLevel: "medium", maineCounties: ["Cumberland", "York", "Androscoggin"] },
  { id: "c4", name: "Amedisys", website: "https://amedisys.com", url: "https://amedisys.com/locations/maine", lastScraped: "2026-05-18", addedAt: "2026-03-01", lastCrawled: "2026-05-18", status: "complete", mainePresence: "yes", threatLevel: "medium", maineCounties: ["Kennebec", "Androscoggin", "Oxford", "Franklin"] },
  { id: "c5", name: "Interim HealthCare", website: "https://interimhealthcare.com", url: "https://interimhealthcare.com/locations/maine", lastScraped: "2026-05-17", addedAt: "2026-01-20", lastCrawled: "2026-05-17", status: "complete", mainePresence: "yes", threatLevel: "low", maineCounties: ["Cumberland", "York"] },
  { id: "c6", name: "VNA Home Health", website: "https://vna.org", url: "https://vna.org/maine", lastScraped: "2026-05-16", addedAt: "2026-01-10", lastCrawled: "2026-05-16", status: "complete", mainePresence: "yes", threatLevel: "low", maineCounties: ["Cumberland", "York", "Sagadahoc", "Lincoln"] },
]

export const mockEvidence: Evidence[] = [
  { id: "e1", competitorId: "c1", source: "Northern Light Annual Report", snippet: "Northern Light Home Care expanded telehealth monitoring for 1,200+ patients across Penobscot and Aroostook counties in 2025", date: "2026-03-20", relevance: 9, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-skilled-nursing", confidence: "confirmed" },
  { id: "e2", competitorId: "c1", source: "Press Release", snippet: "Northern Light Health opened new home health hub in Bangor serving 7 rural counties", date: "2026-02-10", relevance: 8, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-post-hospital", confidence: "confirmed" },
  { id: "e3", competitorId: "c2", source: "MaineHealth Website", snippet: "MaineHealth Home Health reports 15% growth in skilled nursing visits across Cumberland and York counties", date: "2026-04-05", relevance: 8, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-skilled-nursing", confidence: "confirmed" },
  { id: "e4", competitorId: "c2", source: "DHHS Filing", snippet: "MaineHealth received certificate of need for expanded home health services in Lincoln and Knox counties", date: "2026-01-28", relevance: 9, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-post-hospital", confidence: "confirmed" },
  { id: "e5", competitorId: "c3", source: "Gentiva Corporate", snippet: "Gentiva added wound care certified nurses to their Portland and Lewiston offices targeting chronic wound patients", date: "2026-04-15", relevance: 7, maineRelevance: true, serviceId: "mobile-wound", subServiceId: "mw-chronic-wound", confidence: "confirmed" },
  { id: "e6", competitorId: "c3", source: "Press Release", snippet: "Gentiva Maine operations restructured under new regional director for Northern New England", date: "2026-03-01", relevance: 6, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-skilled-nursing", confidence: "likely" },
  { id: "e7", competitorId: "c4", source: "Amedisys Investor Day", snippet: "Amedisys identified Maine as a 'key expansion state' for 2026 with focus on Kennebec and Androscoggin counties", date: "2026-05-01", relevance: 10, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-chronic-disease", confidence: "confirmed" },
  { id: "e8", competitorId: "c4", source: "Press Release", snippet: "Amedisys partnering with MaineGeneral Health for post-acute care transitions in Augusta region", date: "2026-04-20", relevance: 9, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-post-hospital", confidence: "confirmed" },
  { id: "e9", competitorId: "c5", source: "Interim HealthCare News", snippet: "Interim HealthCare of Maine launched companion care program for seniors aging in place in Portland metro", date: "2026-02-22", relevance: 6, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-palliative", confidence: "likely" },
  { id: "e10", competitorId: "c6", source: "VNA Home Health Report", snippet: "VNA of Maine reports 98% patient satisfaction but struggles with rural coverage gaps in Washington County", date: "2026-03-15", relevance: 7, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-skilled-nursing", confidence: "confirmed" },
  { id: "e11", competitorId: "c1", source: "Maine DHHS Data", snippet: "Northern Light captured 22% of Maine's home health Medicare referrals in 2025, highest in the state", date: "2026-04-01", relevance: 9, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-skilled-nursing", confidence: "confirmed" },
  { id: "e12", competitorId: "c2", source: "MaineHealth News", snippet: "MaineHealth launching home-based wound care pilot in 5 coastal counties starting Q3 2026", date: "2026-05-10", relevance: 9, maineRelevance: true, serviceId: "mobile-wound", subServiceId: "mw-debridement", confidence: "confirmed" },
  { id: "e13", competitorId: "c3", source: "CMS Data", snippet: "Gentiva's Maine patient outcomes score 3.8/5 stars vs 4.2/5 state average", date: "2026-04-28", relevance: 7, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-chronic-disease", confidence: "confirmed" },
  { id: "e14", competitorId: "c4", source: "Amedisys SEC Filing", snippet: "Amedisys plans to hire 40+ clinical staff for Maine operations in 2026", date: "2026-05-05", relevance: 8, maineRelevance: true, serviceId: "home-health", subServiceId: "hh-post-hospital", confidence: "confirmed" },
]

export const mockBattlecardsOld: BattlecardOld[] = [
  {
    id: "bc1", competitorId: "c1", competitorName: "Northern Light Home Care",
    strengths: ["Dominant 22% Maine market share", "Strong referral network across Northern Light Health system", "Telehealth infrastructure in rural counties", "Established presence in 10+ Maine counties"],
    weaknesses: ["Higher cost structure than independent providers", "Slower response times in southern Maine", "Less specialized wound care capability", "Limited therapy services in rural areas"],
    andwellAdvantage: ["Faster patient intake (24h vs 72h industry avg)", "Superior wound care outcomes in rural settings", "More flexible care scheduling", "Deep local relationships in underserved counties"],
    winRate: 48, lastUpdated: "2026-05-19", maineMarketShare: 22,
  },
  {
    id: "bc2", competitorId: "c2", competitorName: "MaineHealth Home Health",
    strengths: ["Strong brand recognition in southern Maine", "Integrated with MaineHealth hospital system", "Excellent coastal county coverage", "High patient satisfaction scores"],
    weaknesses: ["Limited presence in northern/western Maine", "Less experience with mobile wound care", "Slower to adopt new care models", "Higher staff turnover in rural areas"],
    andwellAdvantage: ["Full-state coverage vs regional focus", "Mobile wound care specialization", "Better rural staffing ratios", "More competitive pricing in mid-coast region"],
    winRate: 52, lastUpdated: "2026-05-19", maineMarketShare: 18,
  },
  {
    id: "bc3", competitorId: "c3", competitorName: "Gentiva",
    strengths: ["National brand and resources", "Wound care certification programs", "Corporate investment capacity", "Established Portland/Lewiston presence"],
    weaknesses: ["Below-average CMS star rating in Maine", "Limited rural county coverage", "Decisions made by regional rather than local leadership", "Higher patient turnover"],
    andwellAdvantage: ["Local decision-making and agility", "Better CMS outcomes (4.5 vs 3.8 stars)", "Coverage in all 16 Maine counties", "Deeper community integration"],
    winRate: 61, lastUpdated: "2026-05-18", maineMarketShare: 8,
  },
  {
    id: "bc4", competitorId: "c4", competitorName: "Amedisys",
    strengths: ["Aggressive Maine expansion plans", "Strong hospital partnerships (MaineGeneral)", "National best practices and training", "Capital for hiring spree (40+ staff)"],
    weaknesses: ["New to Maine market - limited relationships", "Unknown quality track record locally", "National staffing model vs local needs", "Potential integration challenges"],
    andwellAdvantage: ["10+ years of Maine market experience", "Existing relationships across all major health systems", "Proven rural care delivery model", "Higher staff retention and local knowledge"],
    winRate: 58, lastUpdated: "2026-05-18", maineMarketShare: 5,
  },
  {
    id: "bc5", competitorId: "c5", competitorName: "Interim HealthCare",
    strengths: ["Nationally recognized brand", "Companion care differentiation", "Portland metro presence"],
    weaknesses: ["Very limited Maine footprint", "No rural county services", "Limited to companion/personal care", "No wound care specialty"],
    andwellAdvantage: ["Full clinical service line", "Rural county coverage", "Wound care expertise", "Insurance/Medicare certified across all Maine counties"],
    winRate: 72, lastUpdated: "2026-05-17", maineMarketShare: 3,
  },
  {
    id: "bc6", competitorId: "c6", competitorName: "VNA Home Health",
    strengths: ["98% patient satisfaction", "Long history in Maine communities", "Trusted VNA brand", "Coastal county presence"],
    weaknesses: ["Struggles with rural coverage", "Limited technology investment", "No wound care specialization", "Financial constraints limiting expansion"],
    andwellAdvantage: ["Advanced mobile wound technology", "Data-driven outcomes tracking", "Full Maine county coverage", "Financial stability for growth investment"],
    winRate: 65, lastUpdated: "2026-05-16", maineMarketShare: 4,
  },
]

export const mockReports: Report[] = [
  { id: "r1", title: "Maine Home Health Market Analysis Q2 2026", type: "competitive", createdAt: "2026-05-15", summary: "Comprehensive analysis of 6 competitors across Maine's home health market. Northern Light leads at 22% share, with MaineHealth at 18%. Andwell positioned for growth in underserved rural counties." },
  { id: "r2", title: "Rural Maine Growth Opportunity Assessment", type: "growth", createdAt: "2026-05-10", summary: "County-level analysis identifies Oxford, Somerset, Franklin, and Piscataquis as high-priority underserved counties for home health and wound care expansion." },
  { id: "r3", title: "Board Presentation: Maine Market Strategy FY2027", type: "board", createdAt: "2026-05-01", summary: "Full board package covering competitive positioning, $8.2M growth pipeline, 6-county expansion plan, and competitive risk mitigation strategy." },
  { id: "r4", title: "Maine Wound Care Competitive Landscape", type: "competitive", createdAt: "2026-04-20", summary: "Deep dive into wound care services across Maine competitors. Only 3 of 6 competitors offer dedicated wound care. Andwell has strongest rural wound care capability." },
]

export const mockCounties: CountyDemand[] = [
  { county: "Cumberland", state: "ME", population: 303069, homeHealthDemand: 15200, mobileWoundDemand: 3400, therapyCareDemand: 7200, competitionIntensity: "high", priorityScore: 75 },
  { county: "York", state: "ME", population: 211972, homeHealthDemand: 11800, mobileWoundDemand: 2600, therapyCareDemand: 5500, competitionIntensity: "high", priorityScore: 70 },
  { county: "Penobscot", state: "ME", population: 152199, homeHealthDemand: 9100, mobileWoundDemand: 2100, therapyCareDemand: 4300, competitionIntensity: "medium", priorityScore: 82 },
  { county: "Kennebec", state: "ME", population: 123358, homeHealthDemand: 7400, mobileWoundDemand: 1700, therapyCareDemand: 3500, competitionIntensity: "medium", priorityScore: 78 },
  { county: "Androscoggin", state: "ME", population: 108320, homeHealthDemand: 6500, mobileWoundDemand: 1500, therapyCareDemand: 3100, competitionIntensity: "medium", priorityScore: 76 },
  { county: "Oxford", state: "ME", population: 58232, homeHealthDemand: 4200, mobileWoundDemand: 1100, therapyCareDemand: 2100, competitionIntensity: "low", priorityScore: 91 },
  { county: "Hancock", state: "ME", population: 55112, homeHealthDemand: 3900, mobileWoundDemand: 1000, therapyCareDemand: 1900, competitionIntensity: "low", priorityScore: 85 },
  { county: "Somerset", state: "ME", population: 50484, homeHealthDemand: 3800, mobileWoundDemand: 950, therapyCareDemand: 1800, competitionIntensity: "low", priorityScore: 88 },
  { county: "Aroostook", state: "ME", population: 67105, homeHealthDemand: 4800, mobileWoundDemand: 1200, therapyCareDemand: 2300, competitionIntensity: "low", priorityScore: 90 },
  { county: "Knox", state: "ME", population: 40061, homeHealthDemand: 2900, mobileWoundDemand: 700, therapyCareDemand: 1400, competitionIntensity: "low", priorityScore: 80 },
  { county: "Waldo", state: "ME", population: 39993, homeHealthDemand: 2800, mobileWoundDemand: 650, therapyCareDemand: 1300, competitionIntensity: "low", priorityScore: 83 },
  { county: "Washington", state: "ME", population: 31395, homeHealthDemand: 2600, mobileWoundDemand: 600, therapyCareDemand: 1200, competitionIntensity: "low", priorityScore: 86 },
  { county: "Lincoln", state: "ME", population: 34637, homeHealthDemand: 2500, mobileWoundDemand: 550, therapyCareDemand: 1100, competitionIntensity: "low", priorityScore: 79 },
  { county: "Sagadahoc", state: "ME", population: 36198, homeHealthDemand: 2200, mobileWoundDemand: 500, therapyCareDemand: 1000, competitionIntensity: "low", priorityScore: 74 },
  { county: "Franklin", state: "ME", population: 29456, homeHealthDemand: 2300, mobileWoundDemand: 550, therapyCareDemand: 1100, competitionIntensity: "low", priorityScore: 89 },
  { county: "Piscataquis", state: "ME", population: 16865, homeHealthDemand: 1500, mobileWoundDemand: 350, therapyCareDemand: 700, competitionIntensity: "low", priorityScore: 92 },
]

export const mockScenarios: GrowthScenario[] = [
  { id: "gs1", name: "Rural Maine Home Health Expansion", serviceLine: "Home Healthcare", counties: ["Oxford, ME", "Somerset, ME", "Franklin, ME", "Piscataquis, ME"], projectedRevenue: 3200000, staffingRequired: 36, timelineMonths: 10, confidence: 78 },
  { id: "gs2", name: "Northern Maine Wound Care Launch", serviceLine: "Mobile Wound Care", counties: ["Aroostook, ME", "Washington, ME", "Penobscot, ME"], projectedRevenue: 1800000, staffingRequired: 18, timelineMonths: 7, confidence: 72 },
  { id: "gs3", name: "Mid-Coast Therapy Care Expansion", serviceLine: "Therapy Care", counties: ["Knox, ME", "Waldo, ME", "Hancock, ME"], projectedRevenue: 1400000, staffingRequired: 22, timelineMonths: 8, confidence: 68 },
  { id: "gs4", name: "Central Maine Comprehensive Hub", serviceLine: "Home Healthcare", counties: ["Kennebec, ME", "Androscoggin, ME", "Sagadahoc, ME"], projectedRevenue: 2800000, staffingRequired: 30, timelineMonths: 9, confidence: 82 },
]

export const mockLaunchPlanSteps: LaunchPlanStep[] = [
  { week: 1, action: "Finalize Oxford and Franklin county market entry strategy", owner: "Strategy", status: "complete" },
  { week: 2, action: "Submit Maine DHHS certificate of need applications for 4 rural counties", owner: "Legal", status: "in-progress" },
  { week: 3, action: "Recruit clinical leads for Oxford, Somerset, Franklin, Piscataquis", owner: "HR", status: "pending" },
  { week: 4, action: "Establish referral partnerships with MaineHealth and Northern Light", owner: "Sales", status: "pending" },
  { week: 5, action: "Procure mobile wound care units for northern Maine deployment", owner: "Ops", status: "pending" },
  { week: 6, action: "Hire and onboard 18 clinical staff for initial rural expansion", owner: "HR", status: "pending" },
  { week: 8, action: "Launch marketing targeting Maine discharge planners and PCPs", owner: "Marketing", status: "pending" },
  { week: 10, action: "Go live: Oxford and Franklin county patient intake begins", owner: "Ops", status: "pending" },
  { week: 12, action: "90-day review: admissions, outcomes, and financial performance", owner: "Leadership", status: "pending" },
]

export const mockCatalogItems: CatalogItem[] = [
  { id: "ci1", name: "Skilled Nursing - Maine Rural", description: "RN and LPN visits for medication management, wound care, and patient education across Maine's rural communities", category: "Home Healthcare", evidence: ["e1", "e8"] },
  { id: "ci2", name: "Mobile Wound Debridement", description: "Sharp, enzymatic, and mechanical debridement at patient bedside or home - available in all 16 Maine counties", category: "Mobile Wound Care", evidence: ["e5", "e12"] },
  { id: "ci3", name: "Physical Therapy - Home Based", description: "Restorative and maintenance PT for home health patients in urban and rural Maine settings", category: "Therapy Care", evidence: ["e4", "e10"] },
  { id: "ci4", name: "Wound VAC Therapy Program", description: "Negative pressure wound therapy with remote monitoring for complex chronic wounds - unique in rural Maine", category: "Mobile Wound Care", evidence: ["e5", "e12", "e14"] },
  { id: "ci5", name: "Post-Hospital Transition Care", description: "Structured transition program reducing 30-day readmissions through coordinated home health follow-up", category: "Home Healthcare", evidence: ["e2", "e8"] },
  { id: "ci6", name: "Chronic Disease Management", description: "Telehealth-enhanced chronic disease monitoring for diabetes, CHF, and COPD patients in underserved Maine counties", category: "Home Healthcare", evidence: ["e1", "e6"] },
]

export const maineOverview = {
  population: 1386345,
  over65Percent: 21.2,
  ruralPercent: 61.3,
  homeHealthPatients: 38500,
  unservedRuralPatients: 12400,
  medianHomeHealthCostPerVisit: 185,
  stateAgencies: 89,
  topConditions: ["Heart disease", "COPD", "Diabetes", "Stroke", "Alzheimer's"],
  keyHospitals: ["Maine Medical Center (Portland)", "Northern Light EMMC (Bangor)", "MaineGeneral (Augusta)", "Central Maine Medical Center (Lewiston)", "York Hospital"],
}
