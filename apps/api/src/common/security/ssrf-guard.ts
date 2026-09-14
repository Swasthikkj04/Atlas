import * as dns from 'node:dns/promises';
import * as net from 'node:net';

export interface SsrfValidationResult {
  readonly isSafe: boolean;
  readonly reason?: string;
  readonly resolvedIps?: string[];
  readonly normalizedDomain?: string;
}

export const RESERVED_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  '.test',
  '.example',
  '.invalid',
] as const;

export const RESERVED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'instance-data',
  'metadata',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

/**
 * Determines whether an IPv4 or IPv6 address belongs to a private, loopback, link-local,
 * cloud-metadata, multicast, or reserved restricted subnet.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return true;

  const trimmed = ip.trim();

  // IPv4 Checks
  if (net.isIPv4(trimmed)) {
    const octets = trimmed.split('.').map(Number);
    if (
      octets.length !== 4 ||
      octets.some((n) => isNaN(n) || n < 0 || n > 255)
    ) {
      return true;
    }

    const [o1, o2, o3, o4] = octets;

    // 0.0.0.0/8 (Current network / "this" network)
    if (o1 === 0) return true;

    // 10.0.0.0/8 (Private network RFC 1918)
    if (o1 === 10) return true;

    // 100.64.0.0/10 (Shared address space / Carrier-Grade NAT: 100.64.0.0 - 100.127.255.255)
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) return true;

    // 169.254.0.0/16 (Link-local / Cloud metadata: AWS 169.254.169.254, GCP, Azure)
    if (o1 === 169 && o2 === 254) return true;

    // 172.16.0.0/12 (Private network RFC 1918: 172.16.0.0 - 172.31.255.255)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (o1 === 192 && o2 === 0 && o3 === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (o1 === 192 && o2 === 0 && o3 === 2) return true;

    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (o1 === 192 && o2 === 88 && o3 === 99) return true;

    // 192.168.0.0/16 (Private network RFC 1918)
    if (o1 === 192 && o2 === 168) return true;

    // 198.18.0.0/15 (Benchmarking: 198.18.0.0 - 198.19.255.255)
    if (o1 === 198 && (o2 === 18 || o2 === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (o1 === 198 && o2 === 51 && o3 === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (o1 === 203 && o2 === 0 && o3 === 113) return true;

    // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
    if (o1 >= 224 && o1 <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future use: 240.0.0.0 - 255.255.255.255)
    if (o1 >= 240) return true;

    return false;
  }

  // IPv6 Checks
  if (net.isIPv6(trimmed)) {
    const lower = trimmed.toLowerCase();

    // Unspecified :: or Loopback ::1
    if (lower === '::' || lower === '::1' || lower === '0:0:0:0:0:0:0:1') {
      return true;
    }

    // IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1 or ::ffff:192.168.1.1
    if (lower.startsWith('::ffff:')) {
      const ipv4Part = lower.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateOrRestrictedIp(ipv4Part);
      }
    }

    // Unique Local Addresses (fc00::/7 -> fc00:: to fdff::)
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }

    // Link-local Unicast (fe80::/10 -> fe80:: to febf::)
    if (
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb')
    ) {
      return true;
    }

    // Multicast (ff00::/8)
    if (lower.startsWith('ff')) {
      return true;
    }

    // Discard prefix (100::/64)
    if (lower.startsWith('100::')) {
      return true;
    }

    // Documentation prefix (2001:db8::/32)
    if (lower.startsWith('2001:db8:') || lower.startsWith('2001:0db8:')) {
      return true;
    }

    return false;
  }

  // If not an IPv4 or IPv6 string, it is not a private IP address
  return false;
}

/**
 * Checks whether a hostname matches reserved internal or non-routable names.
 */
export function isRestrictedHostname(hostname: string): boolean {
  if (!hostname || typeof hostname !== 'string') return true;

  const clean = hostname.trim().toLowerCase();

  if (RESERVED_HOSTNAMES.has(clean)) {
    return true;
  }

  for (const suffix of RESERVED_SUFFIXES) {
    if (clean.endsWith(suffix)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates domain/host syntax and verifies DNS records against private/loopback/metadata SSRF targets.
 */
export async function verifyDnsAndSsrfSafety(
  hostname: string,
): Promise<SsrfValidationResult> {
  if (!hostname || typeof hostname !== 'string') {
    return { isSafe: false, reason: 'INVALID_HOSTNAME' };
  }

  const cleanHost = hostname.trim().toLowerCase();

  // Check direct IP
  if (net.isIP(cleanHost)) {
    if (isPrivateOrRestrictedIp(cleanHost)) {
      return {
        isSafe: false,
        reason: 'SSRF_PRIVATE_IP',
        resolvedIps: [cleanHost],
      };
    }
    return {
      isSafe: false,
      reason: 'DIRECT_IP_NOT_ALLOWED',
      resolvedIps: [cleanHost],
    };
  }

  // Check reserved hostname or suffix
  if (isRestrictedHostname(cleanHost)) {
    return { isSafe: false, reason: 'SSRF_RESERVED_HOSTNAME' };
  }

  try {
    const lookups = await dns.lookup(cleanHost, { all: true });
    if (!lookups || lookups.length === 0) {
      return { isSafe: true, normalizedDomain: cleanHost };
    }

    const ips = lookups.map((l) => l.address);
    for (const ip of ips) {
      if (isPrivateOrRestrictedIp(ip)) {
        return { isSafe: false, reason: 'SSRF_PRIVATE_IP', resolvedIps: ips };
      }
    }

    return { isSafe: true, resolvedIps: ips, normalizedDomain: cleanHost };
  } catch (err: any) {
    const code = err?.code || 'DNS_FAILURE';
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'NODATA') {
      return { isSafe: true, normalizedDomain: cleanHost };
    }
    return { isSafe: false, reason: code };
  }
}

/**
 * Inspects a probe URL (including protocol scheme, host, and port) for SSRF vulnerabilities.
 */
export async function validateProbeUrl(
  urlStr: string,
): Promise<{ isSafe: boolean; reason?: string; parsedUrl?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { isSafe: false, reason: 'INVALID_URL' };
  }

  // Enforce HTTP / HTTPS schemes only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: 'FORBIDDEN_SCHEME' };
  }

  const hostname = parsed.hostname;

  // Reject direct private/restricted IP or reserved hostnames immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrRestrictedIp(hostname)) {
      return { isSafe: false, reason: 'SSRF_PRIVATE_IP' };
    }
  }

  if (isRestrictedHostname(hostname)) {
    return { isSafe: false, reason: 'SSRF_RESERVED_HOSTNAME' };
  }

  const dnsSafety = await verifyDnsAndSsrfSafety(hostname);
  if (!dnsSafety.isSafe) {
    return { isSafe: false, reason: dnsSafety.reason };
  }

  return { isSafe: true, parsedUrl: parsed };
}
