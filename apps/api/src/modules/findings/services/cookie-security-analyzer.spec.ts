import { CookieSecurityAnalyzerService } from './cookie-security-analyzer.service';

describe('CookieSecurityAnalyzerService (S1-001 & S1-002)', () => {
  let service: CookieSecurityAnalyzerService;

  beforeEach(() => {
    service = new CookieSecurityAnalyzerService();
  });

  describe('parseSetCookieHeaders', () => {
    it('handles empty or missing headers gracefully', () => {
      expect(service.parseSetCookieHeaders(undefined)).toEqual([]);
      expect(service.parseSetCookieHeaders({})).toEqual([]);
      expect(service.parseSetCookieHeaders({ 'set-cookie': '' })).toEqual([]);
    });

    it('parses single Set-Cookie header with complete attributes', () => {
      const headers = {
        'set-cookie':
          'session_token=super_secret_jwt_12345; Domain=.example.com; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600; Partitioned',
      };

      const result = service.parseSetCookieHeaders(headers, 'snap-101');
      expect(result).toHaveLength(1);

      const cookie = result[0];
      expect(cookie.name).toBe('session_token');
      expect(cookie.valueRedacted).toBe('[REDACTED]');
      expect(cookie.rawSetCookieRedacted).not.toContain(
        'super_secret_jwt_12345',
      );
      expect(cookie.rawSetCookieRedacted).toContain('session_token=[REDACTED]');
      expect(cookie.isSecure).toBe(true);
      expect(cookie.isHttpOnly).toBe(true);
      expect(cookie.sameSite).toBe('Strict');
      expect(cookie.domain).toBe('.example.com');
      expect(cookie.path).toBe('/');
      expect(cookie.maxAge).toBe(3600);
      expect(cookie.isPartitioned).toBe(true);
      expect(cookie.snapshotId).toBe('snap-101');
    });

    it('parses multiple Set-Cookie headers in array format', () => {
      const headers = {
        'set-cookie': [
          'connect.sid=s%3Aabc123; Path=/; HttpOnly; Secure',
          'theme=dark; Path=/; SameSite=Lax',
          'cart_id=98765; Path=/; Secure',
        ],
      };

      const result = service.parseSetCookieHeaders(headers);
      expect(result).toHaveLength(3);

      expect(result[0].name).toBe('connect.sid');
      expect(result[0].classification).toBe('CONFIRMED_SESSION');
      expect(result[0].classificationConfidence).toBe('HIGH');
      expect(result[0].isHttpOnly).toBe(true);
      expect(result[0].isSecure).toBe(true);

      expect(result[1].name).toBe('theme');
      expect(result[1].classification).toBe('ORDINARY_NON_SENSITIVE');
      expect(result[1].classificationConfidence).toBe('HIGH');

      expect(result[2].name).toBe('cart_id');
      expect(result[2].classification).toBe('ORDINARY_NON_SENSITIVE');
    });

    it('strictly redacts sensitive session values in raw evidence', () => {
      const headers = {
        'set-cookie': 'laravel_session=eyJpdiI6Inh5eiJ9; Secure; HttpOnly',
      };

      const result = service.parseSetCookieHeaders(headers);
      expect(result[0].rawSetCookieRedacted).toBe(
        'laravel_session=[REDACTED]; Secure; HttpOnly',
      );
      expect(result[0].rawSetCookieRedacted).not.toContain('eyJpdiI6Inh5eiJ9');
    });
  });

  describe('classifyCookie (S1-002 Conservative Classification)', () => {
    it('classifies confirmed framework session identifiers with HIGH confidence', () => {
      const confirmedNames = [
        'connect.sid',
        'JSESSIONID',
        'PHPSESSID',
        'ASP.NET_SessionId',
        '.AspNetCore.Session',
        'laravel_session',
        '__session',
        '_session_id',
      ];

      for (const name of confirmedNames) {
        const { classification, confidence } = service.classifyCookie(name);
        expect(classification).toBe('CONFIRMED_SESSION');
        expect(confidence).toBe('HIGH');
      }
    });

    it('classifies general auth/token names as STRONGLY_INDICATIVE with MEDIUM confidence', () => {
      const indicativeNames = [
        'auth_token',
        'jwt_access',
        'user_session',
        'refresh_token',
      ];

      for (const name of indicativeNames) {
        const { classification, confidence } = service.classifyCookie(name);
        expect(classification).toBe('STRONGLY_INDICATIVE_AUTH');
        expect(confidence).toBe('MEDIUM');
      }
    });

    it('classifies ordinary non-sensitive cookies without assuming security role', () => {
      const ordinaryNames = [
        'theme',
        'lang',
        'locale',
        'cookie_consent',
        '_ga',
        '_gid',
      ];

      for (const name of ordinaryNames) {
        const { classification } = service.classifyCookie(name);
        expect(classification).toBe('ORDINARY_NON_SENSITIVE');
      }
    });
  });

  describe('assessCookieSecurity (S1-006 Cookie Attribute Correlation)', () => {
    it('evaluates completely secured session cookies', () => {
      const cookies = service.parseSetCookieHeaders({
        'set-cookie': [
          'connect.sid=xyz; Path=/; Secure; HttpOnly; SameSite=Lax',
          'theme=light; Path=/',
        ],
      });

      const assessment = service.assessCookieSecurity(cookies, true);
      expect(assessment.totalCookies).toBe(2);
      expect(assessment.sessionCookies).toHaveLength(1);
      expect(assessment.missingHttpOnly).toHaveLength(0);
      expect(assessment.missingSecure).toHaveLength(0);
      expect(assessment.missingSameSite).toHaveLength(0);
      expect(assessment.securityGapsCount).toBe(0);
    });

    it('detects missing attributes and correlates security gaps', () => {
      const cookies = service.parseSetCookieHeaders({
        'set-cookie': [
          'sessionid=insecure_token_value; Path=/', // Missing Secure, HttpOnly, SameSite
          'auth_jwt=jwt_token_val; Path=/; SameSite=None', // SameSite=None without Secure, missing HttpOnly
        ],
      });

      const assessment = service.assessCookieSecurity(cookies, true);
      expect(assessment.sessionCookies).toHaveLength(2);
      expect(assessment.missingHttpOnly).toHaveLength(2);
      expect(assessment.missingSecure).toHaveLength(2);
      expect(assessment.missingSameSite).toHaveLength(1); // sessionid has Missing
      expect(assessment.sameSiteNoneWithoutSecure).toHaveLength(1); // auth_jwt has SameSite=None without Secure
      expect(assessment.securityGapsCount).toBeGreaterThan(0);
    });
  });
});
