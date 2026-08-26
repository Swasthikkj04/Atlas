import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEnvConfig } from './env.config.ts';

describe('WX-001: Environment Configuration Contracts', () => {
  it('returns a valid EnvConfig object in test environment', () => {
    const config = getEnvConfig();
    assert.ok(typeof config === 'object' && config !== null);
    assert.ok(typeof config.apiBaseUrl === 'string');
    assert.ok(typeof config.mode === 'string');
    assert.ok(typeof config.isDev === 'boolean');
    assert.ok(typeof config.isProd === 'boolean');
    assert.ok(typeof config.isTest === 'boolean');
  });

  it('identifies test environment mode correctly', () => {
    const config = getEnvConfig();
    assert.equal(config.isTest, true);
    assert.equal(config.mode, 'test');
  });
});
