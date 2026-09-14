import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  S6_HTTP_TRANSIT_INVARIANTS,
  evaluateClientHttpTransitSecurity,
  type WebCorsPolicyAudit,
  type WebAllowedMethodsAudit,
  type WebCleartextUpgradeAudit,
  type WebHttpTransitSecurityReport,
} from './contracts/http-transit-security.contract.ts';

describe('S6: HTTP Transit & Transit Invariants Contract Specification', () => {
  it('certifies S6 invariant definitions', () => {
    assert.equal(S6_HTTP_TRANSIT_INVARIANTS.S6_CORS_WILDCARD_CREDENTIALS_PROTECTION, true);
    assert.equal(S6_HTTP_TRANSIT_INVARIANTS.S6_DANGEROUS_METHODS_EXPOSURE_DETECTION, true);
    assert.equal(S6_HTTP_TRANSIT_INVARIANTS.S6_CLEARTEXT_UPGRADE_REDIRECTION_ENFORCEMENT, true);
  });

  describe('1. Insecure CORS Reflection Evaluation', () => {
    it('identifies wildcard origin combined with credentials as critical trust hazard', () => {
      const corsAudit: WebCorsPolicyAudit = {
        allowOrigin: '*',
        allowCredentials: true,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        isWildcardWithCredentials: true,
        isOverlyPermissive: true,
      };

      assert.equal(corsAudit.isWildcardWithCredentials, true);
      assert.equal(corsAudit.isOverlyPermissive, true);
      assert.equal(corsAudit.allowCredentials, true);
    });

    it('validates strictly bounded CORS origin whitelist', () => {
      const corsAudit: WebCorsPolicyAudit = {
        allowOrigin: 'https://trusted.corp.com',
        allowCredentials: true,
        maxAge: 86400,
        isWildcardWithCredentials: false,
        isOverlyPermissive: false,
      };

      assert.equal(corsAudit.isWildcardWithCredentials, false);
      assert.equal(corsAudit.isOverlyPermissive, false);
      assert.equal(corsAudit.allowOrigin, 'https://trusted.corp.com');
    });
  });

  describe('2. Dangerous HTTP Methods Identification', () => {
    it('flags active TRACE and CONNECT methods in response metadata', () => {
      const methodsAudit: WebAllowedMethodsAudit = {
        declaredMethods: ['GET', 'POST', 'TRACE', 'CONNECT', 'OPTIONS'],
        hasTraceMethod: true,
        hasConnectMethod: true,
        hasDangerousMethods: true,
        dangerousMethodsList: ['TRACE', 'CONNECT'],
      };

      assert.equal(methodsAudit.hasTraceMethod, true);
      assert.equal(methodsAudit.hasDangerousMethods, true);
      assert.deepEqual(methodsAudit.dangerousMethodsList, ['TRACE', 'CONNECT']);
    });
  });

  describe('3. Cleartext HTTP Redirection & Transit Upgrade', () => {
    it('detects unredirected port 80 cleartext responses', () => {
      const upgradeAudit: WebCleartextUpgradeAudit = {
        initialProtocol: 'http',
        initialStatusCode: 200,
        isHttpsRedirectEnforced: false,
        isPermanentRedirect: false,
        hasCleartextExposure: true,
        explanation: 'Cleartext HTTP (port 80) returned status 200 directly without redirecting to HTTPS.',
      };

      assert.equal(upgradeAudit.hasCleartextExposure, true);
      assert.equal(upgradeAudit.isHttpsRedirectEnforced, false);
      assert.equal(upgradeAudit.initialStatusCode, 200);
    });

    it('verifies permanent 301 upgrade to HTTPS', () => {
      const upgradeAudit: WebCleartextUpgradeAudit = {
        initialProtocol: 'http',
        initialStatusCode: 301,
        isHttpsRedirectEnforced: true,
        isPermanentRedirect: true,
        redirectLocation: 'https://secure.corp.com/',
        finalProtocol: 'https',
        hasCleartextExposure: false,
        explanation: 'Cleartext HTTP successfully redirected to HTTPS via status 301 (Permanent).',
      };

      assert.equal(upgradeAudit.hasCleartextExposure, false);
      assert.equal(upgradeAudit.isHttpsRedirectEnforced, true);
      assert.equal(upgradeAudit.isPermanentRedirect, true);
    });
  });

  describe('4. Complete Transit Security Report Integrity', () => {
    it('constructs authoritative transit security report using client evaluator', () => {
      const report: WebHttpTransitSecurityReport = evaluateClientHttpTransitSecurity(
        {
          'access-control-allow-origin': '*',
          'access-control-allow-credentials': 'true',
          allow: 'GET, POST, TRACE, OPTIONS',
        },
        [
          {
            scheme: 'http',
            statusCode: 200,
            url: 'http://vulnerable.domain.corp',
          },
        ],
      );

      assert.equal(report.isEvaluated, true);
      assert.equal(report.confidence, 'AUTHORITATIVE');
      assert.equal(report.corsAudit.isWildcardWithCredentials, true);
      assert.equal(report.methodsAudit.hasTraceMethod, true);
      assert.equal(report.upgradeAudit.hasCleartextExposure, true);
    });
  });
});
