import {
  lookupCountryFromIp,
  getCountryDetails,
  getFlagEmoji,
  getLocalSystemCountry,
} from './geo-ip.util';

describe('GeoIP Utility (geo-ip.util.ts)', () => {
  describe('getLocalSystemCountry', () => {
    it('detects the local host country accurately based on system timezone or default', () => {
      const local = getLocalSystemCountry();
      expect(local.countryCode).toBeDefined();
      expect(local.countryName).toBeDefined();
      expect(local.countryFlag).toBeDefined();
    });
  });

  describe('lookupCountryFromIp', () => {
    it('returns the detected local system country for localhost and internal private IP ranges', () => {
      const localSystem = getLocalSystemCountry();
      const localhostIps = ['127.0.0.1', '::1', 'localhost', '0.0.0.0'];
      for (const ip of localhostIps) {
        const result = lookupCountryFromIp(ip);
        expect(result.countryCode).toBe(localSystem.countryCode);
        expect(result.countryName).toBe(localSystem.countryName);
        expect(result.countryFlag).toBe(localSystem.countryFlag);
      }

      const privateIps = ['10.0.0.1', '192.168.1.10', '172.16.0.5'];
      for (const ip of privateIps) {
        const result = lookupCountryFromIp(ip);
        expect(result.countryCode).toBe(localSystem.countryCode);
        expect(result.countryName).toBe(localSystem.countryName);
        expect(result.countryFlag).toBe(localSystem.countryFlag);
      }
    });

    it('prefers explicit Cloudflare/Vercel header country if present and valid', () => {
      const result = lookupCountryFromIp('8.8.8.8', 'IN');
      expect(result.countryCode).toBe('IN');
      expect(result.countryName).toBe('India');
      expect(result.countryFlag).toBe('🇮🇳');
    });

    it('resolves standard public IPv4 addresses deterministically', () => {
      const usIp = lookupCountryFromIp('8.8.8.8');
      expect(usIp.countryCode).toBe('US');
      expect(usIp.countryFlag).toBe('🇺🇸');

      const inIp = lookupCountryFromIp('106.51.10.2');
      expect(inIp.countryCode).toBe('IN');
      expect(inIp.countryFlag).toBe('🇮🇳');

      const deIp = lookupCountryFromIp('141.20.1.1');
      expect(deIp.countryCode).toBe('DE');
      expect(deIp.countryFlag).toBe('🇩🇪');

      const gbIp = lookupCountryFromIp('25.1.2.3');
      expect(gbIp.countryCode).toBe('GB');
      expect(gbIp.countryFlag).toBe('🇬🇧');
    });

    it('handles null or undefined IP gracefully with local host country', () => {
      const localSystem = getLocalSystemCountry();
      const nullResult = lookupCountryFromIp(null);
      expect(nullResult.countryCode).toBe(localSystem.countryCode);

      const undefinedResult = lookupCountryFromIp(undefined);
      expect(undefinedResult.countryCode).toBe(localSystem.countryCode);
    });
  });

  describe('getCountryDetails', () => {
    it('returns proper country name and flag emoji for known ISO codes', () => {
      expect(getCountryDetails('US')).toEqual({
        countryCode: 'US',
        countryName: 'United States',
        countryFlag: '🇺🇸',
      });

      expect(getCountryDetails('JP')).toEqual({
        countryCode: 'JP',
        countryName: 'Japan',
        countryFlag: '🇯🇵',
      });

      expect(getCountryDetails('AU')).toEqual({
        countryCode: 'AU',
        countryName: 'Australia',
        countryFlag: '🇦🇺',
      });
    });

    it('handles unknown country codes with fallback flag generation', () => {
      const unknown = getCountryDetails('XX');
      expect(unknown.countryCode).toBe('XX');
      expect(unknown.countryName).toBe('Country (XX)');
      expect(unknown.countryFlag).toBeDefined();
    });
  });

  describe('getFlagEmoji', () => {
    it('converts 2-letter ISO country code into Unicode regional indicator flag emoji', () => {
      expect(getFlagEmoji('US')).toBe('🇺🇸');
      expect(getFlagEmoji('IN')).toBe('🇮🇳');
      expect(getFlagEmoji('GB')).toBe('🇬🇧');
      expect(getFlagEmoji('FR')).toBe('🇫🇷');
    });
  });
});
