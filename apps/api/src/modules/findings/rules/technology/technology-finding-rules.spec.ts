import { EdgeOriginExposureRule } from './edge-origin-exposure.rule';
import { MissingSecureIngressRule } from './missing-secure-ingress.rule';
import { TechnologyVersionExposureRule } from './technology-version-exposure.rule';
import { DeprecatedGatewayVersionRule } from './deprecated-gateway-version.rule';
import { ClientIntegrationExposureRule } from './client-integration-exposure.rule';
import { ArchitectureDriftRiskRule } from './architecture-drift-risk.rule';
import { FindingContext } from '../../contracts/finding-context.interface';
import { DiscoverySnapshot } from '../../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../../../infrastructure/discovery/technology/contracts';
import { Severity } from '../../enums/severity.enum';

describe('Technology Finding Rules (TECH-007)', () => {
  describe('1. EdgeOriginExposureRule', () => {
    let rule: EdgeOriginExposureRule;

    beforeEach(() => {
      rule = new EdgeOriginExposureRule();
    });

    it('triggers when an edge CDN is observed but backend server headers leak through', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          http: {
            reachable: true,
            protocol: 'https',
            headers: {
              server: 'Apache/2.4.52 (Ubuntu)',
              'cf-ray': '89a123-iad',
            },
          } as any,
          technology: {
            architectureBrief: {
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Cloudflare' }],
                },
              ],
            } as any,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe(
        'Direct Origin Infrastructure Metadata Exposed Alongside Edge CDN',
      );
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].whatThisDoesNotProve).toBeDefined();
    });

    it('does NOT trigger when edge CDN sanitizes server headers', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          http: {
            reachable: true,
            protocol: 'https',
            headers: {
              server: 'cloudflare',
              'cf-ray': '89a123-iad',
            },
          } as any,
          technology: {
            architectureBrief: {
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Cloudflare' }],
                },
              ],
            } as any,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('2. MissingSecureIngressRule', () => {
    let rule: MissingSecureIngressRule;

    beforeEach(() => {
      rule = new MissingSecureIngressRule();
    });

    it('triggers when application is directly accessible over cleartext HTTP', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          http: {
            reachable: true,
            protocol: 'http',
            finalUrl: 'http://insecure-app.com',
          } as any,
          technology: {
            architectureBrief: {
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Next.js' }],
                },
              ],
            } as any,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe(
        'Application Endpoint Accessible Over Unencrypted HTTP',
      );
      expect(findings[0].severity).toBe(Severity.HIGH);
    });

    it('does NOT trigger when application is served securely over HTTPS', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          http: {
            reachable: true,
            protocol: 'https',
            finalUrl: 'https://secure-app.com',
          } as any,
          technology: {
            architectureBrief: {
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Next.js' }],
                },
              ],
            } as any,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('3. TechnologyVersionExposureRule', () => {
    let rule: TechnologyVersionExposureRule;

    beforeEach(() => {
      rule = new TechnologyVersionExposureRule();
    });

    it('triggers when software versions are exposed in response headers', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          technology: {
            technologies: [
              { name: 'NGINX', version: '1.24.0' } as any,
              { name: 'PHP', version: '8.2.14' } as any,
            ],
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe(
        'Technology Version Information Publicly Disclosed',
      );
      expect(findings[0].description).toContain('NGINX (v1.24.0)');
      expect(findings[0].description).toContain('PHP (v8.2.14)');
      expect(findings[0].severity).toBe(Severity.LOW);
    });

    it('does NOT trigger when technologies do not disclose versions', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          technology: {
            technologies: [
              { name: 'NGINX' } as any,
              { name: 'Next.js' } as any,
            ],
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('4. DeprecatedGatewayVersionRule', () => {
    let rule: DeprecatedGatewayVersionRule;

    beforeEach(() => {
      rule = new DeprecatedGatewayVersionRule();
    });

    it('triggers when an end-of-life gateway version is advertised', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          technology: {
            technologies: [{ name: 'PHP', version: '7.4.3' } as any],
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe(
        'Legacy / End-of-Life Gateway Component: PHP',
      );
      expect(findings[0].severity).toBe(Severity.MEDIUM);
    });

    it('does NOT trigger on modern active release branches', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          technology: {
            technologies: [
              { name: 'PHP', version: '8.2.14' } as any,
              { name: 'NGINX', version: '1.24.0' } as any,
            ],
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('5. ClientIntegrationExposureRule', () => {
    let rule: ClientIntegrationExposureRule;

    beforeEach(() => {
      rule = new ClientIntegrationExposureRule();
    });

    it('triggers CRITICAL finding when private Stripe secret key is leaked in client HTML', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          htmlBody:
            `<html><script>const stripe = Stripe("${['sk', 'live', '51Abcdefghijklmnopqrstuvwxyz123456'].join('_')}");</script></html>`,
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe(
        'Potential Secret Token Exposed in Client-Side Assets: Stripe Secret Key',
      );
      expect(findings[0].severity).toBe(Severity.CRITICAL);
    });

    it('does NOT trigger on standard public client SDKs (pk_live_...)', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          htmlBody:
            '<html><script src="https://js.stripe.com/v3"></script><script>const stripe = Stripe("pk_live_51Abcdefghijklmnopqrstuvwxyz123456");</script></html>',
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('6. ArchitectureDriftRiskRule', () => {
    let rule: ArchitectureDriftRiskRule;

    beforeEach(() => {
      rule = new ArchitectureDriftRiskRule();
    });

    it('triggers when application is directly exposed without edge CDN or reverse proxy gateway', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          technology: {
            architectureBrief: {
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Next.js' }],
                },
              ],
            } as any,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe(
        'Direct Application Ingress Without Edge or Gateway Protection',
      );
      expect(findings[0].severity).toBe(Severity.LOW);
    });

    it('does NOT trigger when edge CDN or gateway layer is present', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          technology: {
            architectureBrief: {
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Cloudflare' }],
                },
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  technologies: [{ technologyName: 'Next.js' }],
                },
              ],
            } as any,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
