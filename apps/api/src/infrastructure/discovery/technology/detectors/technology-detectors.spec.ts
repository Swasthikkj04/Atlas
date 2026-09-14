import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';
import { TechnologyCategory } from '../contracts';
import { CloudflareDetector } from './cloud/cloudflare.detector';
import { AwsDetector } from './cloud/aws.detector';
import { VercelDetector } from './cloud/vercel.detector';
import { NetlifyDetector } from './cloud/netlify.detector';
import { GcpDetector } from './cloud/gcp.detector';
import { AzureDetector } from './cloud/azure.detector';
import { GitHubPagesDetector } from './cloud/github-pages.detector';
import { NginxDetector } from './web-servers/nginx.detector';
import { ApacheDetector } from './web-servers/apache.detector';
import { IisDetector } from './web-servers/iis.detector';
import { NextJsDetector } from './frameworks/nextjs.detector';
import { ReactDetector } from './frameworks/react.detector';
import { VueDetector } from './frameworks/vue.detector';
import { WordPressDetector } from './cms/wordpress.detector';
import { ShopifyDetector } from './cms/shopify.detector';
import { CloudFrontDetector } from './cdn/cloudfront.detector';
import { GoogleCloudCdnDetector } from './cdn/google-cloud-cdn.detector';
import { AkamaiDetector } from './cdn/akamai.detector';
import { DockerDetector } from './runtime/docker.detector';
import { GoogleAnalyticsDetector } from './analytics/google-analytics.detector';
import { StripeDetector } from './payments/stripe.detector';
import { HstsDetector } from './security/hsts.detector';
import { DotNetDetector } from './runtime/dotnet.detector';
import { AspNetCoreDetector } from './frameworks/aspnet-core.detector';
import { FastlyDetector } from './cdn/fastly.detector';
import { EnvoyDetector } from './web-servers/envoy.detector';
import { CaddyDetector } from './web-servers/caddy.detector';
import { TraefikDetector } from './web-servers/traefik.detector';

describe('Technology Detectors Unit Tests', () => {
  describe('CloudflareDetector', () => {
    const detector = new CloudflareDetector();

    it('detects Cloudflare from cf-ray header and Server header', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'cloudflare.com',
        http: {
          headers: {
            'cf-ray': '89a123456789-iad',
            server: 'cloudflare',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Cloudflare');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result?.role).toContain('Global edge network');
      expect(result?.infrastructureMeaning).toContain('Cloudflare');
      expect(result?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('returns null when no Cloudflare indicators exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'example.com',
        http: { headers: { server: 'nginx' } } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('AwsDetector', () => {
    const detector = new AwsDetector();

    it('detects AWS from x-amz-cf-id header and S3 server banner', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aws-site.com',
        http: {
          headers: {
            'x-amz-cf-id': 'xyz123==',
            server: 'AmazonS3',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Amazon Web Services (AWS)');
      expect(result?.confidence).toBe(0.98);
      expect(result?.evidence).toHaveLength(2);
    });
  });

  describe('VercelDetector', () => {
    const detector = new VercelDetector();

    it('detects Vercel from x-vercel-id header and vercel-dns CNAME', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'my-app.vercel.app',
        dns: {
          cname: ['cname.vercel-dns.com'],
          a: ['76.76.21.21'],
        } as any,
        http: {
          headers: {
            'x-vercel-id': 'iad1::iad1::xyz',
            server: 'Vercel',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Vercel');
      expect(result?.confidence).toBe(0.99);
      expect(result?.role).toContain('Edge Platform');
    });
  });

  describe('NginxDetector', () => {
    const detector = new NginxDetector();

    it('detects NGINX and extracts version', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'nginx.org',
        http: {
          headers: {
            server: 'nginx/1.24.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('NGINX');
      expect(result?.version).toBe('1.24.0');
      expect(result?.confidence).toBe(0.99);
    });
  });

  describe('NextJsDetector', () => {
    const detector = new NextJsDetector();

    it('detects Next.js from __NEXT_DATA__ and X-Powered-By header', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'nextjs-app.com',
        http: {
          headers: {
            'x-powered-by': 'Next.js',
          },
        } as any,
        htmlBody:
          '<html><body><script id="__NEXT_DATA__">{}</script></body></html>',
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Next.js');
      expect(result?.confidence).toBe(0.98);
      expect(result?.evidence).toHaveLength(2);
    });
  });

  describe('ReactDetector', () => {
    const detector = new ReactDetector();

    it('detects React from data-reactroot attribute in HTML', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'react-app.com',
        htmlBody: '<div id="root" data-reactroot=""><h1>Hello</h1></div>',
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('React');
      expect(result?.confidence).toBe(0.95);
    });
  });

  describe('WordPressDetector', () => {
    const detector = new WordPressDetector();

    it('detects WordPress from wp-content paths and x-pingback header', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'blog.com',
        http: {
          headers: {
            'x-pingback': 'https://blog.com/xmlrpc.php',
          },
        } as any,
        htmlBody:
          '<link rel="stylesheet" href="/wp-content/themes/twentytwentyfour/style.css">',
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('WordPress');
      expect(result?.category).toContain('CMS');
      expect(result?.evidence).toHaveLength(2);
    });
  });

  describe('ShopifyDetector', () => {
    const detector = new ShopifyDetector();

    it('detects Shopify from x-shopid header and CDN assets', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'shop.com',
        http: {
          headers: {
            'x-shopid': '123456',
          },
        } as any,
        htmlBody:
          '<script src="https://cdn.shopify.com/s/files/1/00/theme.js"></script>',
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Shopify');
      expect(result?.confidence).toBe(0.99);
    });
  });

  describe('AkamaiDetector', () => {
    const detector = new AkamaiDetector();

    it('detects Akamai Edge from Server: AkamaiGHost, x-akamai-transformed, and akamai-grn', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'akamai-customer.com',
        http: {
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
            'akamai-grn': '0.85e3a840.1698240000.1234567',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Akamai');
      expect(result?.category).toBe(TechnologyCategory.CDN_EDGE);
      expect(result?.role).toBe('Edge Delivery / CDN Ingress');
      expect(result?.version).toBeUndefined();
      expect(result?.confidence).toBe(0.99);
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toContain(
        'Akamai edge delivery evidence confirms edge proxy',
      );
      expect(result?.evidence.length).toBe(3);
    });

    it('detects Akamai Edge from CNAME target', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'enterprise.bank.com',
        dns: {
          cname: ['e1234.dscg.akamaiedge.net'],
        } as any,
        http: {
          headers: {
            server: 'Apache',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Akamai');
      expect(result?.role).toBe('Edge Delivery / CDN Ingress');
    });

    it('returns null when no Akamai indicators exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'plain-site.com',
        http: {
          headers: {
            server: 'nginx',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('HstsDetector', () => {
    const detector = new HstsDetector();

    it('detects HSTS from strict-transport-security header', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'secure.com',
        http: {
          headers: {
            'strict-transport-security':
              'max-age=31536000; includeSubDomains; preload',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('HTTP Strict Transport Security (HSTS)');
      expect(result?.confidence).toBe(0.99);
    });
  });

  describe('DotNetDetector', () => {
    const detector = new DotNetDetector();

    it('detects .NET from X-Powered-By: ASP.NET with extracted version', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'dotnet.service.io',
        http: {
          headers: {
            'x-powered-by': 'ASP.NET',
            'x-aspnet-version': '4.0.30319',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('.NET');
      expect(result?.version).toBe('4.0.30319');
    });

    it('detects .NET from Kestrel server header without version hallucination', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'kestrel.service.io',
        http: {
          headers: {
            server: 'Kestrel',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('.NET');
      expect(result?.version).toBeUndefined();
    });
  });

  describe('AspNetCoreDetector', () => {
    const detector = new AspNetCoreDetector();

    it('detects ASP.NET Core from .AspNetCore.Cookies header', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aspnetcore.app.io',
        http: {
          headers: {
            'set-cookie':
              '.AspNetCore.Cookies=auth-token-123; path=/; secure; httponly',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('ASP.NET Core');
      expect(result?.role).toContain('Server-side web application framework');
    });

    it('detects ASP.NET Core with explicit version from X-Powered-By', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aspnetcore.app.io',
        http: {
          headers: {
            'x-powered-by': 'ASP.NET Core 8.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('ASP.NET Core');
      expect(result?.version).toBe('8.0');
    });
  });

  describe('IisDetector', () => {
    const detector = new IisDetector();

    it('detects Microsoft IIS when Server header contains Microsoft-IIS', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'iis.enterprise.com',
        http: {
          headers: {
            server: 'Microsoft-IIS/10.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Microsoft IIS');
      expect(result?.version).toBe('10.0');
    });

    it('does NOT detect Microsoft IIS when only ASP.NET headers are present without IIS banner', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'kestrel-app.io',
        http: {
          headers: {
            server: 'Kestrel',
            'x-aspnet-version': '4.0.30319',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('EnvoyDetector', () => {
    const detector = new EnvoyDetector();

    it('detects Envoy from server header with version', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'envoy.service.io',
        http: {
          headers: {
            server: 'envoy/1.28.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Envoy');
      expect(result?.role).toBe('Reverse Proxy / Service Proxy');
      expect(result?.version).toBe('1.28.0');
      expect(result?.confidenceLevel).toBe('HIGH');
    });

    it('detects Envoy from server header without version (leaves version undefined)', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'envoy-plain.io',
        http: {
          headers: {
            server: 'envoy',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Envoy');
      expect(result?.version).toBeUndefined();
    });

    it('detects Envoy from x-envoy-upstream-service-time and decorator headers', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'envoy-telemetry.io',
        http: {
          headers: {
            'x-envoy-upstream-service-time': '12',
            'x-envoy-decorator-operation': 'default-route',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Envoy');
      expect(result?.evidence.length).toBe(2);
    });

    it('detects Envoy from canonical error body pattern', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'envoy-error.io',
        htmlBody:
          'upstream connect error or disconnect/reset before headers. reset reason: connection failure',
        http: {
          statusCode: 503,
          headers: {},
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Envoy');
    });

    it('returns null when no Envoy signals exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'plain-site.org',
        http: {
          headers: {
            server: 'nginx/1.24.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('GcpDetector', () => {
    const detector = new GcpDetector();

    it('detects Google Cloud Platform from Server: gws and x-cloud-trace-context', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'cloud-run-app.run.app',
        dns: {
          cname: ['ghs.googlehosted.com'],
          ns: ['ns-cloud-a1.googledomains.com'],
        } as any,
        http: {
          headers: {
            server: 'gws',
            'x-cloud-trace-context': '105445aa7843bc8bf206b120001000/1',
          },
        } as any,
        tls: {
          issuer: 'CN=GTS CA 1C3, O=Google Trust Services LLC, C=US',
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Google Cloud Platform (GCP)');
      expect(result?.category).toBe('Cloud / Infrastructure');
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.role).toBe('Cloud Ingress & Managed Platform');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('detects Google Cloud DNS when only googledomains nameservers are present', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'dns-only-gcp.org',
        dns: {
          ns: ['ns1.googledomains.com', 'ns2.googledomains.com'],
        } as any,
        http: {
          headers: {
            server: 'nginx',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Google Cloud Platform (GCP)');
      expect(result?.role).toBe('Authoritative DNS (Google Cloud DNS)');
    });

    it('returns null when no GCP signals exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aws-app.com',
        http: {
          headers: {
            server: 'awselb/2.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('GoogleCloudCdnDetector', () => {
    const detector = new GoogleCloudCdnDetector();

    it('detects Google Cloud CDN from via: google header and x-goog-generation', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'cdn.my-gcp-site.com',
        dns: {
          cname: ['c.storage.googleapis.com'],
        } as any,
        http: {
          headers: {
            via: '1.1 google',
            'x-goog-generation': '1692881234567890',
            'x-goog-metageneration': '1',
            'x-goog-hash': 'crc32c=NjgxMjM==',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Google Cloud CDN');
      expect(result?.category).toBe('CDN / Edge');
      expect(result?.role).toBe('Edge Delivery / CDN Ingress');
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('returns null when no Google CDN signals exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'cloudfront-app.com',
        http: {
          headers: {
            via: '1.1 cloudfront.net',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('FastlyDetector', () => {
    const detector = new FastlyDetector();

    it('detects Fastly from x-served-by, x-cache, and fastly CNAME', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'fastly-app.com',
        dns: {
          cname: ['dualstack.fastly.net'],
        } as any,
        http: {
          headers: {
            'x-served-by': 'cache-iad-kcgs7200020-IAD',
            'x-cache': 'HIT, HIT',
            'x-cache-hits': '2',
            'x-timer': 'S1698240000,VS0,VE1',
            'x-fastly-request-id': '9876543210abcdef',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Fastly');
      expect(result?.category).toBe('CDN / Edge');
      expect(result?.role).toBe('Edge Delivery / CDN Ingress');
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('returns null when no Fastly signals exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'nginx-origin.org',
        http: {
          headers: {
            server: 'nginx/1.24.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('CaddyDetector', () => {
    const detector = new CaddyDetector();

    it('detects Caddy from Server: Caddy header and extracts clean version', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'caddy-app.io',
        http: {
          headers: {
            server: 'Caddy/v2.7.6',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Caddy');
      expect(result?.category).toBe('Web / Server');
      expect(result?.role).toContain('Web Server / Ingress Gateway');
      expect(result?.version).toBe('2.7.6');
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.whatThisDoesNotProve).toContain('Docker');
      expect(result?.whatThisDoesNotProve).toContain('Kubernetes');
    });

    it('detects Caddy from via header and custom caddy header without version hallucination', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'proxy.caddy.dev',
        http: {
          headers: {
            via: '1.1 caddy',
            'x-caddy-router': 'default',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Caddy');
      expect(result?.version).toBeUndefined();
      expect(result?.confidenceLevel).toBe('HIGH');
    });

    it('returns null when no Caddy indicators exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'apache-app.com',
        http: {
          headers: {
            server: 'Apache/2.4.58',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('TraefikDetector', () => {
    const detector = new TraefikDetector();

    it('detects Traefik from Server: Traefik header and extracts clean version', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'traefik-ingress.io',
        http: {
          headers: {
            server: 'traefik/v2.10.4',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Traefik');
      expect(result?.category).toBe('Web / Server');
      expect(result?.role).toContain('Ingress Gateway / Reverse Proxy');
      expect(result?.version).toBe('2.10.4');
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.whatThisDoesNotProve).toContain('Kubernetes');
      expect(result?.whatThisDoesNotProve).toContain('Docker');
    });

    it('detects Traefik from x-traefik-router header without version hallucination', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'api.microservices.net',
        http: {
          headers: {
            'x-traefik-router': 'web-router@docker',
            'x-traefik-service': 'api-service@docker',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Traefik');
      expect(result?.version).toBeUndefined();
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('returns null when no Traefik indicators exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'nginx-app.com',
        http: {
          headers: {
            server: 'nginx/1.24.0',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('VercelDetector', () => {
    const detector = new VercelDetector();

    it('detects Vercel from x-vercel-id, x-vercel-cache, and Server: vercel headers', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'vercel-app.com',
        http: {
          headers: {
            'x-vercel-id': 'iad1::5q8v7-1724912345678-abcdef',
            'x-vercel-cache': 'HIT',
            server: 'Vercel',
            'x-vercel-edge-region': 'iad1',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Vercel');
      expect(result?.category).toBe(TechnologyCategory.CLOUD_INFRASTRUCTURE);
      expect(result?.role).toContain('Edge Platform');
      expect(result?.version).toBeUndefined();
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.whatThisDoesNotProve).toContain('Next.js');
      expect(result?.whatThisDoesNotProve).toContain('React');
      expect(result?.whatThisDoesNotProve).toContain('Node.js');
      expect(result?.whatThisDoesNotProve).toContain('PostgreSQL');
      expect(result?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('detects Vercel from CNAME, A record, and TLS SAN', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'custom-vercel-domain.io',
        dns: {
          cname: ['cname.vercel-dns.com'],
          a: ['76.76.21.21'],
          ns: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'],
        } as any,
        ssl: {
          certificate: {
            subjectAltName: 'DNS:*.vercel.app, DNS:vercel.app',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Vercel');
      expect(result?.version).toBeUndefined();
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('returns null when no Vercel indicators exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'aws-origin.net',
        http: {
          headers: {
            server: 'nginx/1.24.0',
            'x-amz-cf-id': 'xyz123',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });

  describe('NetlifyDetector', () => {
    const detector = new NetlifyDetector();

    it('detects Netlify from x-nf-request-id and Server: Netlify headers', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'netlify-site.com',
        http: {
          headers: {
            'x-nf-request-id': '01HN8Q4V2E45P67890ABCDEF',
            server: 'Netlify',
            'x-nf-deploy-id': '64e8b9a12c4d5e6f7a8b9c0d',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Netlify');
      expect(result?.category).toBe(TechnologyCategory.CLOUD_INFRASTRUCTURE);
      expect(result?.role).toContain('Edge Platform');
      expect(result?.version).toBeUndefined();
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.whatThisDoesNotProve).toBeDefined();
      expect(result?.whatThisDoesNotProve).toContain('React');
      expect(result?.whatThisDoesNotProve).toContain('Vue');
      expect(result?.whatThisDoesNotProve).toContain('JAMstack');
      expect(result?.whatThisDoesNotProve).toContain('Docker');
      expect(result?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('detects Netlify from netlify.app CNAME, NS records, and TLS SAN', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'custom-netlify-domain.io',
        dns: {
          cname: ['custom-site.netlify.app'],
          ns: ['dns1.p01.nsone.net', 'dns2.p01.nsone.net'],
        } as any,
        ssl: {
          certificate: {
            subjectAltName: 'DNS:*.netlify.app, DNS:netlify.app',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Netlify');
      expect(result?.version).toBeUndefined();
      expect(result?.confidenceLevel).toBe('HIGH');
      expect(result?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('returns null when no Netlify indicators exist', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'fastly-origin.net',
        http: {
          headers: {
            server: 'Apache/2.4.58',
            'x-served-by': 'cache-iad-1234',
          },
        } as any,
      });

      const result = detector.detect(context);
      expect(result).toBeNull();
    });
  });
});
