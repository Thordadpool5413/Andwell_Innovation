import { ServiceLine, SubService } from "./types"

export const serviceLines: ServiceLine[] = [
  { id: "home-health", name: "Home Healthcare", description: "Skilled nursing, therapy, and aide services in the home" },
  { id: "mobile-wound", name: "Mobile Wound Care", description: "Advanced wound management at bedside or home" },
  { id: "therapy-care", name: "Therapy Care", description: "Physical, occupational, and speech therapy" },
]

export const subServices: SubService[] = [
  { id: "hh-skilled-nursing", serviceId: "home-health", name: "Skilled Nursing Visits", description: "RN and LPN visits for medication, wound care, monitoring", evidenceIds: [] },
  { id: "hh-chronic-disease", serviceId: "home-health", name: "Chronic Disease Management", description: "Telehealth-enhanced monitoring for CHF, COPD, diabetes", evidenceIds: [] },
  { id: "hh-post-hospital", serviceId: "home-health", name: "Post-Hospital Transition", description: "Structured 30-day readmission reduction program", evidenceIds: [] },
  { id: "hh-palliative", serviceId: "home-health", name: "Palliative Support", description: "Symptom management and comfort care at home", evidenceIds: [] },
  { id: "mw-debridement", serviceId: "mobile-wound", name: "Wound Debridement", description: "Sharp, enzymatic, and mechanical debridement", evidenceIds: [] },
  { id: "mw-vac-therapy", serviceId: "mobile-wound", name: "Negative Pressure Wound Therapy", description: "Wound VAC with remote monitoring", evidenceIds: [] },
  { id: "mw-chronic-wound", serviceId: "mobile-wound", name: "Chronic Wound Management", description: "Comprehensive diabetic ulcer and pressure injury care", evidenceIds: [] },
  { id: "mw-compression", serviceId: "mobile-wound", name: "Compression Therapy", description: "Venous stasis ulcer management with compression", evidenceIds: [] },
  { id: "tc-physical", serviceId: "therapy-care", name: "Physical Therapy", description: "Restorative and maintenance PT in home/community", evidenceIds: [] },
  { id: "tc-occupational", serviceId: "therapy-care", name: "Occupational Therapy", description: "ADL retraining, home safety, adaptive equipment", evidenceIds: [] },
  { id: "tc-speech", serviceId: "therapy-care", name: "Speech Therapy", description: "Swallowing, communication, and cognitive therapy", evidenceIds: [] },
  { id: "tc-pulmonary", serviceId: "therapy-care", name: "Pulmonary Rehabilitation", description: "Breathing exercises, energy conservation, COPD management", evidenceIds: [] },
]

export const serviceLinesMap = new Map(serviceLines.map(s => [s.id, s]))
export const subServicesMap = new Map(subServices.map(s => [s.id, s]))
