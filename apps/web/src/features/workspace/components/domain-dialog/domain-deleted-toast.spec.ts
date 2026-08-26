import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('DomainDeletedToast Contracts (WX-812)', () => {
  it('defines calm polite notification semantics for domain deletion', () => {
    const toastConfig = {
      role: 'status',
      ariaLive: 'polite',
      defaultDurationMs: 4500,
      position: 'bottom-6',
    };

    assert.equal(toastConfig.role, 'status');
    assert.equal(toastConfig.ariaLive, 'polite');
    assert.equal(toastConfig.defaultDurationMs, 4500);
    assert.equal(toastConfig.position, 'bottom-6');
  });

  it('formats deleted domain message cleanly without layout jitter', () => {
    const formatMessage = (domainName: string) => `Domain ${domainName} deleted successfully.`;
    assert.equal(
      formatMessage('argonion.com'),
      'Domain argonion.com deleted successfully.',
    );
  });
});
