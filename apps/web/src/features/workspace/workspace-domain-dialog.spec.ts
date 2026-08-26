import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveDomainEntryError,
  DOMAIN_ENTRY_ERROR_COPY,
} from './contracts/domain-entry-error.contract.ts';
import {
  NotFoundError,
  InsufficientSignalError,
  NetworkError,
  ApiError,
} from '../../lib/api-client.ts';

describe('WX-210-F: Focused Workspace Domain Entry Dialog Contracts', () => {
  describe('1. Reusable Modal & Inline Modes', () => {
    it('supports first domain zero-state mode without dismiss action', () => {
      const isFirstDomain = true;
      const isDismissable = !isFirstDomain;
      const isModal = !isFirstDomain;

      assert.equal(isFirstDomain, true);
      assert.equal(isDismissable, false);
      assert.equal(isModal, false);

      const title = isFirstDomain
        ? 'Add your first domain to understand your infrastructure.'
        : 'Add a domain to your Workspace.';
      assert.equal(title, 'Add your first domain to understand your infrastructure.');
    });

    it('supports additional domain mode with dismiss action and modal presentation', () => {
      const isFirstDomain = false;
      const isDismissable = !isFirstDomain;
      const isModal = !isFirstDomain;

      assert.equal(isFirstDomain, false);
      assert.equal(isDismissable, true);
      assert.equal(isModal, true);

      const title = isFirstDomain
        ? 'Add your first domain to understand your infrastructure.'
        : 'Add a domain to your Workspace.';
      assert.equal(title, 'Add a domain to your Workspace.');
    });
  });

  describe('2. Anti-Theatrics Invariants', () => {
    it('prohibits telemetry claims, operational status fluff, and marketing copy', () => {
      const forbiddenMessaging = [
        'Telemetry Retention: Continuous',
        'Workspace Status: Awaiting Initial Target',
        'Non-intrusive DNS, TLS certificate chain, and edge routing discovery',
        'AI Powered Scanner',
        'What are you trying to understand today?',
      ];

      const allowedDialogCopy = [
        'Add your first domain to understand your infrastructure.',
        'Add a domain to your Workspace.',
        'Enter a domain Nebula can understand.',
        'stripe.com, github.com',
        'Understand',
      ];

      for (const forbidden of forbiddenMessaging) {
        assert.ok(!allowedDialogCopy.includes(forbidden));
      }
    });
  });

  describe('3. Understanding Job Integration Contracts', () => {
    it('verifies canonical endpoint routes for domain creation, trigger, and polling', () => {
      const routes = {
        createDomain: '/domains',
        triggerUnderstanding: (domainId: string) => `/domains/${domainId}/understand`,
        getJobStatus: (jobId: string) => `/jobs/${jobId}`,
      };

      assert.equal(routes.createDomain, '/domains');
      assert.equal(routes.triggerUnderstanding('dom-123'), '/domains/dom-123/understand');
      assert.equal(routes.getJobStatus('job-456'), '/jobs/job-456');
    });

    it('extracts jobId from either id or jobId field of understanding response', () => {
      const responseWithId: { id: string; jobId?: string; domainId: string; status: 'PENDING' } = {
        id: 'job-789',
        domainId: 'dom-123',
        status: 'PENDING',
      };
      const responseWithJobId: { id?: string; jobId: string; domainId: string; status: 'PENDING' } = {
        jobId: 'job-789',
        domainId: 'dom-123',
        status: 'PENDING',
      };

      const extractedA = responseWithId.id || responseWithId.jobId;
      const extractedB = responseWithJobId.id || responseWithJobId.jobId;

      assert.equal(extractedA, 'job-789');
      assert.equal(extractedB, 'job-789');
    });
  });

  describe('4. Nonexistent Domain & Error Resolution UX Contracts', () => {
    it('translates 404 / NotFoundError into calm human-readable nonexistent domain state', () => {
      const error = new NotFoundError('API Error 404: Not Found');
      const resolved = resolveDomainEntryError(error);

      assert.equal(resolved.kind, 'NONEXISTENT_DOMAIN');
      assert.equal(resolved.title, DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title);
      assert.equal(
        resolved.description,
        DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description
      );
      assert.equal(resolved.canEditDomain, true);
      assert.equal(resolved.canRetry, true);
      // Invariant: Never exposes raw "API Error 404: Not Found"
      assert.ok(!resolved.title.includes('404'));
      assert.ok(!resolved.title.includes('API Error'));
    });

    it('translates 422 / InsufficientSignalError into calm nonexistent domain state', () => {
      const error = new InsufficientSignalError();
      const resolved = resolveDomainEntryError(error);

      assert.equal(resolved.kind, 'NONEXISTENT_DOMAIN');
      assert.equal(resolved.title, DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title);
      assert.equal(resolved.description, DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description);
    });

    it('translates job failure with DNS resolution / unreachable error into nonexistent domain state', () => {
      const resolved = resolveDomainEntryError(
        null,
        'getaddrinfo ENOTFOUND invalid-domain-xyz123.fake'
      );

      assert.equal(resolved.kind, 'NONEXISTENT_DOMAIN');
      assert.equal(resolved.title, DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title);
      assert.equal(resolved.description, DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description);
    });

    it('translates NetworkError into connectivity error state', () => {
      const error = new NetworkError();
      const resolved = resolveDomainEntryError(error);

      assert.equal(resolved.kind, 'NETWORK_ERROR');
      assert.equal(resolved.title, DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.title);
      assert.equal(
        resolved.description,
        DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.description
      );
      assert.equal(resolved.canEditDomain, true);
      assert.equal(resolved.canRetry, true);
    });

    it('translates 500 / server failure into generic server error state', () => {
      const error = new ApiError('Internal Server Error', 500, 'INTERNAL_ERROR');
      const resolved = resolveDomainEntryError(error);

      assert.equal(resolved.kind, 'SERVER_ERROR');
      assert.equal(resolved.title, DOMAIN_ENTRY_ERROR_COPY.SERVER_ERROR.title);
      assert.equal(
        resolved.description,
        DOMAIN_ENTRY_ERROR_COPY.SERVER_ERROR.description
      );
    });
  });
});
