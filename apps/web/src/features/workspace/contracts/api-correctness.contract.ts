/**
 * Authoritative API Correctness & Route Parity Contract (WX-803).
 *
 * Establishes the real inventory of backend production routes, HTTP methods,
 * DTO schemas, and status codes to ensure zero frontend-backend divergence.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpointContract {
  readonly id: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly requiresAuth: boolean;
  readonly expectedStatus: number;
  readonly description: string;
  readonly requestSchema?: string;
  readonly responseSchema: string;
}

/**
 * Authoritative Inventory of NestJS Production Endpoints (WX-803).
 */
export const CANONICAL_API_INVENTORY: readonly ApiEndpointContract[] = [
  // 1. Domains & Discovery
  {
    id: 'DOM-01',
    method: 'POST',
    path: '/api/v1/domains',
    requiresAuth: true,
    expectedStatus: 201,
    description: 'Register domain for monitoring',
    requestSchema: 'CreateDomainDto',
    responseSchema: 'DomainResponseDto',
  },
  {
    id: 'DOM-02',
    method: 'GET',
    path: '/api/v1/domains',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'List user monitored domains',
    responseSchema: 'DomainResponseDto[]',
  },
  {
    id: 'DOM-03',
    method: 'DELETE',
    path: '/api/v1/domains/:id',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Remove domain from workspace',
    responseSchema: 'DeleteDomainResult',
  },
  {
    id: 'UND-01',
    method: 'POST',
    path: '/api/v1/domains/:domainId/understand',
    requiresAuth: true,
    expectedStatus: 202,
    description: 'Trigger asynchronous infrastructure understanding job',
    responseSchema: 'UnderstandingJobDto',
  },
  {
    id: 'UND-02',
    method: 'GET',
    path: '/api/v1/jobs/:jobId',
    requiresAuth: false, // Supports optional JWT for public guest/authenticated jobs
    expectedStatus: 200,
    description: 'Poll infrastructure understanding job lifecycle status',
    responseSchema: 'UnderstandingJobDto',
  },

  // 2. Workspace & Synthesis
  {
    id: 'WS-01',
    method: 'GET',
    path: '/api/v1/workspace/overview',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Synthesized domain intelligence (Executive Brief, Stories, Latest Snapshot)',
    responseSchema: 'WorkspaceOverviewDto',
  },
  {
    id: 'WS-02',
    method: 'GET',
    path: '/api/v1/domains/:domainId/brief',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Latest executive infrastructure brief for domain',
    responseSchema: 'InfrastructureBriefDto',
  },
  {
    id: 'WS-03',
    method: 'GET',
    path: '/api/v1/domains/:domainId/overview',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Infrastructure domain overview (Technology, TLS, DNS)',
    responseSchema: 'DomainOverviewResponseDto',
  },

  // 3. Snapshots & Lineage
  {
    id: 'SNP-01',
    method: 'GET',
    path: '/api/v1/domains/:domainId/snapshots',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Paginated historical snapshot list',
    responseSchema: 'PaginatedSnapshotsDto',
  },
  {
    id: 'SNP-02',
    method: 'GET',
    path: '/api/v1/snapshots/:snapshotId',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Immutable infrastructure snapshot details and raw observations',
    responseSchema: 'InfrastructureSnapshotDto',
  },

  // 4. Findings & Evidence
  {
    id: 'FND-01',
    method: 'GET',
    path: '/api/v1/findings',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Filtered findings experience list',
    responseSchema: 'FindingsListDto',
  },
  {
    id: 'FND-02',
    method: 'GET',
    path: '/api/v1/findings/:findingId',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Finding explainability detail and rule lineage',
    responseSchema: 'FindingDetailDto',
  },
  {
    id: 'FND-03',
    method: 'GET',
    path: '/api/v1/findings/:findingId/evidence',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Supporting observation facts and raw evidence payload',
    responseSchema: 'FindingEvidenceResponseDto',
  },

  // 5. Timeline & Search
  {
    id: 'TML-01',
    method: 'GET',
    path: '/api/v1/timeline',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Cursor-paginated infrastructure timeline events',
    responseSchema: 'TimelineResponseDto',
  },
  {
    id: 'SRC-01',
    method: 'GET',
    path: '/api/v1/search',
    requiresAuth: true,
    expectedStatus: 200,
    description: 'Cross-workspace tenant-scoped global search',
    responseSchema: 'SearchResponseDto',
  },
];

/**
 * Validates that a requested route and method exist in the canonical production backend inventory.
 */
export function verifyRouteContract(
  method: HttpMethod,
  normalizedPath: string
): {
  readonly isValid: boolean;
  readonly contract?: ApiEndpointContract;
} {
  const match = CANONICAL_API_INVENTORY.find(
    (c) => c.method === method && c.path === normalizedPath
  );

  return {
    isValid: Boolean(match),
    contract: match,
  };
}

/**
 * Ten Certified P0 API Correctness Invariants.
 */
export const API_CORRECTNESS_HARD_INVARIANTS = [
  'NO_PHANTOM_ENDPOINTS',
  'NO_ROUTE_METHOD_MISMATCH',
  'NO_REQUEST_CONTRACT_DRIFT',
  'NO_RESPONSE_CONTRACT_DRIFT',
  'NO_HTTP_STATUS_SEMANTIC_DRIFT',
  'NO_AUTH_BOUNDARY_BYPASS',
  'NO_TENANT_AUTHORIZATION_BYPASS',
  'NO_UNSTRUCTURED_PRODUCTION_ERRORS',
  'NO_MOCK_ONLY_VERIFICATION',
  'NO_FRONTEND_BACKEND_ROUTE_DIVERGENCE',
] as const;
