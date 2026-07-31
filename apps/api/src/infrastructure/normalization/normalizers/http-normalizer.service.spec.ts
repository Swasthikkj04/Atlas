import { HttpNormalizerService } from './http-normalizer.service';

describe('HttpNormalizerService (Knowledge Engine)', () => {
  let normalizer: HttpNormalizerService;

  beforeEach(() => {
    normalizer = new HttpNormalizerService();
  });

  it('should normalize header case variations deterministically', () => {
    const raw1 = {
      headers: {
        'Strict-Transport-Security': 'max-age=31536000',
        'X-FRAME-OPTIONS': 'DENY',
      },
    };

    const raw2 = {
      headers: {
        'strict-transport-security': 'max-age=31536000',
        'x-frame-options': 'DENY',
      },
    };

    const result1 = normalizer.normalize('domain-1', 'ev-1', raw1);
    const result2 = normalizer.normalize('domain-1', 'ev-1', raw2);

    expect(result1.observations.strictTransportSecurity.observation.state).toBe(
      result2.observations.strictTransportSecurity.observation.state,
    );
    expect(result1.observations.strictTransportSecurity.observation.value).toBe(
      result2.observations.strictTransportSecurity.observation.value,
    );

    expect(result1.observations.xFrameOptions.observation.state).toBe(
      result2.observations.xFrameOptions.observation.state,
    );
    expect(result1.observations.xFrameOptions.observation.value).toBe(
      result2.observations.xFrameOptions.observation.value,
    );
  });

  it('should preserve 100% evidence lineage in canonical observations', () => {
    const result = normalizer.normalize('domain-1', 'ev-123', {
      headers: { 'strict-transport-security': 'max-age=31536000' },
    });

    const obs = result.observations.strictTransportSecurity;
    expect(obs.lineage.evidenceId).toBe('ev-123');
    expect(obs.lineage.normalizerName).toBe('http-normalizer');
    expect(obs.lineage.normalizerVersion).toBe('1.0.0');
    expect(obs.observation.state).toBe('OBSERVED');
    expect(obs.observation.value).toBe('max-age=31536000');
  });

  it('should capture warnings when merging duplicate headers', () => {
    const result = normalizer.normalize('domain-1', 'ev-123', {
      headers: {
        Server: 'nginx',
        server: 'gws',
      },
    });

    expect(result.diagnostics.warnings).toHaveLength(1);
    expect(result.observations.serverHeader.observation.value).toContain(
      'nginx',
    );
    expect(result.observations.serverHeader.observation.value).toContain('gws');
  });

  it('should guarantee idempotency (repeated normalization produces identical outputs)', () => {
    const raw = {
      headers: {
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'no-referrer',
      },
    };

    const run1 = normalizer.normalize('domain-1', 'ev-123', raw);
    const run2 = normalizer.normalize('domain-1', 'ev-123', raw);

    expect(run1.observations.contentSecurityPolicy.observation.value).toBe(
      run2.observations.contentSecurityPolicy.observation.value,
    );
    expect(run1.diagnostics.warnings).toEqual(run2.diagnostics.warnings);
  });
});
