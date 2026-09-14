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
export class PythonDetector extends BaseTechnologyDetector {
  readonly id = 'tech-python';
  readonly name = 'Python';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Python is a general-purpose programming language and server-side runtime ecosystem commonly used to execute web applications and APIs';
  readonly role = 'Server-side Application Runtime / Python Environment';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose or execute a Python-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Python or CPython',
    'Server response header containing Python, CPython, WSGIServer, aiohttp, Tornado, or Werkzeug',
    'Custom runtime headers such as x-python-version',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit Python runtime headers, Server banners containing Python/CPython, or Python server framework identifiers are observed.';
  readonly whatThisDoesNotProve =
    'Python presence confirms server-side runtime execution, but does not prove Django, Flask, FastAPI, Gunicorn, uWSGI, Uvicorn, Linux, Docker, Kubernetes, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, Redis, SQLite).';
  readonly defaultImplications = [
    'Application executes within a Python server-side runtime environment.',
    'Application frameworks (Django, Flask, FastAPI), web servers/gateways (NGINX), databases, and cloud hosting remain unobserved unless directly evidenced.',
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
    const rawPythonVer = context.getHeader('x-python-version');

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (xPoweredBy.includes('python') || xPoweredBy.includes('cpython')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Python Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const pyVerMatch = rawPoweredBy.match(/(?:c)?python[\/ ]v?([\d.]+)/i);
      if (pyVerMatch) {
        version = pyVerMatch[1];
      }
    }

    // 2. Check Server header for Python, CPython, WSGIServer, aiohttp, Tornado, Werkzeug
    if (
      server.includes('python') ||
      server.includes('cpython') ||
      server.includes('wsgiserver') ||
      server.includes('aiohttp') ||
      server.includes('tornadoserver') ||
      server.includes('werkzeug')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Python Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(/(?:c)?python[\/ ]v?([\d.]+)/i);
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-Python-Version header
    if (rawPythonVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-python-version',
        indicator: `X-Python-Version: ${rawPythonVer}`,
        observedValue: rawPythonVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-Python-Version Header',
        type: 'HEADER',
        indicator: rawPythonVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawPythonVer.replace(/^v/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Server-side Python application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted Python version ${version}`
        : undefined,
    });
  }
}
