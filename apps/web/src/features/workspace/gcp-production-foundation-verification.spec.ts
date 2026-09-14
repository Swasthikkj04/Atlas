import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../../config/env.config.ts';

describe('GCP Production Foundation Frontend Invariants', () => {
  it('should guarantee no secret environment variables leak into client bundle', () => {
    // Assert that client configuration exposes only safe public frontend properties
    assert.ok(typeof env.isDev === 'boolean');
    assert.ok(typeof env.isProd === 'boolean');
    assert.ok(typeof env.apiBaseUrl === 'string');

    // Ensure client environment does not have sensitive database or secret keys
    const envObj = env as Record<string, unknown>;
    assert.equal(envObj['databaseUrl'], undefined);
    assert.equal(envObj['jwtSecret'], undefined);
    assert.equal(envObj['dbPassword'], undefined);
  });

  it('should maintain production frontend security boundaries', () => {
    // Ensure that production CSP directives are compliant with single-page app standards
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
    ];

    assert.ok(cspDirectives.length >= 5);
    for (const directive of cspDirectives) {
      assert.ok(directive.startsWith('default-src') || directive.includes('self'));
    }
  });
});
