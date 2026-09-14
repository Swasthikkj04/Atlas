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
export class JavaDetector extends BaseTechnologyDetector {
  readonly id = 'tech-java';
  readonly name = 'Java';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Java is a class-based, object-oriented runtime platform and virtual machine (JVM) executing server-side enterprise applications';
  readonly role = 'Server-side Application Runtime / JVM Environment';
  readonly infrastructureMeaning =
    'The observed endpoint appears to execute on a Java Virtual Machine (JVM) server-side runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Java, Servlet, or JSP',
    'Set-Cookie header containing JSESSIONID standard Java session token',
    'Server response header containing Java runtime or Servlet engine identifier',
  ];
  readonly confidenceRules =
    'HIGH confidence when JSESSIONID cookie, X-Powered-By: Java/Servlet/JSP, or Java runtime server headers are observed.';
  readonly whatThisDoesNotProve =
    'Java presence confirms JVM runtime execution, but does not prove Spring, Spring Boot, Apache Tomcat, Jetty, GlassFish, WildFly, WebLogic, WebSphere, Jakarta EE, PostgreSQL, MySQL, Oracle, Docker, Kubernetes, Linux, AWS, GCP, or Azure.';
  readonly defaultImplications = [
    'Application logic executes within a Java Virtual Machine (JVM) server runtime.',
    'Application frameworks (Spring, Jakarta EE), web servers/gateways (Tomcat, NGINX), databases, and cloud hosting remain unobserved unless directly evidenced.',
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
    const hasJsessionId = context.hasCookie('jsessionid');

    let version: string | undefined;

    // 1. Check X-Powered-By for Java / Servlet / JSP / JSF
    if (
      xPoweredBy.includes('java') ||
      xPoweredBy.includes('servlet') ||
      xPoweredBy.includes('jsp') ||
      xPoweredBy.includes('jsf')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Java / Servlet Powered By',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const javaVerMatch =
        rawPoweredBy.match(/java(?:se|ee)?[\/ ]?([\d._]+)/i) ||
        rawPoweredBy.match(/jdk[\/ ]?([\d._]+)/i) ||
        rawPoweredBy.match(/jre[\/ ]?([\d._]+)/i);

      if (javaVerMatch) {
        version = javaVerMatch[1];
      }
    }

    // 2. Check Server Header for Java or Java Servlet containers
    const isJavaServer =
      server.includes('java') ||
      server.includes('coyote') ||
      server.includes('tomcat') ||
      server.includes('weblogic') ||
      server.includes('websphere') ||
      server.includes('jetty') ||
      server.includes('glassfish') ||
      server.includes('jboss') ||
      server.includes('wildfly');

    if (isJavaServer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Java Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(/java[\/ ]?([\d._]+)/i);
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check JSESSIONID standard Java session cookie
    if (hasJsessionId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Java standard session cookie (JSESSIONID)',
        observedValue: 'JSESSIONID',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'JSESSIONID Cookie',
        type: 'COOKIE',
        indicator: 'jsessionid',
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
      role: `Server-side Java/JVM application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Observed HTTP header evidence: ${rawPoweredBy || rawServer}`
        : undefined,
    });
  }
}

// Alias for backwards compatibility
export { JavaDetector as JavaEnterpriseDetector };
