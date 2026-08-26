import { Injectable } from '@nestjs/common';
import * as dns from 'node:dns/promises';
import * as net from 'node:net';

export interface DomainValidationResult {
  readonly isValid: boolean;
  readonly normalizedDomain: string;
  readonly error?: string;
}

@Injectable()
export class DomainSecurityValidator {
  private static readonly RESERVED_SUFFIXES = [
    '.localhost',
    '.local',
    '.internal',
    '.lan',
    '.home',
    '.corp',
    '.test',
    '.example',
    '.invalid',
  ];

  private static readonly RESERVED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',
    'instance-data',
  ]);

  /**
   * Normalizes and verifies basic syntactic structure of a candidate domain.
   */
  normalizeAndValidateSyntax(rawInput: string): DomainValidationResult {
    if (!rawInput || typeof rawInput !== 'string') {
      return {
        isValid: false,
        normalizedDomain: '',
        error: 'Domain must not be empty.',
      };
    }

    let cleaned = rawInput.trim().toLowerCase();
    cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');
    cleaned = cleaned.split('/')[0];
    cleaned = cleaned.split('?')[0];
    cleaned = cleaned.split('#')[0];
    cleaned = cleaned.split('@').pop() || '';

    // Direct IP check (IPv4 or IPv6) before stripping port
    if (net.isIP(cleaned) || net.isIP(cleaned.replace(/^\[|\]$/g, ''))) {
      return {
        isValid: false,
        normalizedDomain: cleaned,
        error: 'Direct IP addresses are not permitted.',
      };
    }

    // Strip port if IPv4/hostname port format (e.g. example.com:8080)
    if (cleaned.includes(':') && !cleaned.includes(']')) {
      const parts = cleaned.split(':');
      if (parts.length === 2 && /^\d+$/.test(parts[1])) {
        cleaned = parts[0];
      }
    }

    // Remove trailing dot if present
    if (cleaned.endsWith('.')) {
      cleaned = cleaned.slice(0, -1);
    }

    if (!cleaned) {
      return {
        isValid: false,
        normalizedDomain: '',
        error: 'Domain name is required.',
      };
    }

    // Reject direct IP addresses again after port stripping
    if (net.isIP(cleaned)) {
      return {
        isValid: false,
        normalizedDomain: cleaned,
        error: 'Direct IP addresses are not permitted.',
      };
    }

    // Reserved hostnames check
    if (DomainSecurityValidator.RESERVED_HOSTNAMES.has(cleaned)) {
      return {
        isValid: false,
        normalizedDomain: cleaned,
        error: 'Reserved or internal domains are not permitted.',
      };
    }

    // Reserved suffixes check
    for (const suffix of DomainSecurityValidator.RESERVED_SUFFIXES) {
      if (cleaned.endsWith(suffix)) {
        return {
          isValid: false,
          normalizedDomain: cleaned,
          error: 'Reserved or internal domains are not permitted.',
        };
      }
    }

    // Length checks
    if (cleaned.length > 253) {
      return {
        isValid: false,
        normalizedDomain: cleaned,
        error: 'Domain name exceeds maximum allowed length (253 characters).',
      };
    }

    // Validate hostname syntax via standard RFC regex
    const domainRegex =
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
    if (!domainRegex.test(cleaned)) {
      return {
        isValid: false,
        normalizedDomain: cleaned,
        error: 'Invalid domain name format.',
      };
    }

    // Verify TLD has at least 2 alpha characters
    const parts = cleaned.split('.');
    const tld = parts[parts.length - 1];
    if (!/^[a-z]{2,}$/i.test(tld)) {
      return {
        isValid: false,
        normalizedDomain: cleaned,
        error: 'Domain must contain a valid top-level domain.',
      };
    }

    return { isValid: true, normalizedDomain: cleaned };
  }

  /**
   * Performs SSRF protection by resolving DNS and checking if target resolves to a private/loopback IP.
   */
  async verifyDnsAndSsrfSafety(
    domain: string,
  ): Promise<{ isSafe: boolean; reason?: string; resolvedIps?: string[] }> {
    try {
      // Resolve all IPv4 and IPv6 addresses
      const lookups = await dns.lookup(domain, { all: true });
      if (!lookups || lookups.length === 0) {
        return { isSafe: false, reason: 'DNS_NO_RECORDS' };
      }

      const ips = lookups.map((l) => l.address);
      for (const ip of ips) {
        if (this.isPrivateOrRestrictedIp(ip)) {
          return { isSafe: false, reason: 'SSRF_PRIVATE_IP', resolvedIps: ips };
        }
      }

      return { isSafe: true, resolvedIps: ips };
    } catch (err: any) {
      const code = err?.code || 'DNS_FAILURE';
      return { isSafe: false, reason: code };
    }
  }

  /**
   * Determines if an IPv4 or IPv6 address is in a private, loopback, link-local, or restricted range.
   */
  isPrivateOrRestrictedIp(ip: string): boolean {
    if (!ip) return true;

    // IPv4 Checks
    if (net.isIPv4(ip)) {
      const octets = ip.split('.').map(Number);
      if (octets.length !== 4 || octets.some(isNaN)) return true;

      const [o1, o2, o3, o4] = octets;

      // 0.0.0.0/8 (Current network)
      if (o1 === 0) return true;

      // 10.0.0.0/8 (Private)
      if (o1 === 10) return true;

      // 100.64.0.0/10 (Shared / Carrier Grade NAT: 100.64.0.0 - 100.127.255.255)
      if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

      // 127.0.0.0/8 (Loopback)
      if (o1 === 127) return true;

      // 169.254.0.0/16 (Link-local / Cloud metadata)
      if (o1 === 169 && o2 === 254) return true;

      // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

      // 192.0.0.0/24 (IETF Protocol)
      if (o1 === 192 && o2 === 0 && o3 === 0) return true;

      // 192.0.2.0/24 (TEST-NET-1)
      if (o1 === 192 && o2 === 0 && o3 === 2) return true;

      // 192.88.99.0/24 (6to4 Relay)
      if (o1 === 192 && o2 === 88 && o3 === 99) return true;

      // 192.168.0.0/16 (Private)
      if (o1 === 192 && o2 === 168) return true;

      // 198.18.0.0/15 (Benchmarking: 198.18.0.0 - 198.19.255.255)
      if (o1 === 198 && (o2 === 18 || o2 === 19)) return true;

      // 198.51.100.0/24 (TEST-NET-2)
      if (o1 === 198 && o2 === 51 && o3 === 100) return true;

      // 203.0.113.0/24 (TEST-NET-3)
      if (o1 === 203 && o2 === 0 && o3 === 113) return true;

      // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
      if (o1 >= 224 && o1 <= 239) return true;

      // 240.0.0.0/4 (Reserved: 240.0.0.0 - 255.255.255.255)
      if (o1 >= 240) return true;

      return false;
    }

    // IPv6 Checks
    if (net.isIPv6(ip)) {
      const lower = ip.toLowerCase();

      // Unspecified :: or Loopback ::1
      if (lower === '::' || lower === '::1' || lower === '0:0:0:0:0:0:0:1')
        return true;

      // IPv4 mapped IPv6 e.g. ::ffff:127.0.0.1
      if (lower.startsWith('::ffff:')) {
        const ipv4Part = lower.substring(7);
        if (net.isIPv4(ipv4Part)) {
          return this.isPrivateOrRestrictedIp(ipv4Part);
        }
      }

      // Unique Local Addresses (fc00::/7 -> fc00:: to fdff::)
      if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

      // Link-local Unicast (fe80::/10 -> fe80:: to febf::)
      if (
        lower.startsWith('fe8') ||
        lower.startsWith('fe9') ||
        lower.startsWith('fea') ||
        lower.startsWith('feb')
      )
        return true;

      // Multicast (ff00::/8)
      if (lower.startsWith('ff')) return true;

      return false;
    }

    return true;
  }
}
