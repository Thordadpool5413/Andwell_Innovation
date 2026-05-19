const SAFE_WORD_RULES = [
  { pattern: /unsupported competitor claim/i, replacement: "Not found publicly" },
  { pattern: /competitor doesn't offer/i, replacement: "Not found publicly in their published materials" },
  { pattern: /competitor (can't|cannot) do/i, replacement: "No public evidence of this capability" },
  { pattern: /competitor is (worse|inferior)/i, replacement: "Andwell differentiates by" },
  { pattern: /they have no/i, replacement: "We have not found public evidence of" },
]

export function applySafeWording(text: string): string {
  let result = text
  for (const rule of SAFE_WORD_RULES) {
    result = result.replace(rule.pattern, rule.replacement)
  }
  return result
}

export const SAFE_WORDING_PREFIXES = {
  confirmed: "Clear public evidence shows",
  likely: "Our research indicates",
  possible: "There are indications that",
  "not-found": "Not found publicly",
}

export const WHAT_NOT_TO_SAY = [
  "Never state a competitor 'does not offer' a service unless confirmed by their own materials",
  "Never use absolute terms like 'nobody else does this'",
  "Never disparage competitor quality without CMS star rating evidence",
  'Use "Not found publicly" instead of "they don\'t have"',
  "Always qualify market share claims with data source and date",
]
