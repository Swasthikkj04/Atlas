import { TechnologyMeaningEngine } from './technology-meaning.engine';
import { TechnologyDetectorRegistryService } from '../registry/technology-detector-registry.service';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyDetector,
} from '../contracts';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';
import { CloudFrontDetector } from '../detectors/cdn/cloudfront.detector';
import { CloudflareDetector } from '../detectors/cloud/cloudflare.detector';
import { NextJsDetector } from '../detectors/frameworks/nextjs.detector';
import { NginxDetector } from '../detectors/web-servers/nginx.detector';
import { StripeDetector } from '../detectors/payments/stripe.detector';
import { DockerDetector } from '../detectors/runtime/docker.detector';

describe('TechnologyMeaningEngine (TECH-002)', () => {
  let registry: TechnologyDetectorRegistryService;
  let meaningEngine: TechnologyMeaningEngine;

  beforeEach(() => {
    registry = new TechnologyDetectorRegistryService();
    meaningEngine = new TechnologyMeaningEngine(registry);
  });

  describe('Core 4 Questions Transformation', () => {
    it('enriches raw technology detections with comprehensive 4-question answers grounded in evidence', async () => {
      const cloudFrontDetector = new CloudFrontDetector();
      registry.register(cloudFrontDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'cdn.example.com',
        http: {
          headers: {
            'x-amz-cf-id': 'xyz-trace-123==',
            via: '1.1 cloudfront.net',
          },
        } as any,
      });

      const rawResult = cloudFrontDetector.detect(context);
      expect(rawResult).not.toBeNull();

      const interpreted = await meaningEngine.interpret(rawResult, context);

      // Question 1: What is it?
      expect(interpreted.name).toBe('AWS CloudFront');
      expect(interpreted.category).toBe(TechnologyCategory.CDN_EDGE);
      expect(interpreted.description).toContain(
        'CloudFront global content delivery network',
      );

      // Question 2: Why do we believe it is present?
      expect(interpreted.whyDetected).toContain('x-amz-cf-id');
      expect(interpreted.whyDetected).toContain('via');

      // Question 3: What role does it play in this infrastructure?
      expect(interpreted.role).toContain('Edge / CDN');

      // Question 4: What does its presence mean for this infrastructure?
      expect(interpreted.infrastructureMeaning).toContain("AWS's edge network");

      // Critical Rule: Evidence & Claim Boundary Enforcement
      expect(interpreted.whatThisDoesNotProve).toContain(
        'CloudFront edge delivery does not prove origin hosting on AWS EC2',
      );
      expect(interpreted.implications?.length).toBeGreaterThanOrEqual(2);
    });

    it('enforces claim boundaries preventing unsupported origin/hosting inferences for Next.js', async () => {
      const nextJsDetector = new NextJsDetector();
      registry.register(nextJsDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'app.example.com',
        http: {
          headers: {
            'x-powered-by': 'Next.js',
          },
        } as any,
        htmlBody: '<script id="__NEXT_DATA__">{}</script>',
      });

      const rawResult = nextJsDetector.detect(context);
      expect(rawResult).not.toBeNull();

      const interpreted = await meaningEngine.interpret(rawResult, context);

      // Q1: What is it?
      expect(interpreted.name).toBe('Next.js');
      expect(interpreted.category).toBe(TechnologyCategory.FRAMEWORK);

      // Q2: Why detected?
      expect(interpreted.whyDetected).toContain('x-powered-by');
      expect(interpreted.whyDetected).toContain('__NEXT_DATA__');

      // Q3: Role
      expect(interpreted.role).toContain('React-based application framework');

      // Q4: Meaning & Boundary
      expect(interpreted.infrastructureMeaning).toContain('Next.js framework');
      expect(interpreted.whatThisDoesNotProve).toContain(
        'Next.js framework usage does not prove hosting on Vercel',
      );
    });

    it('enforces claim boundaries for Cloudflare edge proxying', async () => {
      const cloudflareDetector = new CloudflareDetector();
      registry.register(cloudflareDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'protected.com',
        http: {
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123-iad',
          },
        } as any,
      });

      const rawResult = cloudflareDetector.detect(context);
      expect(rawResult).not.toBeNull();

      const interpreted = await meaningEngine.interpret(rawResult, context);

      expect(interpreted.name).toBe('Cloudflare');
      expect(interpreted.whyDetected).toContain('server');
      expect(interpreted.whyDetected).toContain('cf-ray');
      expect(interpreted.whatThisDoesNotProve).toContain(
        'Presence of Cloudflare edge proxy does not identify or prove the underlying origin server',
      );
    });
  });

  describe('Detector Custom Interpretation & Resilience', () => {
    it('supports custom interpret() method defined on a detector', async () => {
      const customDetector: TechnologyDetector = {
        id: 'tech-custom-meaning',
        name: 'Custom BaaS',
        category: TechnologyCategory.CLOUD_INFRASTRUCTURE,
        description: 'Custom Backend as a Service',
        role: 'Custom BaaS',
        infrastructureMeaning: 'Custom BaaS meaning',
        detectionSignals: ['x-custom-baas header'],
        confidenceRules: 'High confidence if header present',
        whatThisDoesNotProve: 'Does not prove private database architecture',
        detect: () => ({
          id: 'tech-custom-meaning',
          name: 'Custom BaaS',
          category: TechnologyCategory.CLOUD_INFRASTRUCTURE,
          status: 'DETECTED',
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          whyDetected: 'Observed x-custom-baas header',
          role: 'Custom BaaS Gateway',
          infrastructureMeaning: 'Custom BaaS infrastructure',
          evidence: [
            {
              sourceType: 'HTTP',
              source: 'Response Header: x-custom-baas',
              indicator: 'x-custom-baas',
              confidence: 'HIGH',
            },
          ],
          signals: [],
          evidenceCount: 1,
        }),
        interpret: async (result, context) => ({
          whyDetected: `Specialized validation: Found header on ${context.domainName}`,
          role: 'Dedicated BaaS Data Ingress',
          infrastructureMeaning:
            'All database operations route through managed BaaS clusters.',
          whatThisDoesNotProve:
            'Does not prove which geographic region the cluster resides in.',
          implications: ['Direct client-to-BaaS connection active.'],
        }),
      };

      registry.register(customDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'baas-app.com',
      });

      const rawResult = customDetector.detect(context);
      const interpreted = await meaningEngine.interpret(rawResult, context);

      expect(interpreted.whyDetected).toBe(
        'Specialized validation: Found header on baas-app.com',
      );
      expect(interpreted.role).toBe('Dedicated BaaS Data Ingress');
      expect(interpreted.infrastructureMeaning).toBe(
        'All database operations route through managed BaaS clusters.',
      );
      expect(interpreted.whatThisDoesNotProve).toBe(
        'Does not prove which geographic region the cluster resides in.',
      );
      expect(interpreted.implications).toEqual([
        'Direct client-to-BaaS connection active.',
      ]);
    });

    it('gracefully falls back when custom interpret() throws an unhandled error', async () => {
      const failingInterpretDetector: TechnologyDetector = {
        id: 'tech-failing-meaning',
        name: 'Failing Meaning Tech',
        category: TechnologyCategory.WEB_SERVER,
        description: 'Fails in interpret',
        role: 'Web Server',
        infrastructureMeaning: 'Standard Web Server',
        detectionSignals: [],
        confidenceRules: 'Rules',
        whatThisDoesNotProve: 'Standard boundary',
        detect: () => ({
          id: 'tech-failing-meaning',
          name: 'Failing Meaning Tech',
          category: TechnologyCategory.WEB_SERVER,
          status: 'DETECTED',
          confidence: 0.9,
          confidenceLevel: 'HIGH',
          whyDetected: 'Observed server banner',
          role: 'Web Server',
          infrastructureMeaning: 'Standard Web Server',
          evidence: [
            {
              sourceType: 'HTTP',
              source: 'Response Header: server',
              indicator: 'server: fail',
              confidence: 'HIGH',
            },
          ],
          signals: [],
          evidenceCount: 1,
        }),
        interpret: () => {
          throw new Error('Fatal error during custom interpretation');
        },
      };

      registry.register(failingInterpretDetector);

      const context = createTechnologyDetectionContext({
        domainName: 'test-fallback.com',
      });

      const rawResult = failingInterpretDetector.detect(context);
      const interpreted = await meaningEngine.interpret(rawResult, context);

      expect(interpreted.name).toBe('Failing Meaning Tech');
      expect(interpreted.whyDetected).toBeDefined();
      expect(interpreted.role).toBe('Web Server');
      expect(interpreted.infrastructureMeaning).toBe('Standard Web Server');
      expect(interpreted.whatThisDoesNotProve).toBe('Standard boundary');
    });
  });

  describe('Batch Interpretation across Diverse Real-World Stacks', () => {
    it('interprets multi-technology stack without cross-pollination of claims', async () => {
      const nginx = new NginxDetector();
      const docker = new DockerDetector();
      const stripe = new StripeDetector();

      registry.register(nginx);
      registry.register(docker);
      registry.register(stripe);

      const context = createTechnologyDetectionContext({
        domainName: 'shop.company.com',
        http: {
          headers: {
            server: 'nginx/1.24.0',
            'docker-distribution-api-version': 'registry/2.0',
          },
        } as any,
        htmlBody: '<script src="https://js.stripe.com/v3"></script>',
      });

      const raw1 = nginx.detect(context);
      const raw2 = docker.detect(context);
      const raw3 = stripe.detect(context);

      const batch = await meaningEngine.interpretAll(
        [raw1, raw2, raw3],
        context,
      );

      expect(batch).toHaveLength(3);

      const nginxRes = batch.find((b) => b.name === 'NGINX');
      expect(nginxRes.version).toBe('1.24.0');
      expect(nginxRes.whatThisDoesNotProve).toContain('Linux distribution');

      const dockerRes = batch.find((b) => b.name === 'Docker');
      expect(dockerRes.role).toContain('Containerized application runtime');
      expect(dockerRes.whatThisDoesNotProve).toContain('cloud provider');

      const stripeRes = batch.find((b) => b.name === 'Stripe');
      expect(stripeRes.category).toBe(TechnologyCategory.PAYMENTS);
      expect(stripeRes.whatThisDoesNotProve).toContain(
        'backend payment gateway architecture',
      );
    });
  });
});
