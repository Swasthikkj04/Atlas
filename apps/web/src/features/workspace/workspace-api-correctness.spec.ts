import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_API_INVENTORY,
  verifyRouteContract,
  API_CORRECTNESS_HARD_INVARIANTS,
} from './contracts/api-correctness.contract.ts';

describe('WX-803: API Correctness & Route Parity Architecture Specification', () => {
  describe('1. Canonical API Route Inventory Verification', () => {
    it('verifies all 15 production endpoints have authoritative backend contracts', () => {
      assert.equal(CANONICAL_API_INVENTORY.length, 15);

      const requiredPaths = [
        '/api/v1/domains',
        '/api/v1/domains',
        '/api/v1/domains/:id',
        '/api/v1/domains/:domainId/understand',
        '/api/v1/jobs/:jobId',
        '/api/v1/workspace/overview',
        '/api/v1/domains/:domainId/brief',
        '/api/v1/domains/:domainId/overview',
        '/api/v1/domains/:domainId/snapshots',
        '/api/v1/snapshots/:snapshotId',
        '/api/v1/findings',
        '/api/v1/findings/:findingId',
        '/api/v1/findings/:findingId/evidence',
        '/api/v1/timeline',
        '/api/v1/search',
      ];

      for (const expectedPath of requiredPaths) {
        const match = CANONICAL_API_INVENTORY.find((c) => c.path === expectedPath);
        assert.ok(match, `Missing canonical endpoint for path: ${expectedPath}`);
      }
    });
  });

  describe('2. Route Parity Gate & Phantom Endpoint Detection', () => {
    it('successfully resolves verified production routes', () => {
      const wsOverview = verifyRouteContract('GET', '/api/v1/workspace/overview');
      assert.equal(wsOverview.isValid, true);
      assert.equal(wsOverview.contract?.expectedStatus, 200);
      assert.equal(wsOverview.contract?.requiresAuth, true);

      const understandJob = verifyRouteContract('POST', '/api/v1/domains/:domainId/understand');
      assert.equal(understandJob.isValid, true);
      assert.equal(understandJob.contract?.expectedStatus, 202);
    });

    it('identifies and rejects phantom endpoints and method mismatches (P0)', () => {
      // 1. Non-existent route
      const phantomRoute = verifyRouteContract('GET', '/api/v1/nonexistent/route');
      assert.equal(phantomRoute.isValid, false);
      assert.equal(phantomRoute.contract, undefined);

      // 2. HTTP Method mismatch
      const wrongMethod = verifyRouteContract('DELETE', '/api/v1/workspace/overview');
      assert.equal(wrongMethod.isValid, false);

      // 3. Unprefixed route without /api/v1
      const unprefixedRoute = verifyRouteContract('GET', '/workspace/overview');
      assert.equal(unprefixedRoute.isValid, false);
    });
  });

  describe('3. P0 API Correctness Invariants Certification', () => {
    it('certifies all 10 canonical API correctness hard invariants', () => {
      assert.equal(API_CORRECTNESS_HARD_INVARIANTS.length, 10);
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_PHANTOM_ENDPOINTS'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_ROUTE_METHOD_MISMATCH'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_REQUEST_CONTRACT_DRIFT'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_RESPONSE_CONTRACT_DRIFT'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_HTTP_STATUS_SEMANTIC_DRIFT'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_AUTH_BOUNDARY_BYPASS'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_TENANT_AUTHORIZATION_BYPASS'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_UNSTRUCTURED_PRODUCTION_ERRORS'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_MOCK_ONLY_VERIFICATION'));
      assert.ok(API_CORRECTNESS_HARD_INVARIANTS.includes('NO_FRONTEND_BACKEND_ROUTE_DIVERGENCE'));
    });
  });
});
