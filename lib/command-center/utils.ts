export function normalizeUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

export function nameFromUrl(url: string) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '').split('.')[0].replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return 'Competitor';
  }
}

export function parseJsonSafely<T>(text: string, url: string): T {
  const trimmed = text.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<')) {
    throw new Error(`Hostinger returned HTML for ${url}, not JSON. Open System Check and test /api/version first.`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`The response from ${url} was not valid JSON. First characters: ${text.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
}

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { accept: 'application/json', ...(options?.headers || {}) },
    cache: 'no-store'
  });
  const text = await response.text();
  const data = parseJsonSafely<{ error?: string } & T>(text, url);
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}.`);
  return data;
}

export function toneForStatus(status?: string): 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'dark' {
  if (!status) return 'neutral';
  if (status.includes('Critical') || status.includes('Strategic') || status.includes('High') || status.includes('Needs human') || status.includes('Problem')) return 'red';
  if (status.includes('Medium') || status.includes('Moderate') || status.includes('Mentioned') || status.includes('Manager') || status.includes('Unclear')) return 'amber';
  if (status.includes('Clearly') || status.includes('Approved') || status.includes('Evidence') || status.includes('OK')) return 'green';
  if (status.includes('Low') || status.includes('Not found')) return 'blue';
  return 'neutral';
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-US');
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

export function money(value: number) {
  return currencyFormatter.format(value);
}

export function whole(value: number) {
  return numberFormatter.format(value);
}

export function percent(value: number) {
  return percentFormatter.format(value);
}
