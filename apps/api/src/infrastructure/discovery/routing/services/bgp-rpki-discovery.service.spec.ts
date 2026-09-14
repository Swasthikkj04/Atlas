import { BgpRpkiDiscoveryService } from './bgp-rpki-discovery.service';
import { DiscoverySnapshot } from '../../contracts/discovery-snapshot.interface';

describe('BgpRpkiDiscoveryService', () => {
  let service: BgpRpkiDiscoveryService;

  beforeEach(() => {
    service = new BgpRpkiDiscoveryService();
  });

  it('correctly maps Cloudflare IPs to AS13335 with VALID RPKI ROA', async () => {
    const snapshot: DiscoverySnapshot = {
      dns: {
        a: ['104.21.4.1', '172.67.182.5'],
        aaaa: ['2606:4700:3030::ac43:b605'],
        mx: [],
        ns: [],
        cname: [],
        txt: [],
        dmarc: [],
      },
    };

    const result = await service.discover('cloudflare-domain.com', snapshot);
    expect(result.status).toBe('SUCCESS');
    expect(result.routes).toHaveLength(3);
    expect(result.uniqueAsns).toContain(13335);
    expect(result.rpkiSummary.overallRpkiStatus).toBe('VALID');
    expect(result.rpkiSummary.validCount).toBe(3);
    expect(result.rpkiSummary.invalidCount).toBe(0);
    expect(result.rpkiSummary.coveragePercentage).toBe(100);
    expect(result.hijackRiskDetected).toBe(false);
  });

  it('correctly maps AWS CloudFront IPs to AS16509 with VALID RPKI ROA', async () => {
    const snapshot: DiscoverySnapshot = {
      dns: {
        a: ['13.32.18.42', '13.32.18.99'],
        aaaa: [],
        mx: [],
        ns: [],
        cname: [],
        txt: [],
        dmarc: [],
      },
    };

    const result = await service.discover('aws-domain.com', snapshot);
    expect(result.status).toBe('SUCCESS');
    expect(result.routes).toHaveLength(2);
    expect(result.uniqueAsns).toContain(16509);
    expect(result.rpkiSummary.overallRpkiStatus).toBe('VALID');
    expect(result.hijackRiskDetected).toBe(false);
  });

  it('detects multi-homed infrastructure across multiple Autonomous Systems', async () => {
    const snapshot: DiscoverySnapshot = {
      dns: {
        a: ['104.21.4.1', '13.32.18.42'], // Cloudflare (AS13335) + AWS (AS16509)
        aaaa: [],
        mx: [],
        ns: [],
        cname: [],
        txt: [],
        dmarc: [],
      },
    };

    const result = await service.discover('multi-cloud.com', snapshot);
    expect(result.status).toBe('SUCCESS');
    expect(result.isMultiHomed).toBe(true);
    expect(result.uniqueAsns).toContain(13335);
    expect(result.uniqueAsns).toContain(16509);
  });

  it('handles empty IP records gracefully without error', async () => {
    const snapshot: DiscoverySnapshot = {
      dns: {
        a: [],
        aaaa: [],
        mx: [],
        ns: [],
        cname: [],
        txt: [],
        dmarc: [],
      },
    };

    const result = await service.discover('no-ip-domain.com', snapshot);
    expect(result.status).toBe('SUCCESS');
    expect(result.routes).toHaveLength(0);
    expect(result.rpkiSummary.totalRoutes).toBe(0);
    expect(result.rpkiSummary.overallRpkiStatus).toBe('UNKNOWN');
  });
});
