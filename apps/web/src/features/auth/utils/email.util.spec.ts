import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail } from './email.util.ts';

describe('AUTH-017: Email Masking Utility (maskEmail)', () => {
  it('masks standard email addresses safely', () => {
    assert.strictEqual(maskEmail('swasthik@example.com'), 's*****k@example.com');
    assert.strictEqual(maskEmail('alexander@argonion.com'), 'a*****r@argonion.com');
  });

  it('masks short local parts safely', () => {
    assert.strictEqual(maskEmail('ab@domain.com'), 'a*@domain.com');
    assert.strictEqual(maskEmail('a@domain.com'), 'a*@domain.com');
    assert.strictEqual(maskEmail('abc@domain.com'), 'a***c@domain.com');
  });

  it('handles invalid or empty inputs gracefully', () => {
    assert.strictEqual(maskEmail(''), '');
    assert.strictEqual(maskEmail('invalid-string'), 'invalid-string');
  });
});
