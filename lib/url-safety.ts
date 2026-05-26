export type UrlSafetyIssue =
  | 'empty'
  | 'invalid'
  | 'unsupported_protocol'
  | 'credentials_blocked'
  | 'private_host'
  | 'internal_hostname'
  | 'host_not_allowed';

export type UrlSafetyResult = {
  ok: boolean;
  input: string;
  url?: string;
  host?: string;
  issue?: UrlSafetyIssue;
  reason: string;
};

export function cleanHost(hostname: string) {
  return hostname.toLowerCase().trim().replace(/^\[/, '').replace(/\]$/, '').replace(/\.$/, '');
}

export function parseAllowedHostPatterns(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function matchesAllowedHost(hostname: string, patterns: string[]): boolean {
  const host = hostname.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return host === suffix || host.endsWith(`.${suffix}`);
    }
    return host === pattern;
  });
}

function blockedIPv4(host: string) {
  const parts = cleanHost(host).split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function blockedIPv6(host: string) {
  const value = cleanHost(host);
  if (!value.includes(':')) return false;
  if (value.includes('%')) return true;
  if (value === '::' || value === '::1' || value === '0:0:0:0:0:0:0:1') return true;
  if (/^fe[89ab]/i.test(value)) return true;
  if (/^f[cd]/i.test(value)) return true;
  const mapped = value.match(/(?:^|:)ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];
  return mapped ? blockedIPv4(mapped) : false;
}

function isInternalHostname(host: string) {
  return host === 'localhost'
    || host.endsWith('.local')
    || host.endsWith('.localhost')
    || host.endsWith('.internal')
    || host.endsWith('.lan')
    || host.endsWith('.home')
    || host.endsWith('.corp')
    || host.endsWith('.test');
}

export function validatePublicHttpUrl(rawUrl: string, allowedHostPatterns: string[] = []): UrlSafetyResult {
  const input = rawUrl.trim();
  if (!input) {
    return { ok: false, input: rawUrl, issue: 'empty', reason: 'Enter a public competitor website URL.' };
  }

  try {
    const parsed = new URL(input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, input: rawUrl, issue: 'unsupported_protocol', reason: 'Only public http or https websites can be scanned.' };
    }
    if (parsed.username || parsed.password) {
      return { ok: false, input: rawUrl, issue: 'credentials_blocked', reason: 'URLs with usernames or passwords are blocked.' };
    }

    const host = cleanHost(parsed.hostname);
    if (!host || isInternalHostname(host)) {
      return { ok: false, input: rawUrl, host, issue: 'internal_hostname', reason: 'Local, internal, test, and private hostnames are blocked.' };
    }
    if (host.includes('%') || (!host.includes('.') && !host.includes(':') && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))) {
      return { ok: false, input: rawUrl, host, issue: 'invalid', reason: 'Enter a complete public website address, such as https://provider.org/services.' };
    }
    if (blockedIPv4(host) || blockedIPv6(host)) {
      return { ok: false, input: rawUrl, host, issue: 'private_host', reason: 'Private, loopback, link-local, and internal IP addresses are blocked.' };
    }
    if (allowedHostPatterns.length && !matchesAllowedHost(host, allowedHostPatterns)) {
      return { ok: false, input: rawUrl, host, issue: 'host_not_allowed', reason: 'This host is not in the configured crawl allowlist.' };
    }

    parsed.hash = '';
    parsed.username = '';
    parsed.password = '';
    return {
      ok: true,
      input: rawUrl,
      url: parsed.toString(),
      host,
      reason: 'Ready for public website crawl validation.'
    };
  } catch {
    return { ok: false, input: rawUrl, issue: 'invalid', reason: 'This is not a valid website URL.' };
  }
}

export function isSafePublicTarget(url: string, allowedHostPatterns: string[] = []) {
  return validatePublicHttpUrl(url, allowedHostPatterns).ok;
}
