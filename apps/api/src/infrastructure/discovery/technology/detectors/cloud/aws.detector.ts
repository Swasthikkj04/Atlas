import { Injectable } from '@nestjs/common';
import { BaseTechnologyDetector } from '../../base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
} from '../../contracts';

@Injectable()
export class AwsDetector extends BaseTechnologyDetector {
  readonly id = 'tech-aws';
  readonly name = 'Amazon Web Services (AWS)';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Amazon Web Services (AWS) cloud platform providing managed compute, networking, storage, DNS, and load balancing services';
  readonly role = 'Cloud Infrastructure & Managed Services';
  readonly infrastructureMeaning =
    'Observable AWS-managed infrastructure (such as DNS, load balancing, or cloud gateway services) participates in delivering the public endpoint.';
  readonly detectionSignals = [
    'x-amzn-trace-id response header (ALB / API Gateway)',
    'x-amz-cf-id response header (CloudFront)',
    'Server: awselb or Server: AmazonS3 response header',
    'AWSALB / AWSELB session routing cookies',
    'Amazon Trust Services TLS certificate issuer',
    'CNAME target resolving to amazonaws.com or elasticbeanstalk.com',
    'awsdns authoritative nameservers (Route 53)',
  ];
  readonly confidenceRules =
    'HIGH confidence when AWS service headers (x-amzn-trace-id), S3/ELB server banners, AWS cookies, or AWS domain CNAMEs/nameservers are observed.';
  readonly whatThisDoesNotProve =
    'Observable AWS service infrastructure confirms participation of specific AWS-managed components (such as ALB, ELB, Route 53, or CloudFront), but does not prove the entire application runs on AWS, nor does it establish EC2, ECS, EKS, Lambda, RDS, S3, DynamoDB, ElastiCache, private VPC architecture, Kubernetes, Linux, a specific AWS region, or backend database services without direct evidence.';
  readonly defaultImplications = [
    'Public traffic is routed through or served by Amazon Web Services managed infrastructure components.',
    'DNS resolution, load balancing, or edge delivery utilizes AWS cloud services.',
    'Origin compute, host operating system, and private network topology remain unobservable unless directly exposed.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const via = context.getHeader('via')?.toLowerCase() ?? '';
    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasAmzCfId = context.hasHeader('x-amz-cf-id');
    const hasAmzTraceId = context.hasHeader('x-amzn-trace-id');
    const hasAwsCname = context.hasCname(
      /amazonaws\.com|elasticbeanstalk\.com/i,
    );
    const hasAwsDns = context.hasNs(/awsdns/i);

    // 1. AWS ALB / API Gateway Trace ID
    if (hasAmzTraceId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-amzn-trace-id',
        indicator:
          'AWS Application Load Balancer / API Gateway request trace ID',
        observedValue: context.getHeader('x-amzn-trace-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'AWS ALB Trace ID',
        type: 'HEADER',
        indicator: 'x-amzn-trace-id',
        matched: true,
        weight: 10,
      });
    }

    // 2. Server Banner (awselb / amazons3)
    if (server.includes('amazons3') || server.includes('awselb')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `AWS Server response banner: ${context.getHeader('server')}`,
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'AWS Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });
    }

    // 3. AWS Sticky Session / Load Balancer Cookies
    const awsCookies = [
      'AWSALB',
      'AWSALBCORS',
      'AWSALBTG',
      'AWSALBTGCORS',
      'AWSELB',
    ];
    for (const cookieName of awsCookies) {
      if (context.hasCookie(cookieName)) {
        evidence.push({
          sourceType: 'HTTP',
          source: 'Response Header: Set-Cookie',
          indicator: `AWS load balancer session cookie: ${cookieName}`,
          observedValue: `${cookieName}=${context.getCookie(cookieName)}`,
          confidence: 'HIGH',
        });
        signals.push({
          name: `AWS Cookie (${cookieName})`,
          type: 'COOKIE',
          indicator: cookieName,
          matched: true,
          weight: 10,
        });
      }
    }

    // 4. AWS CNAME resolution
    if (hasAwsCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator:
          'AWS domain CNAME target (*.amazonaws.com / *.elasticbeanstalk.com)',
        observedValue: context.dns?.cname
          ?.filter((c) => /amazonaws\.com|elasticbeanstalk\.com/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'AWS CNAME',
        type: 'DNS',
        indicator: 'amazonaws.com CNAME',
        matched: true,
        weight: 9,
      });
    }

    // 5. AWS Route 53 Nameservers
    if (hasAwsDns) {
      evidence.push({
        sourceType: 'DNS',
        source: 'Nameserver Records (NS)',
        indicator:
          'AWS Route 53 authoritative nameservers (*.awsdns-*.org/com)',
        observedValue: context.dns?.ns
          ?.filter((ns) => /awsdns/i.test(ns))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'AWS Route53 NS',
        type: 'DNS',
        indicator: 'awsdns NS',
        matched: true,
        weight: 8,
      });
    }

    // 6. AWS CloudFront Distribution Headers / Via
    if (hasAmzCfId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-amz-cf-id',
        indicator: 'AWS CloudFront edge distribution request ID',
        observedValue: context.getHeader('x-amz-cf-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'AWS CloudFront ID',
        type: 'HEADER',
        indicator: 'x-amz-cf-id',
        matched: true,
        weight: 8,
      });
    } else if (via.includes('cloudfront.net')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: 'AWS CloudFront proxy signature in Via header',
        observedValue: context.getHeader('via'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Via CloudFront',
        type: 'HEADER',
        indicator: 'via: cloudfront.net',
        matched: true,
        weight: 8,
      });
    }

    // 7. TLS Certificate Issuer (Amazon Trust Services)
    if (context.hasCertIssuer(/amazon/i)) {
      const issuerStr =
        typeof context.ssl?.certificate?.issuer === 'string'
          ? context.ssl.certificate.issuer
          : typeof context.ssl?.certificate?.issuer === 'object'
            ? (context.ssl.certificate.issuer as any).organization ||
              JSON.stringify(context.ssl.certificate.issuer)
            : (context.ssl as any)?.issuer || 'Amazon Trust Services';

      evidence.push({
        sourceType: 'TLS',
        source: 'TLS Certificate Issuer',
        indicator: 'Amazon Trust Services TLS certificate authority',
        observedValue: issuerStr,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Amazon TLS CA',
        type: 'TLS',
        indicator: 'Amazon Trust Services',
        matched: true,
        weight: 7,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    // Dynamic role specialization
    let role = `Cloud Infrastructure & Managed Services for ${context.domainName}`;
    if (
      hasAmzTraceId ||
      server.includes('awselb') ||
      awsCookies.some((c) => context.hasCookie(c))
    ) {
      role = 'Cloud Ingress & Load Balancing';
    } else if (hasAwsDns && evidence.length === 1) {
      role = 'Authoritative DNS (Route 53)';
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
