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
export class DjangoDetector extends BaseTechnologyDetector {
  readonly id = 'tech-django';
  readonly name = 'Django';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Django is a Python web application framework used to build server-side web applications and APIs';
  readonly role = 'Application Framework';
  readonly infrastructureMeaning =
    'The observed endpoint appears to use Django for server-side application request handling and application delivery.';
  readonly detectionSignals = [
    'csrftoken cookie in Set-Cookie / Cookie header',
    'django_session cookie in Set-Cookie / Cookie header',
    'HTML body containing csrfmiddlewaretoken input field',
  ];
  readonly confidenceRules =
    'HIGH confidence when csrftoken/django_session cookies or csrfmiddlewaretoken form fields are observed.';
  readonly whatThisDoesNotProve =
    'Django presence confirms server-side application framework, but does not prove WSGI/ASGI application server (Gunicorn/uWSGI), Python version, container runtime (Docker/Kubernetes), cloud provider, or database backend.';
  readonly defaultImplications = [
    'Inbound application requests are routed to and handled by Django server-side views and middleware.',
    'Session state and CSRF protection utilize Django application contracts.',
    'Backend database and runtime hosting remain unobservable without direct evidence.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasCsrfToken = context.hasCookie('csrftoken');
    const hasDjangoSession = context.hasCookie('django_session');
    const hasCsrfInput = context.hasHtmlPattern('csrfmiddlewaretoken');

    if (hasCsrfToken) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Django CSRF cookie (csrftoken)',
        observedValue: 'csrftoken',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Django CSRF Cookie',
        type: 'COOKIE',
        indicator: 'csrftoken',
        matched: true,
        weight: 9,
      });
    }

    if (hasDjangoSession) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Django session cookie (django_session)',
        observedValue: 'django_session',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Django Session Cookie',
        type: 'COOKIE',
        indicator: 'django_session',
        matched: true,
        weight: 10,
      });
    }

    if (hasCsrfInput) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Django template CSRF token field (csrfmiddlewaretoken)',
        observedValue: 'csrfmiddlewaretoken',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Django CSRF Middleware Token',
        type: 'BODY',
        indicator: 'csrfmiddlewaretoken',
        matched: true,
        weight: 10,
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
      role: `Python application framework for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
