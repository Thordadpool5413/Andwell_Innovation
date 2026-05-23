import type { CompetitorInput, GeographicSignal, ProviderEnrichmentItem, ProviderRegistryMatch } from './types';

const CMS_HOSPICE_DATASET = 'yc9t-dgbk';
const CMS_HOME_HEALTH_DATASET = '97z8-de96';

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function providerNameFromInput(input: CompetitorInput) {
  if (input.name?.trim()) return input.name.trim();
  try {
    const host = new URL(input.url).hostname.replace(/^www\./, '');
    return host.split('.')[0].replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return input.url;
  }
}

function similarityScore(left: string, right: string) {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 88;
  const aParts = new Set(a.split(' ').filter(Boolean));
  const bParts = new Set(b.split(' ').filter(Boolean));
  const intersection = [...aParts].filter((item) => bParts.has(item)).length;
  const union = new Set([...aParts, ...bParts]).size || 1;
  return Math.round((intersection / union) * 100);
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json() as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function fetchCmsMatches(dataset: string, name: string, source: ProviderRegistryMatch['source']) {
  const encodedName = encodeURIComponent(name);
  const url = `https://data.cms.gov/provider-data/api/1/datastore/query/${dataset}/0?limit=10&offset=0&keyword=${encodedName}`;
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload.results) ? payload.results as Array<Record<string, unknown>> : [];
  return rows.map((row) => {
    const providerName = text(row.facility_name || row.provider_name || row.hha_name || row.organization_name) || name;
    const confidence = similarityScore(name, providerName);
    return {
      source,
      providerName,
      confidence,
      ccn: text(row.cms_certification_number_ccn || row.provider_number || row.ccn),
      city: text(row.citytown || row.city),
      state: text(row.state),
      zip: text(row.zip_code || row.zip),
      addressLine1: text(row.address_line_1 || row.address),
      phone: text(row.telephone_number || row.phone_number)
    } satisfies ProviderRegistryMatch;
  }).filter((item) => item.confidence >= 40);
}

async function fetchNppesMatches(name: string) {
  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&organization_name=${encodeURIComponent(name)}&limit=10`;
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload.results) ? payload.results as Array<Record<string, unknown>> : [];
  return rows.map((row) => {
    const basic = (row.basic || {}) as Record<string, unknown>;
    const addresses = Array.isArray(row.addresses) ? row.addresses as Array<Record<string, unknown>> : [];
    const taxonomies = Array.isArray(row.taxonomies) ? row.taxonomies as Array<Record<string, unknown>> : [];
    const location = addresses.find((address) => text(address.address_purpose) === 'LOCATION') || addresses[0] || {};
    const providerName = text(basic.organization_name) || text(basic.name) || name;
    return {
      source: 'nppes',
      providerName,
      confidence: similarityScore(name, providerName),
      npi: text(row.number),
      city: text(location.city),
      state: text(location.state),
      zip: text(location.postal_code),
      addressLine1: text(location.address_1),
      phone: text(location.telephone_number),
      taxonomy: taxonomies.map((item) => text(item.desc)).filter(Boolean).slice(0, 5)
    } satisfies ProviderRegistryMatch;
  }).filter((item) => item.confidence >= 40);
}

async function fetchGeocode(address: string) {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const payload = await fetchJson(url);
  const result = (payload.result || {}) as Record<string, unknown>;
  const matches = Array.isArray(result.addressMatches) ? result.addressMatches as Array<Record<string, unknown>> : [];
  if (!matches.length) return null;
  const first = matches[0];
  const coordinates = (first.coordinates || {}) as Record<string, unknown>;
  const geographies = (first.geographies || {}) as Record<string, unknown>;
  const counties = Array.isArray(geographies.Counties) ? geographies.Counties as Array<Record<string, unknown>> : [];
  const county = counties[0] || {};
  return {
    latitude: typeof coordinates.y === 'number' ? coordinates.y : undefined,
    longitude: typeof coordinates.x === 'number' ? coordinates.x : undefined,
    county: text(county.NAME),
    state: text(county.STUSAB)
  };
}

export async function enrichProvidersWithFreeSources(competitors: CompetitorInput[]) {
  const providerEnrichment: ProviderEnrichmentItem[] = [];
  const geographicSignals: GeographicSignal[] = [];

  for (const competitor of competitors) {
    const competitorName = providerNameFromInput(competitor);
    const [hospiceMatches, homeHealthMatches, nppesMatches] = await Promise.all([
      fetchCmsMatches(CMS_HOSPICE_DATASET, competitorName, 'cms_hospice').catch(() => [] as ProviderRegistryMatch[]),
      fetchCmsMatches(CMS_HOME_HEALTH_DATASET, competitorName, 'cms_home_health').catch(() => [] as ProviderRegistryMatch[]),
      fetchNppesMatches(competitorName).catch(() => [] as ProviderRegistryMatch[])
    ]);
    const matches = [...hospiceMatches, ...homeHealthMatches, ...nppesMatches]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12);
    const bestMatchConfidence = matches[0]?.confidence || 0;
    providerEnrichment.push({
      competitorUrl: competitor.url,
      competitorName,
      matches,
      bestMatchConfidence,
      generatedAt: new Date().toISOString()
    });

    const best = matches[0];
    if (best?.addressLine1 && best.city && best.state) {
      const address = `${best.addressLine1} ${best.city} ${best.state} ${best.zip || ''}`.trim();
      const geocode = await fetchGeocode(address).catch(() => null);
      geographicSignals.push({
        areaLabel: geocode?.county ? `${geocode.county}, ${geocode.state || best.state}` : `${best.city}, ${best.state}`,
        county: geocode?.county,
        state: geocode?.state || best.state,
        latitude: geocode?.latitude,
        longitude: geocode?.longitude,
        confidence: geocode ? Math.min(100, best.confidence + 8) : Math.max(45, best.confidence - 10),
        source: geocode ? 'census_geocoder' : 'inferred'
      });
    }
  }

  return {
    providerEnrichment,
    geographicSignals,
    externalDataSummary: {
      providersEnriched: providerEnrichment.length,
      providerMatches: providerEnrichment.reduce((sum, item) => sum + item.matches.length, 0),
      geographicSignals: geographicSignals.length,
      lastEnrichedAt: new Date().toISOString()
    }
  };
}
