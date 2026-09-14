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
export class WordPressDetector extends BaseTechnologyDetector {
  readonly id = 'tech-wordpress';
  readonly name = 'WordPress';
  readonly category = TechnologyCategory.CMS;
  readonly description =
    'WordPress is a PHP-based content management system and application platform used to publish and serve dynamic web content';
  readonly role = 'Application / Content Management Platform';
  readonly infrastructureMeaning =
    'The observed endpoint appears to use WordPress as part of its application/content-delivery architecture.';
  readonly detectionSignals = [
    'HTML containing /wp-content/ or /wp-includes/ asset paths',
    'HTML containing wp-json REST API link',
    'HTML generator meta tag specifying WordPress',
    'X-Pingback response header pointing to xmlrpc.php',
    'Set-Cookie header containing wordpress_test_cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when /wp-content/ paths, /wp-includes/ paths, WordPress generator meta, X-Pingback, or wordpress cookies are detected.';
  readonly whatThisDoesNotProve =
    'WordPress presence does not by itself prove the exact PHP version, database engine, hosting provider, Linux distribution, Docker/Kubernetes deployment, Apache/NGINX usage, specific plugins, theme architecture, or administrative configuration.';
  readonly defaultImplications = [
    'Application content and dynamic page rendering are managed by WordPress.',
    'Underlying server runtime, database, and hosting architecture operate independently behind observed endpoints.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasWpContent = context.hasHtmlPattern('/wp-content/');
    const hasWpIncludes = context.hasHtmlPattern('/wp-includes/');
    const hasWpJson = context.hasHtmlPattern('wp-json');
    const xPingback = context.getHeader('x-pingback')?.toLowerCase() ?? '';
    const hasWpCookie = context.hasCookie('wordpress_test_cookie');

    // Generator tag version extraction
    let version: string | undefined;
    const htmlBody =
      context.htmlBody || (context as any)?.snapshot?.http?.html || '';
    const generatorMatch =
      htmlBody.match(
        /<meta[^>]*name=["']generator["'][^>]*content=["']WordPress\s+([\d.]+)["']/i,
      ) ||
      htmlBody.match(
        /content=["']WordPress\s+([\d.]+)["'][^>]*name=["']generator["']/i,
      );

    if (generatorMatch) {
      version = generatorMatch[1];
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Meta Tag: generator',
        indicator: `WordPress generator meta tag (v${version})`,
        observedValue: `WordPress ${version}`,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'WordPress Generator Meta',
        type: 'META',
        indicator: `WordPress ${version}`,
        matched: true,
        weight: 10,
      });
    }

    if (hasWpContent) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'WordPress content path (/wp-content/)',
        observedValue: '/wp-content/',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'WordPress wp-content',
        type: 'BODY',
        indicator: '/wp-content/',
        matched: true,
        weight: 10,
      });
    }

    if (hasWpIncludes) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'WordPress core assets path (/wp-includes/)',
        observedValue: '/wp-includes/',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'WordPress wp-includes',
        type: 'BODY',
        indicator: '/wp-includes/',
        matched: true,
        weight: 10,
      });
    }

    if (hasWpJson) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'WordPress REST API endpoint reference (wp-json)',
        observedValue: 'wp-json',
        confidence: 'MEDIUM',
      });
      signals.push({
        name: 'WordPress REST API',
        type: 'BODY',
        indicator: 'wp-json',
        matched: true,
        weight: 8,
      });
    }

    if (xPingback.includes('xmlrpc.php')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-pingback',
        indicator: `WordPress XML-RPC Pingback Header (${context.getHeader('x-pingback')})`,
        observedValue: context.getHeader('x-pingback'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'WordPress Pingback',
        type: 'HEADER',
        indicator: 'x-pingback: xmlrpc.php',
        matched: true,
        weight: 10,
      });
    }

    if (hasWpCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'WordPress test cookie (wordpress_test_cookie)',
        observedValue: 'wordpress_test_cookie',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'WordPress Cookie',
        type: 'COOKIE',
        indicator: 'wordpress_test_cookie',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Content Management System (CMS) and application platform for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `HTML generator meta tag (WordPress ${version})`
        : undefined,
    });
  }
}
