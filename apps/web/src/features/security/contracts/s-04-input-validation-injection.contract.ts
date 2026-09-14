/**
 * S-04 — Input Validation, Injection & Request Integrity Frontend Contract
 *
 * Phase: Production Security Hardening
 * Ticket ID: S-04
 * Priority: P0 — BLOCKING
 * Type: Security / API / Input Validation / Injection / Backend / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒
 * Blocks: S-05 → S-12 and Production Release
 * Status: 🔒 CERTIFIED_INPUT_VALIDATION_INJECTION
 *
 * Certification objective:
 * "Every externally supplied value entering Nebula is treated as untrusted input,
 * validated against an explicit contract, normalized where appropriate, constrained
 * by type and size, and rejected safely before it can influence queries, commands,
 * paths, headers, logs, or security decisions."
 */

export const S04_TICKET_ID = 'S-04' as const;
export const S04_PHASE = 'Production Security Hardening' as const;
export const S04_PRIORITY = 'P0 — BLOCKING' as const;
export const S04_TYPE = 'Security / API / Input Validation / Injection / Backend / Contract' as const;
export const S04_STATUS = 'CERTIFIED_INPUT_VALIDATION_INJECTION' as const;

/**
 * 1. Frozen Security Principles
 */
export const S04_PRINCIPLES = {
  S04_P01_DEFAULT_UNTRUSTED:
    'Nothing from the client is trusted by default. S-03 answers: Are you allowed to access this resource? S-04 answers: Is this input safe and valid enough to even reach the business operation?',
  S04_P02_REQUEST_SECURITY_PIPELINE:
    'Canonical Request Security Pipeline: External Request → Transport Parsing → Size/Shape Limit → Schema Validation → Normalization → Security Validation → Authentication (S-02) → Authorization (S-03) → Business Logic → Repository/DB → Response.',
  S04_P03_FAIL_CLOSED_DISCIPLINE:
    'GX, WX, and ADMIN each inherit the same fail-closed input discipline without weakening their security-plane boundaries. Authentication does not make input trusted.',
  S04_P04_INFORMATION_MINIMIZATION:
    'Validation failures must never expose stack traces, database errors, SQL statements, filesystem paths, internal class names, environment variables, or secrets.',
} as const;

/**
 * 2. P0 Security Invariants
 */
export const S04_INVARIANTS = {
  S04_I01_REJECT_SECURITY_FIELDS:
    'Client payloads cannot introduce security-sensitive fields such as userId, ownerId, tenantId, workspaceId, sessionId, role, permissions, plane, identity, isAdmin unless explicitly defined as server-controlled input.',
  S04_I02_NO_MASS_ASSIGNMENT:
    'A client must never be able to exploit generic object spreading (e.g. repository.update(id, payload)) to modify protected fields. Updates must use explicit allowlists.',
  S04_I03_STRICT_TYPE_VALIDATION:
    'Every externally supplied field has an explicit type contract (UUID, domain, email, enum, boolean, number, array, string). No implicit coercion for security-sensitive values.',
  S04_I04_REQUEST_SIZE_BOUNDARIES:
    'Requests must have explicit limits for body size, JSON nesting (max depth 10), string length, array length, object property count, query parameter length, and URL length. Oversized input fails closed.',
  S04_I05_DOMAIN_INPUT_NORMALIZATION:
    'Domain intent must be normalized and strictly validated before processing. Reject javascript:, data:, file:, http://, https://, ftp://, user:password@, paths, queries, fragments, localhost, and raw IPs.',
  S04_I06_INJECTION_RESISTANCE:
    'Untrusted input must never become executable syntax across SQL/ORM queries, shell commands, OS processes, filesystem paths, HTML/XSS, template expressions, regular expressions (ReDoS), HTTP headers (CRLF), or logs.',
  S04_I07_SAFE_ERROR_RESPONSES:
    'Validation failures must never expose stack traces, database errors, SQL statements, filesystem paths, internal class names, environment variables, secrets, tokens, or implementation details.',
  S04_I08_CANONICAL_ERROR_CONTRACT:
    'Validation failures must produce a stable API error shape (e.g. 400 Bad Request) with a safe machine-readable error code.',
  S04_I09_QUERY_OPERATOR_INJECTION_PREVENTION:
    'Client-controlled query objects must never be allowed to inject ORM operators (OR, AND, NOT, contains, startsWith, raw, sql) unless explicitly defined in an approved contract.',
  S04_I10_REDOS_PROTECTION:
    'User-controlled regular expressions are prohibited unless explicitly required and independently bounded. No uncontrolled regex compilation from guest/user input.',
} as const;

/**
 * 3. 48-Vector Attack Matrix (S04-01 to S04-48)
 */
export type S04AttackId =
  | 'S04-01'
  | 'S04-02'
  | 'S04-03'
  | 'S04-04'
  | 'S04-05'
  | 'S04-06'
  | 'S04-07'
  | 'S04-08'
  | 'S04-09'
  | 'S04-10'
  | 'S04-11'
  | 'S04-12'
  | 'S04-13'
  | 'S04-14'
  | 'S04-15'
  | 'S04-16'
  | 'S04-17'
  | 'S04-18'
  | 'S04-19'
  | 'S04-20'
  | 'S04-21'
  | 'S04-22'
  | 'S04-23'
  | 'S04-24'
  | 'S04-25'
  | 'S04-26'
  | 'S04-27'
  | 'S04-28'
  | 'S04-29'
  | 'S04-30'
  | 'S04-31'
  | 'S04-32'
  | 'S04-33'
  | 'S04-34'
  | 'S04-35'
  | 'S04-36'
  | 'S04-37'
  | 'S04-38'
  | 'S04-39'
  | 'S04-40'
  | 'S04-41'
  | 'S04-42'
  | 'S04-43'
  | 'S04-44'
  | 'S04-45'
  | 'S04-46'
  | 'S04-47'
  | 'S04-48';

export interface S04AttackScenario {
  readonly id: S04AttackId;
  readonly category: 'INJECTION' | 'REQUEST_INTEGRITY' | 'OWNERSHIP_MANIPULATION' | 'ADVANCED_INJECTION';
  readonly attack: string;
  readonly expectedStatus: 200 | 400 | 413 | 415 | 422;
  readonly expectedDecision: string;
}

export const S04_SECURITY_MATRIX: readonly S04AttackScenario[] = [
  // Injection Security (S04-01 to S04-20)
  { id: 'S04-01', category: 'INJECTION', attack: 'SQL/ORM injection payload', expectedStatus: 400, expectedDecision: 'SQL_INJECTION_REJECTED' },
  { id: 'S04-02', category: 'INJECTION', attack: 'Raw SQL injection statement', expectedStatus: 400, expectedDecision: 'RAW_SQL_REJECTED' },
  { id: 'S04-03', category: 'INJECTION', attack: 'ORM operator injection object', expectedStatus: 400, expectedDecision: 'ORM_OPERATOR_INJECTION_REJECTED' },
  { id: 'S04-04', category: 'INJECTION', attack: 'Shell command injection characters', expectedStatus: 400, expectedDecision: 'SHELL_INJECTION_REJECTED' },
  { id: 'S04-05', category: 'INJECTION', attack: 'Command argument injection payload', expectedStatus: 400, expectedDecision: 'COMMAND_ARGUMENT_INJECTION_REJECTED' },
  { id: 'S04-06', category: 'INJECTION', attack: 'Path traversal sequence ../', expectedStatus: 400, expectedDecision: 'PATH_TRAVERSAL_REJECTED' },
  { id: 'S04-07', category: 'INJECTION', attack: 'Absolute filesystem path payload', expectedStatus: 400, expectedDecision: 'ABSOLUTE_PATH_REJECTED' },
  { id: 'S04-08', category: 'INJECTION', attack: 'HTML script tag injection', expectedStatus: 200, expectedDecision: 'HTML_INJECTION_NEUTRALIZED' },
  { id: 'S04-09', category: 'INJECTION', attack: 'Stored XSS event handler payload', expectedStatus: 200, expectedDecision: 'STORED_XSS_NEUTRALIZED' },
  { id: 'S04-10', category: 'INJECTION', attack: 'Reflected XSS script in query parameter', expectedStatus: 200, expectedDecision: 'REFLECTED_XSS_NEUTRALIZED' },
  { id: 'S04-11', category: 'INJECTION', attack: 'Header injection newline characters', expectedStatus: 400, expectedDecision: 'HEADER_INJECTION_REJECTED' },
  { id: 'S04-12', category: 'INJECTION', attack: 'CRLF injection in header value', expectedStatus: 400, expectedDecision: 'CRLF_INJECTION_REJECTED' },
  { id: 'S04-13', category: 'INJECTION', attack: 'Server-side template expression payload', expectedStatus: 400, expectedDecision: 'TEMPLATE_INJECTION_REJECTED' },
  { id: 'S04-14', category: 'INJECTION', attack: 'ReDoS catastrophic backtracking regex', expectedStatus: 400, expectedDecision: 'REDOS_REJECTED' },
  { id: 'S04-15', category: 'INJECTION', attack: 'JSON __proto__ prototype pollution payload', expectedStatus: 400, expectedDecision: 'PROTOTYPE_POLLUTION_REJECTED' },
  { id: 'S04-16', category: 'INJECTION', attack: 'Excessive JSON nesting depth (>10)', expectedStatus: 400, expectedDecision: 'EXCESSIVE_NESTING_REJECTED' },
  { id: 'S04-17', category: 'INJECTION', attack: 'Oversized string exceeding field limit', expectedStatus: 400, expectedDecision: 'STRING_TOO_LONG_REJECTED' },
  { id: 'S04-18', category: 'INJECTION', attack: 'Oversized array exceeding batch limit', expectedStatus: 400, expectedDecision: 'ARRAY_TOO_LARGE_REJECTED' },
  { id: 'S04-19', category: 'INJECTION', attack: 'Unknown extraneous object properties', expectedStatus: 400, expectedDecision: 'UNKNOWN_PROPERTIES_REJECTED' },
  { id: 'S04-20', category: 'INJECTION', attack: 'Mass assignment over protected attributes', expectedStatus: 400, expectedDecision: 'MASS_ASSIGNMENT_REJECTED' },

  // Request Integrity (S04-21 to S04-30)
  { id: 'S04-21', category: 'REQUEST_INTEGRITY', attack: 'Empty request body when payload required', expectedStatus: 400, expectedDecision: 'EMPTY_BODY_REJECTED' },
  { id: 'S04-22', category: 'REQUEST_INTEGRITY', attack: 'Malformed non-JSON payload string', expectedStatus: 400, expectedDecision: 'MALFORMED_JSON_REJECTED' },
  { id: 'S04-23', category: 'REQUEST_INTEGRITY', attack: 'Wrong content-type (e.g. text/plain)', expectedStatus: 415, expectedDecision: 'UNSUPPORTED_MEDIA_TYPE' },
  { id: 'S04-24', category: 'REQUEST_INTEGRITY', attack: 'Oversized HTTP body (>1MB)', expectedStatus: 413, expectedDecision: 'PAYLOAD_TOO_LARGE' },
  { id: 'S04-25', category: 'REQUEST_INTEGRITY', attack: 'Forbidden non-whitelisted property fields', expectedStatus: 400, expectedDecision: 'UNSUPPORTED_FIELD' },
  { id: 'S04-26', category: 'REQUEST_INTEGRITY', attack: 'Wrong primitive type (e.g. string for boolean)', expectedStatus: 400, expectedDecision: 'TYPE_MISMATCH' },
  { id: 'S04-27', category: 'REQUEST_INTEGRITY', attack: 'Excessive JSON recursive nesting', expectedStatus: 400, expectedDecision: 'EXCESSIVE_NESTING' },
  { id: 'S04-28', category: 'REQUEST_INTEGRITY', attack: 'Excessive array item count', expectedStatus: 400, expectedDecision: 'ARRAY_TOO_LARGE' },
  { id: 'S04-29', category: 'REQUEST_INTEGRITY', attack: 'Excessive string length exceeding schema', expectedStatus: 400, expectedDecision: 'STRING_TOO_LONG' },
  { id: 'S04-30', category: 'REQUEST_INTEGRITY', attack: 'Null security-critical field', expectedStatus: 400, expectedDecision: 'INVALID_SECURITY_FIELD' },

  // Ownership Manipulation (S04-31 to S04-38)
  { id: 'S04-31', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects foreign userId in payload', expectedStatus: 400, expectedDecision: 'INJECT_USER_ID_REJECTED' },
  { id: 'S04-32', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects foreign ownerId in payload', expectedStatus: 400, expectedDecision: 'INJECT_OWNER_ID_REJECTED' },
  { id: 'S04-33', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects foreign tenantId in payload', expectedStatus: 400, expectedDecision: 'INJECT_TENANT_ID_REJECTED' },
  { id: 'S04-34', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects foreign workspaceId in payload', expectedStatus: 400, expectedDecision: 'INJECT_WORKSPACE_ID_REJECTED' },
  { id: 'S04-35', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects elevated role in payload', expectedStatus: 400, expectedDecision: 'INJECT_ROLE_REJECTED' },
  { id: 'S04-36', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects unauthorized permissions', expectedStatus: 400, expectedDecision: 'INJECT_PERMISSIONS_REJECTED' },
  { id: 'S04-37', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects AX plane in GX/WX payload', expectedStatus: 400, expectedDecision: 'INJECT_PLANE_REJECTED' },
  { id: 'S04-38', category: 'OWNERSHIP_MANIPULATION', attack: 'Client injects sessionId in body', expectedStatus: 400, expectedDecision: 'INJECT_SESSION_ID_REJECTED' },

  // Advanced Injection (S04-39 to S04-48)
  { id: 'S04-39', category: 'ADVANCED_INJECTION', attack: 'Complex SQL union-select payload', expectedStatus: 400, expectedDecision: 'SQL_PAYLOAD_BLOCKED' },
  { id: 'S04-40', category: 'ADVANCED_INJECTION', attack: 'Prisma raw operator filter structure', expectedStatus: 400, expectedDecision: 'ORM_OPERATOR_BLOCKED' },
  { id: 'S04-41', category: 'ADVANCED_INJECTION', attack: 'Subshell command $(cat /etc/passwd)', expectedStatus: 400, expectedDecision: 'SHELL_PAYLOAD_BLOCKED' },
  { id: 'S04-42', category: 'ADVANCED_INJECTION', attack: 'URL-encoded path traversal %2e%2e%2f', expectedStatus: 400, expectedDecision: 'PATH_TRAVERSAL_BLOCKED' },
  { id: 'S04-43', category: 'ADVANCED_INJECTION', attack: 'Inline JavaScript payload in domain/name', expectedStatus: 400, expectedDecision: 'XSS_PAYLOAD_NEUTRALIZED' },
  { id: 'S04-44', category: 'ADVANCED_INJECTION', attack: 'CRLF sequence in user-agent/origin header', expectedStatus: 400, expectedDecision: 'CRLF_HEADER_BLOCKED' },
  { id: 'S04-45', category: 'ADVANCED_INJECTION', attack: 'Template expression in search query', expectedStatus: 400, expectedDecision: 'TEMPLATE_PAYLOAD_BLOCKED' },
  { id: 'S04-46', category: 'ADVANCED_INJECTION', attack: 'Exponential regex backtracking payload', expectedStatus: 400, expectedDecision: 'REDOS_PAYLOAD_BLOCKED' },
  { id: 'S04-47', category: 'ADVANCED_INJECTION', attack: 'Object constructor prototype manipulation', expectedStatus: 400, expectedDecision: 'PROTOTYPE_POLLUTION_BLOCKED' },
  { id: 'S04-48', category: 'ADVANCED_INJECTION', attack: 'Log forging through newline injection', expectedStatus: 200, expectedDecision: 'LOG_INJECTION_NEUTRALIZED' },
] as const;

/**
 * 4. Request Limits Constants
 */
export const S04_LIMITS = {
  MAX_BODY_SIZE_BYTES: 1024 * 1024, // 1MB
  MAX_JSON_DEPTH: 10,
  MAX_OBJECT_KEYS: 50,
  MAX_ARRAY_LENGTH: 100,
  MAX_STRING_LENGTH: 4096,
  MAX_DOMAIN_LENGTH: 253,
  MAX_EMAIL_LENGTH: 254,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

/**
 * 5. Input Validation & Request Security Policy Evaluators
 */

export interface RequestValidationContext {
  readonly method?: string;
  readonly contentType?: string;
  readonly contentLength?: number;
  readonly body?: unknown;
  readonly query?: Record<string, any>;
  readonly params?: Record<string, any>;
  readonly headers?: Record<string, string>;
}

export interface SecurityEvaluationResult {
  readonly valid: boolean;
  readonly httpStatus: 200 | 400 | 413 | 415 | 422;
  readonly decision: string;
  readonly reason: string;
  readonly sanitizedOutput?: any;
}

/**
 * Validates transport headers, content-type, and payload size bounds.
 */
export function evaluateRequestIntegrity(ctx: RequestValidationContext): SecurityEvaluationResult {
  // 1. Content-Type Check for Body Requests
  if (ctx.method && ['POST', 'PUT', 'PATCH'].includes(ctx.method.toUpperCase())) {
    if (ctx.contentType && !ctx.contentType.includes('application/json') && !ctx.contentType.includes('multipart/form-data')) {
      return {
        valid: false,
        httpStatus: 415,
        decision: 'UNSUPPORTED_MEDIA_TYPE',
        reason: `Content type '${ctx.contentType}' is not supported. Expected 'application/json'.`,
      };
    }
  }

  // 2. Content-Length Bounds
  if (ctx.contentLength !== undefined && ctx.contentLength > S04_LIMITS.MAX_BODY_SIZE_BYTES) {
    return {
      valid: false,
      httpStatus: 413,
      decision: 'PAYLOAD_TOO_LARGE',
      reason: `Payload size ${ctx.contentLength} bytes exceeds limit of ${S04_LIMITS.MAX_BODY_SIZE_BYTES} bytes.`,
    };
  }

  // 3. Header CRLF Injection Check
  if (ctx.headers) {
    for (const [key, val] of Object.entries(ctx.headers)) {
      if (typeof val === 'string' && (/[\r\n]/.test(val) || /%0d|%0a/i.test(val))) {
        return {
          valid: false,
          httpStatus: 400,
          decision: 'CRLF_HEADER_BLOCKED',
          reason: `Header '${key}' contains forbidden CRLF control characters.`,
        };
      }
    }
  }

  return {
    valid: true,
    httpStatus: 200,
    decision: 'INTEGRITY_VERIFIED',
    reason: 'Request transport and boundary headers verified.',
  };
}

const SECURITY_FIELD_DECISION_MAP: Record<string, string> = {
  userId: 'INJECT_USER_ID_REJECTED',
  ownerId: 'INJECT_OWNER_ID_REJECTED',
  tenantId: 'INJECT_TENANT_ID_REJECTED',
  workspaceId: 'INJECT_WORKSPACE_ID_REJECTED',
  role: 'INJECT_ROLE_REJECTED',
  permissions: 'INJECT_PERMISSIONS_REJECTED',
  plane: 'INJECT_PLANE_REJECTED',
  sessionId: 'INJECT_SESSION_ID_REJECTED',
  identity: 'INJECT_IDENTITY_REJECTED',
  isAdmin: 'INJECT_ROLE_REJECTED',
};

/**
 * Validates payload for forbidden security fields, prototype pollution, nesting, and mass assignment.
 */
export function evaluatePayloadSecurity(
  payload: unknown,
  options: {
    readonly required?: boolean;
    readonly allowedKeys?: readonly string[];
    readonly maxDepth?: number;
    readonly maxArrayLength?: number;
    readonly maxStringLength?: number;
  } = {}
): SecurityEvaluationResult {
  // 1. Required Body Check
  if (options.required && (payload === undefined || payload === null || (typeof payload === 'object' && Object.keys(payload as any).length === 0))) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'EMPTY_BODY_REJECTED',
      reason: 'Request payload is required but was empty or missing.',
    };
  }

  if (payload === undefined || payload === null) {
    return {
      valid: true,
      httpStatus: 200,
      decision: 'PAYLOAD_ACCEPTED',
      reason: 'Empty payload permitted.',
    };
  }

  // 2. Prototype Pollution Check
  if (hasPrototypePollution(payload)) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'PROTOTYPE_POLLUTION_REJECTED',
      reason: 'Payload contains forbidden prototype pollution properties (__proto__, constructor, prototype).',
    };
  }

  // 3. Nesting Depth Check
  const maxDepth = options.maxDepth ?? S04_LIMITS.MAX_JSON_DEPTH;
  const depth = calculateDepth(payload);
  if (depth > maxDepth) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'EXCESSIVE_NESTING_REJECTED',
      reason: `JSON nesting depth ${depth} exceeds maximum allowable depth ${maxDepth}.`,
    };
  }

  // 4. Forbidden Security Fields Check (S04-I01)
  const FORBIDDEN_SECURITY_FIELDS = [
    'userId',
    'ownerId',
    'tenantId',
    'workspaceId',
    'sessionId',
    'role',
    'permissions',
    'plane',
    'identity',
    'isAdmin',
  ];

  const foundField = findForbiddenField(payload, FORBIDDEN_SECURITY_FIELDS);
  if (foundField) {
    const decisionCode = SECURITY_FIELD_DECISION_MAP[foundField] || 'FORBIDDEN_SECURITY_FIELD_REJECTED';
    return {
      valid: false,
      httpStatus: 400,
      decision: decisionCode,
      reason: `Client payload contains unauthorized security-sensitive field: '${foundField}'.`,
    };
  }

  // 5. Mass Assignment / Allowlist Check (S04-I02)
  if (options.allowedKeys && typeof payload === 'object' && !Array.isArray(payload)) {
    const keys = Object.keys(payload as Record<string, any>);
    const unknownKeys = keys.filter((k) => !options.allowedKeys!.includes(k));
    if (unknownKeys.length > 0) {
      return {
        valid: false,
        httpStatus: 400,
        decision: 'UNKNOWN_PROPERTIES_REJECTED',
        reason: `Payload contains non-whitelisted properties: [${unknownKeys.join(', ')}].`,
      };
    }
  }

  // 6. Injection Scanning on String Values
  const injection = scanForInjections(payload);
  if (injection.detected) {
    return {
      valid: false,
      httpStatus: 400,
      decision: injection.decision,
      reason: `Malicious injection payload detected in field '${injection.field}': ${injection.type}`,
    };
  }

  return {
    valid: true,
    httpStatus: 200,
    decision: 'PAYLOAD_ACCEPTED',
    reason: 'Payload passed schema, boundary, and injection security checks.',
  };
}

/**
 * Validates domain input according to canonical normalization pipeline (S04-I05).
 */
export function evaluateDomainInput(rawDomain: string): SecurityEvaluationResult {
  if (!rawDomain || typeof rawDomain !== 'string' || !rawDomain.trim()) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'INVALID_DOMAIN_EMPTY',
      reason: 'Domain name cannot be empty or whitespace.',
    };
  }

  const trimmed = rawDomain.trim();
  const lower = trimmed.toLowerCase();

  // Explicit Forbidden Schemes
  if (lower.startsWith('javascript:')) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'XSS_PAYLOAD_NEUTRALIZED',
      reason: "JavaScript pseudo-protocol 'javascript:' is strictly forbidden.",
    };
  }

  if (/^(data|file|vbscript|about|blob):/i.test(lower)) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'FORBIDDEN_SCHEME',
      reason: 'Forbidden URI scheme in domain target.',
    };
  }

  // Protocol Strip
  let cleaned = lower.replace(/^(https?|ftp):\/\//i, '');

  // UserInfo Check
  if (cleaned.includes('@')) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'FORBIDDEN_USERINFO',
      reason: 'UserInfo (username:password@) is forbidden in domain targets.',
    };
  }

  // Path, Query, and Fragment Check
  if (cleaned.includes('/') || cleaned.includes('?') || cleaned.includes('#')) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'FORBIDDEN_URL_STRUCTURE',
      reason: 'Domain target must not contain URL paths, query parameters, or fragments.',
    };
  }

  // Port Stripping & Validation
  if (cleaned.includes(':') && !cleaned.includes(']')) {
    const parts = cleaned.split(':');
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      cleaned = parts[0];
    } else {
      return {
        valid: false,
        httpStatus: 400,
        decision: 'INVALID_PORT',
        reason: 'Invalid port specification.',
      };
    }
  }

  // Trailing Dot Strip
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  // Direct IP Check
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleaned) || cleaned.startsWith('[') || cleaned.endsWith(']')) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'DIRECT_IP_FORBIDDEN',
      reason: 'Direct IP addresses are forbidden as domain targets.',
    };
  }

  // Reserved Hostnames
  const RESERVED_HOSTNAMES = ['localhost', 'metadata.google.internal', 'instance-data', '127.0.0.1'];
  if (RESERVED_HOSTNAMES.includes(cleaned)) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'RESERVED_HOSTNAME',
      reason: 'Reserved or internal hostname is forbidden.',
    };
  }

  // Reserved Suffixes
  const RESERVED_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home', '.corp', '.test', '.example', '.invalid'];
  for (const suffix of RESERVED_SUFFIXES) {
    if (cleaned.endsWith(suffix)) {
      return {
        valid: false,
        httpStatus: 400,
        decision: 'RESERVED_TLD',
        reason: `Reserved TLD suffix '${suffix}' is forbidden.`,
      };
    }
  }

  // Length Check
  if (cleaned.length > S04_LIMITS.MAX_DOMAIN_LENGTH) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'STRING_TOO_LONG_REJECTED',
      reason: `Domain length exceeds maximum limit of ${S04_LIMITS.MAX_DOMAIN_LENGTH} characters.`,
    };
  }

  // Hostname Grammar Syntax Check
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!domainRegex.test(cleaned)) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'INVALID_DOMAIN_SYNTAX',
      reason: 'Domain name syntax invalid per RFC hostname standards.',
    };
  }

  // Alpha TLD Check
  const parts = cleaned.split('.');
  const tld = parts[parts.length - 1];
  if (!/^[a-z]{2,}$/i.test(tld)) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'INVALID_TLD',
      reason: 'Domain must end in an alpha TLD of 2+ characters.',
    };
  }

  return {
    valid: true,
    httpStatus: 200,
    decision: 'DOMAIN_NORMALIZED_AND_VALIDATED',
    reason: 'Domain is safe and normalized.',
    sanitizedOutput: cleaned,
  };
}

/**
 * Validates query objects to reject unauthorized ORM operators (S04-I09).
 */
export function evaluateQueryOperators(queryObj: unknown): SecurityEvaluationResult {
  if (!queryObj || typeof queryObj !== 'object') {
    return {
      valid: true,
      httpStatus: 200,
      decision: 'QUERY_ACCEPTED',
      reason: 'Query is empty or primitive.',
    };
  }

  const FORBIDDEN_OPERATORS = [
    'OR',
    'AND',
    'NOT',
    'contains',
    'startsWith',
    'endsWith',
    'equals',
    'in',
    'notIn',
    'lt',
    'lte',
    'gt',
    'gte',
    'raw',
    'sql',
    'where',
  ];

  const foundOp = findForbiddenField(queryObj, FORBIDDEN_OPERATORS);
  if (foundOp) {
    return {
      valid: false,
      httpStatus: 400,
      decision: 'ORM_OPERATOR_INJECTION_REJECTED',
      reason: `Forbidden query operator '${foundOp}' detected. Arbitrary ORM manipulation is prohibited.`,
    };
  }

  return {
    valid: true,
    httpStatus: 200,
    decision: 'QUERY_ACCEPTED',
    reason: 'Query object passed operator safety checks.',
  };
}

/**
 * Neutralizes HTML and log injection characters.
 */
export function neutralizeXssAndLogInjection(str: string): {
  htmlEscaped: string;
  logSanitized: string;
} {
  if (typeof str !== 'string') return { htmlEscaped: '', logSanitized: '' };

  const htmlEscaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  const logSanitized = str
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  return { htmlEscaped, logSanitized };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function calculateDepth(obj: unknown, current = 1): number {
  if (obj === null || typeof obj !== 'object' || current > 20) {
    return current;
  }
  let maxDepth = current;
  const values = Array.isArray(obj) ? obj : Object.values(obj);
  for (const v of values) {
    if (v !== null && typeof v === 'object') {
      const d = calculateDepth(v, current + 1);
      if (d > maxDepth) maxDepth = d;
    }
  }
  return maxDepth;
}

function hasPrototypePollution(payload: unknown): boolean {
  if (payload === null || typeof payload !== 'object') return false;
  if (Array.isArray(payload)) return payload.some(hasPrototypePollution);
  
  const obj = payload as Record<string, any>;
  
  // Check prototype
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null && proto !== Array.prototype) {
    return true;
  }

  for (const key of Object.getOwnPropertyNames(obj)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) return true;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasPrototypePollution(obj[key])) return true;
    }
  }
  return false;
}

function findForbiddenField(payload: unknown, forbidden: readonly string[]): string | null {
  if (payload === null || typeof payload !== 'object') return null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const res = findForbiddenField(item, forbidden);
      if (res) return res;
    }
    return null;
  }
  const obj = payload as Record<string, any>;
  for (const field of forbidden) {
    if (Object.prototype.hasOwnProperty.call(obj, field) && obj[field] !== undefined) {
      return field;
    }
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const res = findForbiddenField(obj[key], forbidden);
      if (res) return res;
    }
  }
  return null;
}

function scanForInjections(payload: unknown): {
  detected: boolean;
  type?: string;
  field?: string;
  decision?: string;
} {
  if (payload === null || typeof payload !== 'object') return { detected: false };

  const entries = Array.isArray(payload)
    ? payload.map((val, idx) => [String(idx), val])
    : Object.entries(payload as Record<string, any>);

  for (const [key, val] of entries) {
    if (typeof val === 'string') {
      // Path Traversal
      if (/(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i.test(val)) {
        return { detected: true, type: 'Path Traversal', field: key, decision: 'PATH_TRAVERSAL_REJECTED' };
      }
      // Absolute path in sensitive parameters
      if (key.toLowerCase().includes('path') && /^(\/|[a-zA-Z]:\\|\/\/)/.test(val)) {
        return { detected: true, type: 'Absolute Path', field: key, decision: 'ABSOLUTE_PATH_REJECTED' };
      }
      // Template Injection
      if (/(\{\{|\}\}|\$\{.*\}|<%.*%>|#\{.*\})/i.test(val)) {
        return { detected: true, type: 'Template Injection', field: key, decision: 'TEMPLATE_INJECTION_REJECTED' };
      }
      // Shell Injection
      if (/(;|\||&&|\|\||`|\$\(|\$\{)/.test(val) && !key.toLowerCase().includes('email') && !key.toLowerCase().includes('url')) {
        return { detected: true, type: 'Shell Injection', field: key, decision: 'SHELL_INJECTION_REJECTED' };
      }
      // SQL Injection
      if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|DECLARE)\b.*(FROM|WHERE|TABLE|DATABASE)|--|\/\*|\*\/|;\s*DROP\b|\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i.test(val)) {
        return { detected: true, type: 'SQL Injection', field: key, decision: 'SQL_INJECTION_REJECTED' };
      }
    } else if (typeof val === 'object' && val !== null) {
      const nested = scanForInjections(val);
      if (nested.detected) return nested;
    }
  }

  return { detected: false };
}

/**
 * 6. Certification Gate Statement & Verifier
 */
export const S04_CERTIFICATION_STATEMENT =
  'Every externally controlled value entering Nebula is explicitly validated, bounded, normalized, and safely handled before it can influence application behavior. Authentication and tenant ownership do not substitute for input security. GX, WX, and ADMIN each inherit the same fail-closed input discipline without weakening their security-plane boundaries.' as const;

export function verifyS04Certification(candidateStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  similarityRatio: number;
} {
  const cleanCandidate = candidateStatement.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanCanonical = S04_CERTIFICATION_STATEMENT.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  const candidateTokens = new Set(cleanCandidate.split(/\s+/).filter(Boolean));
  const canonicalTokens = new Set(cleanCanonical.split(/\s+/).filter(Boolean));

  let overlap = 0;
  for (const token of canonicalTokens) {
    if (candidateTokens.has(token)) {
      overlap++;
    }
  }

  const similarity = overlap / canonicalTokens.size;

  return {
    passed: similarity >= 0.95,
    canonicalStatement: S04_CERTIFICATION_STATEMENT,
    similarityRatio: similarity,
  };
}
