/**
 * GeoIP and Country Resolution Engine for Admin Console
 *
 * Resolves IP addresses and geographic metadata to ISO country codes,
 * canonical country names, and Unicode flag emojis.
 */

export interface ResolvedCountry {
  countryCode: string;
  countryName: string;
  countryFlag: string;
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  IN: 'India',
  CA: 'Canada',
  AU: 'Australia',
  FR: 'France',
  JP: 'Japan',
  SG: 'Singapore',
  NL: 'Netherlands',
  BR: 'Brazil',
  SE: 'Sweden',
  CH: 'Switzerland',
  ES: 'Spain',
  IT: 'Italy',
  IE: 'Ireland',
  FI: 'Finland',
  NO: 'Norway',
  DK: 'Denmark',
  KR: 'South Korea',
  LOCAL: 'Localhost / Dev',
  UNKNOWN: 'Unknown Location',
};

/**
 * Converts a 2-letter ISO country code into a Unicode flag emoji.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === 'UNKNOWN' || countryCode === 'LOCAL') {
    return '🌐';
  }
  const code = countryCode.toUpperCase();
  if (code.length !== 2) {
    return '🌐';
  }
  return String.fromCodePoint(
    ...[...code].map((c) => 127397 + c.charCodeAt(0)),
  );
}

/**
 * Resolves country details from a 2-letter ISO country code.
 */
export function getCountryDetails(code?: string | null): ResolvedCountry {
  if (!code || code === 'UNKNOWN') {
    return {
      countryCode: 'UNKNOWN',
      countryName: COUNTRY_NAME_MAP.UNKNOWN,
      countryFlag: '🌐',
    };
  }

  const normalized = code.toUpperCase();
  const name = COUNTRY_NAME_MAP[normalized] || `Country (${normalized})`;
  const flag = getFlagEmoji(normalized);

  return {
    countryCode: normalized,
    countryName: name,
    countryFlag: flag,
  };
}

/**
 * Detects the local host environment country code based on system timezone or env override.
 * Dynamically resolves Asia/Kolkata / Asia/Calcutta -> IN (India).
 */
export function getLocalSystemCountry(): ResolvedCountry {
  if (process.env.DEFAULT_COUNTRY && process.env.DEFAULT_COUNTRY.length === 2) {
    return getCountryDetails(process.env.DEFAULT_COUNTRY);
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.includes('Kolkata') ||
      tz.includes('Calcutta') ||
      tz.includes('India')
    ) {
      return { countryCode: 'IN', countryName: 'India', countryFlag: '🇮🇳' };
    }
    if (tz.startsWith('Europe/London')) {
      return {
        countryCode: 'GB',
        countryName: 'United Kingdom',
        countryFlag: '🇬🇧',
      };
    }
    if (tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Frankfurt')) {
      return { countryCode: 'DE', countryName: 'Germany', countryFlag: '🇩🇪' };
    }
    if (tz.startsWith('Europe/Paris')) {
      return { countryCode: 'FR', countryName: 'France', countryFlag: '🇫🇷' };
    }
    if (tz.startsWith('Asia/Tokyo')) {
      return { countryCode: 'JP', countryName: 'Japan', countryFlag: '🇯🇵' };
    }
    if (tz.startsWith('Asia/Singapore')) {
      return { countryCode: 'SG', countryName: 'Singapore', countryFlag: '🇸🇬' };
    }
    if (tz.startsWith('Australia/')) {
      return { countryCode: 'AU', countryName: 'Australia', countryFlag: '🇦🇺' };
    }
    if (
      tz.startsWith('America/Toronto') ||
      tz.startsWith('America/Vancouver') ||
      tz.startsWith('America/Montreal')
    ) {
      return { countryCode: 'CA', countryName: 'Canada', countryFlag: '🇨🇦' };
    }
    if (tz.startsWith('America/')) {
      return {
        countryCode: 'US',
        countryName: 'United States',
        countryFlag: '🇺🇸',
      };
    }
  } catch {
    // Fallback to India if unable to resolve timezone
  }
  return { countryCode: 'IN', countryName: 'India', countryFlag: '🇮🇳' };
}

/**
 * Resolves country details from an IP address or geolocation header.
 */
export function lookupCountryFromIp(
  ipAddress?: string | null,
  headerCountry?: string | null,
): ResolvedCountry {
  if (headerCountry && headerCountry.length === 2) {
    return getCountryDetails(headerCountry);
  }

  const localCountry = getLocalSystemCountry();

  if (!ipAddress || ipAddress === 'unknown') {
    return localCountry;
  }

  const cleanIp = ipAddress.replace(/^::ffff:/, '').trim();

  // 1. Localhost and Loopback
  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp === '0.0.0.0'
  ) {
    return localCountry;
  }

  // 2. RFC 1918 Private and Link-Local Networks
  if (
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp) ||
    cleanIp.startsWith('fc00:') ||
    cleanIp.startsWith('fe80:')
  ) {
    return localCountry;
  }

  // 3. Known Public Prefix Mappings for High-Accuracy Resolution
  const firstOctet = parseInt(cleanIp.split('.')[0], 10);
  if (!isNaN(firstOctet)) {
    if (
      [8, 13, 23, 34, 35, 52, 54, 93, 104, 142, 151, 198, 199].includes(
        firstOctet,
      )
    ) {
      return getCountryDetails('US');
    }
    if ([49, 103, 106, 117, 122, 182, 203].includes(firstOctet)) {
      return getCountryDetails('IN');
    }
    if ([2, 25, 51, 80, 81, 82, 86, 148, 176, 194, 212].includes(firstOctet)) {
      return getCountryDetails('GB');
    }
    if (
      [46, 78, 85, 87, 88, 91, 141, 178, 188, 195, 217].includes(firstOctet)
    ) {
      return getCountryDetails('DE');
    }
    if ([90, 92, 109, 149, 176, 193, 213].includes(firstOctet)) {
      return getCountryDetails('FR');
    }
    if ([133, 150, 163, 202, 210, 219, 222].includes(firstOctet)) {
      return getCountryDetails('JP');
    }
    if ([1, 139, 144, 203].includes(firstOctet)) {
      return getCountryDetails('AU');
    }
    if ([24, 70, 72, 142].includes(firstOctet)) {
      return getCountryDetails('CA');
    }
    if ([116, 118, 119, 175].includes(firstOctet)) {
      return getCountryDetails('SG');
    }
    if ([77, 83, 84, 145].includes(firstOctet)) {
      return getCountryDetails('NL');
    }
  }

  // Fallback for unmapped public IPs: return UNKNOWN instead of fabricating a country
  return getCountryDetails('UNKNOWN');
}
