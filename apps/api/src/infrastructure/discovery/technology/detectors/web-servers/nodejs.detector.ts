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
export class NodeJsDetector extends BaseTechnologyDetector {
  readonly id = 'tech-nodejs';
  readonly name = 'Node.js';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Node.js is a server-side JavaScript runtime built on the V8 engine, used to execute JavaScript outside the browser';
  readonly role =
    'Server-side Application Runtime / JavaScript Execution Environment';
  readonly infrastructureMeaning =
    'The observed infrastructure exposes evidence consistent with Node.js participating in server-side request processing or application execution.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Node.js, Express, Fastify, Sails, or NestJS',
    'Server response header containing Node.js runtime identifier',
    'Set-Cookie header containing connect.sid, sails.sid, or fastify.session',
    'Custom runtime headers such as x-node-version',
  ];
  readonly confidenceRules =
    'HIGH confidence when Node.js server headers, Node-based framework response headers, or Node session cookies are observed.';
  readonly whatThisDoesNotProve =
    'Node.js presence confirms server-side JavaScript runtime execution, but does not prove Express, NestJS, Next.js, React, Docker, Kubernetes, Linux, AWS, GCP, Azure, Vercel, or any specific database (PostgreSQL, MySQL, MongoDB, Redis).';
  readonly defaultImplications = [
    'Application logic executes within a V8 JavaScript server runtime environment.',
    'Application frameworks (Express, NestJS), web servers/gateways (NGINX), databases, and cloud hosting remain unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawPoweredBy = context.getHeader('x-powered-by') ?? '';
    const xPoweredBy = rawPoweredBy.toLowerCase();
    const rawServer = context.getHeader('server') ?? '';
    const server = rawServer.toLowerCase();
    const rawNodeVer = context.getHeader('x-node-version');
    const hasConnectSid = context.hasCookie('connect.sid');
    const hasSailsSid = context.hasCookie('sails.sid');
    const hasFastifySession = context.hasCookie('fastify.session');

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (
      xPoweredBy.includes('nodejs') ||
      xPoweredBy.includes('node.js') ||
      xPoweredBy.includes('express') ||
      xPoweredBy.includes('sails') ||
      xPoweredBy.includes('nestjs') ||
      xPoweredBy.includes('fastify')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Node.js / Express Powered By',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const nodeVerMatch = rawPoweredBy.match(/node(?:\.js)?[\/ ]v?([\d.]+)/i);
      if (nodeVerMatch) {
        version = nodeVerMatch[1];
      }
    }

    // 2. Check Server header
    if (
      server.includes('node.js') ||
      server.includes('nodejs') ||
      server.startsWith('node/') ||
      server.startsWith('node ')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Node.js Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(/node(?:\.js)?[\/ ]v?([\d.]+)/i);
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-Node-Version header
    if (rawNodeVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-node-version',
        indicator: `X-Node-Version: ${rawNodeVer}`,
        observedValue: rawNodeVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-Node-Version Header',
        type: 'HEADER',
        indicator: rawNodeVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawNodeVer.replace(/^v/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    // 4. Check session cookies
    if (hasConnectSid || hasSailsSid || hasFastifySession) {
      const cookieName = hasConnectSid
        ? 'connect.sid'
        : hasSailsSid
          ? 'sails.sid'
          : 'fastify.session';

      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: `Node.js ${cookieName} session cookie`,
        observedValue: cookieName,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Node Session Cookie',
        type: 'COOKIE',
        indicator: cookieName,
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Server-side JavaScript application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted Node.js version ${version}`
        : undefined,
    });
  }
}
