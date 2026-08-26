import type {
  InfrastructureSnapshotDto,
  SnapshotDnsRecordDto,
  SnapshotListResponseDto,
} from '../../../types/api';

/**
 * Authoritative Snapshot History Semantic States (WX-504).
 *
 * Defines the 6-tier canonical memory state matrix for Snapshot History:
 * - 'LOADING': Historical snapshot list or snapshot detail is being retrieved from backend.
 * - 'READY': Snapshot history is available, authoritative, and ready for inspection.
 * - 'EMPTY': Insufficient snapshot data exists (zero snapshots completed for domain).
 * - 'PARTIAL': Historical records exist, but the backend indicates degraded or partial history.
 * - 'UNAVAILABLE': Snapshot cannot be accessed within the active domain boundary (domain isolation).
 * - 'ERROR': Network or API failure during snapshot retrieval.
 */
export type SnapshotHistoryState =
  | 'LOADING'
  | 'READY'
  | 'EMPTY'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'ERROR';

/**
 * Canonical Copy Constants for Snapshot History (WX-504).
 * Hard Invariant: Anti-theatrics, calm, truthful language.
 */
export const SNAPSHOT_HISTORY_COPY = {
  EMPTY_TITLE: 'No infrastructure snapshot is available yet.',
  EMPTY_DESCRIPTION:
    'Nebula has not established an infrastructure baseline for this domain.',
  BASELINE_TITLE: 'Initial baseline established.',
  BASELINE_DESCRIPTION:
    'No previous infrastructure state is available for comparison.',
  CURRENT_STATE_BADGE: 'Current infrastructure state',
  HISTORICAL_STATE_BADGE: 'Historical infrastructure state',
  PARTIAL_NOTICE:
    'Displaying available historical records. Some historical intervals may be limited.',
} as const;

/**
 * Authoritative TLS State Summary extracted from Snapshot DTO.
 */
export interface SnapshotTlsSummary {
  readonly status: 'Valid' | 'Expired' | 'Unverified' | 'Not Supported' | 'Unknown';
  readonly issuer?: string | null;
  readonly protocol?: string | null;
  readonly cipher?: string | null;
  readonly validTo?: string | null;
  readonly validFrom?: string | null;
  readonly subject?: string | null;
  readonly serialNumber?: string | null;
  readonly fingerprintSha256?: string | null;
}

/**
 * Extracted Authoritative Snapshot Infrastructure State (WX-504).
 *
 * Formatted and normalized representation of immutable snapshot facts for presentation.
 * Invariant: Never reconstruct or guess missing fields from Overview or Timeline.
 */
export interface SnapshotInfrastructureState {
  /** Authoritative snapshot ID */
  readonly snapshotId: string;
  /** Domain identifier */
  readonly domainId: string;
  /** Domain hostname */
  readonly domainName?: string;
  /** Whether this snapshot is the authoritative current (latest) state */
  readonly isCurrent: boolean;
  /** Whether this domain has only 1 snapshot (initial baseline) */
  readonly isInitialBaseline: boolean;
  /** Raw ISO timestamp string */
  readonly observedAt: string;
  /** Formatted date string, e.g. "Aug 20, 2026" */
  readonly observedDateFormatted: string;
  /** Formatted UTC time string, e.g. "14:53 UTC" */
  readonly observedTimeUtcFormatted: string;
  /** Observed HTTP status code if present */
  readonly httpStatus: number | null;
  /** Observed response time in milliseconds if present */
  readonly responseTimeMs: number | null;
  /** Formatted response time, e.g. "1.42s" or "240ms" */
  readonly responseTimeFormatted: string | null;
  /** Observed web server name (e.g. "nginx") if present */
  readonly server: string | null;
  /** Observed TLS information if present */
  readonly tls: SnapshotTlsSummary | null;
  /** Detected technologies (e.g. ['NGINX', 'Next.js', 'HSTS']) */
  readonly technologies: readonly string[];
  /** Observed DNS records if present */
  readonly dnsRecords: readonly SnapshotDnsRecordDto[];
  /** Raw payload object preserved for technical inspection */
  readonly rawPayload: unknown;
  /** Associated job ID if available */
  readonly jobId?: string | null;
  /** Explicit previous snapshot ID if recorded */
  readonly previousSnapshotId?: string | null;
}

/**
 * Pure helper to format response time objectively.
 * e.g. 1420ms -> "1.42s", 240ms -> "240ms".
 */
export function formatSnapshotResponseTime(
  ms: number | undefined | null
): string | null {
  if (ms === undefined || ms === null || isNaN(ms)) {
    return null;
  }
  if (ms >= 1000) {
    const sec = ms / 1000;
    const formatted = sec % 1 === 0 ? sec.toFixed(1) : sec.toFixed(2);
    return `${formatted}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Pure helper to format an ISO date string to "Mon DD, YYYY" in UTC.
 * e.g. "2026-08-20T14:53:00.000Z" -> "Aug 20, 2026".
 */
export function formatSnapshotDate(isoString: string | undefined | null): string {
  if (!isoString) return 'Date unavailable';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/**
 * Pure helper to format an ISO date string to "HH:MM UTC".
 * e.g. "2026-08-20T14:53:00.000Z" -> "14:53 UTC".
 */
export function formatSnapshotTimeUtc(isoString: string | undefined | null): string {
  if (!isoString) return 'Time unavailable';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid time';

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
}

/**
 * Pure function to extract DNS records from discovery payload if present.
 */
function extractDnsFromPayload(payload: unknown): readonly SnapshotDnsRecordDto[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;
  if (!p.dns || typeof p.dns !== 'object') return [];
  const dns = p.dns as Record<string, unknown>;
  const records: SnapshotDnsRecordDto[] = [];

  if (Array.isArray(dns.a)) {
    dns.a.forEach((val) => {
      if (typeof val === 'string') records.push({ type: 'A', name: '@', value: val });
    });
  }
  if (Array.isArray(dns.aaaa)) {
    dns.aaaa.forEach((val) => {
      if (typeof val === 'string') records.push({ type: 'AAAA', name: '@', value: val });
    });
  }
  if (Array.isArray(dns.mx)) {
    dns.mx.forEach((item: unknown) => {
      if (item && typeof item === 'object' && 'exchange' in item) {
        records.push({
          type: 'MX',
          name: '@',
          value: `${(item as { priority?: number }).priority ?? 10} ${(item as { exchange: string }).exchange}`,
        });
      }
    });
  }
  if (Array.isArray(dns.ns)) {
    dns.ns.forEach((val) => {
      if (typeof val === 'string') records.push({ type: 'NS', name: '@', value: val });
    });
  }
  if (Array.isArray(dns.cname)) {
    dns.cname.forEach((val) => {
      if (typeof val === 'string') records.push({ type: 'CNAME', name: '@', value: val });
    });
  }
  if (Array.isArray(dns.txt)) {
    dns.txt.forEach((val) => {
      const textVal = Array.isArray(val) ? val.join(' ') : String(val);
      records.push({ type: 'TXT', name: '@', value: textVal });
    });
  }

  return records;
}

/**
 * Pure function to extract technologies list from snapshot DTO or payload.
 */
function extractTechnologiesFromSnapshot(
  snapshot: InfrastructureSnapshotDto
): readonly string[] {
  if (Array.isArray(snapshot.technologies) && snapshot.technologies.length > 0) {
    return snapshot.technologies;
  }
  if (snapshot.payload && typeof snapshot.payload === 'object') {
    const payload = snapshot.payload as Record<string, unknown>;
    if (payload.technology && typeof payload.technology === 'object') {
      const techObj = payload.technology as { technologies?: { name: string }[] };
      if (Array.isArray(techObj.technologies)) {
        return techObj.technologies
          .map((t) => t.name)
          .filter((name): name is string => typeof name === 'string' && name.length > 0);
      }
    }
  }
  return [];
}

/**
 * Pure function to extract web server string from snapshot DTO or payload.
 */
function extractServerFromSnapshot(
  snapshot: InfrastructureSnapshotDto
): string | null {
  if (snapshot.httpObservation?.server) {
    return snapshot.httpObservation.server;
  }
  if (snapshot.payload && typeof snapshot.payload === 'object') {
    const payload = snapshot.payload as Record<string, unknown>;
    if (payload.http && typeof payload.http === 'object') {
      const http = payload.http as { headers?: Record<string, string> };
      if (http.headers) {
        const s = http.headers['server'] || http.headers['Server'];
        if (typeof s === 'string' && s.trim()) return s.trim();
      }
    }
    // Check detected technologies for Web Server category
    if (payload.technology && typeof payload.technology === 'object') {
      const techObj = payload.technology as {
        technologies?: { name: string; category?: string }[];
      };
      if (Array.isArray(techObj.technologies)) {
        const webServerTech = techObj.technologies.find(
          (t) => t.category === 'Web Server' || t.category === 'Web Gateway'
        );
        if (webServerTech?.name) return webServerTech.name;
      }
    }
  }
  return null;
}

/**
 * Pure function to extract TLS state summary from snapshot DTO or payload.
 */
function extractTlsFromSnapshot(
  snapshot: InfrastructureSnapshotDto
): SnapshotTlsSummary | null {
  if (snapshot.tlsCertificate) {
    const cert = snapshot.tlsCertificate;
    let status: 'Valid' | 'Expired' | 'Unverified' = 'Valid';
    if (cert.validTo) {
      const expDate = new Date(cert.validTo);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        status = 'Expired';
      }
    }

    return {
      status,
      issuer: cert.issuer || null,
      validFrom: cert.validFrom || null,
      validTo: cert.validTo || null,
      subject: cert.subject || null,
      serialNumber: cert.serialNumber || null,
      fingerprintSha256: cert.fingerprintSha256 || null,
    };
  }

  if (snapshot.payload && typeof snapshot.payload === 'object') {
    const payload = snapshot.payload as Record<string, unknown>;
    if (payload.ssl && typeof payload.ssl === 'object') {
      const ssl = payload.ssl as {
        supported?: boolean;
        authorized?: boolean;
        protocol?: string;
        cipher?: string;
        certificate?: {
          issuer?: string;
          subject?: string;
          validFrom?: string;
          validTo?: string;
          serialNumber?: string;
          fingerprint256?: string;
        };
      };

      if (ssl.supported === false) {
        return { status: 'Not Supported' };
      }

      const status =
        ssl.authorized === true
          ? 'Valid'
          : ssl.authorized === false
          ? 'Unverified'
          : 'Unknown';

      return {
        status,
        issuer: ssl.certificate?.issuer || null,
        subject: ssl.certificate?.subject || null,
        validFrom: ssl.certificate?.validFrom || null,
        validTo: ssl.certificate?.validTo || null,
        protocol: ssl.protocol || null,
        cipher: ssl.cipher || null,
        serialNumber: ssl.certificate?.serialNumber || null,
        fingerprintSha256: ssl.certificate?.fingerprint256 || null,
      };
    }
  }

  return null;
}

/**
 * Authoritative extractor for Snapshot Infrastructure State (WX-504).
 *
 * Extracts all authoritative facts directly from the immutable Snapshot DTO.
 * Pure, deterministic, and free of synthetic inference.
 */
export function extractSnapshotInfrastructureState(
  snapshot: InfrastructureSnapshotDto,
  isCurrent: boolean = false,
  isInitialBaseline: boolean = false
): SnapshotInfrastructureState {
  const observedAt = snapshot.capturedAt || snapshot.createdAt || '';

  // Extract HTTP status code
  let httpStatus: number | null = null;
  if (typeof snapshot.httpStatus === 'number') {
    httpStatus = snapshot.httpStatus;
  } else if (snapshot.httpObservation && typeof snapshot.httpObservation.statusCode === 'number') {
    httpStatus = snapshot.httpObservation.statusCode;
  } else if (snapshot.payload && typeof snapshot.payload === 'object') {
    const http = (snapshot.payload as Record<string, unknown>).http as { statusCode?: number } | undefined;
    if (typeof http?.statusCode === 'number') {
      httpStatus = http.statusCode;
    }
  }

  // Extract Response Time
  let responseTimeMs: number | null = null;
  if (typeof snapshot.responseTimeMs === 'number') {
    responseTimeMs = snapshot.responseTimeMs;
  } else if (snapshot.payload && typeof snapshot.payload === 'object') {
    const http = (snapshot.payload as Record<string, unknown>).http as { responseTimeMs?: number } | undefined;
    if (typeof http?.responseTimeMs === 'number') {
      responseTimeMs = http.responseTimeMs;
    }
  }

  const responseTimeFormatted = formatSnapshotResponseTime(responseTimeMs);
  const server = extractServerFromSnapshot(snapshot);
  const tls = extractTlsFromSnapshot(snapshot);
  const technologies = extractTechnologiesFromSnapshot(snapshot);
  const dnsRecords =
    snapshot.dnsRecords && snapshot.dnsRecords.length > 0
      ? snapshot.dnsRecords
      : extractDnsFromPayload(snapshot.payload);

  return {
    snapshotId: snapshot.id,
    domainId: snapshot.domainId,
    domainName: snapshot.domainName,
    isCurrent,
    isInitialBaseline,
    observedAt,
    observedDateFormatted: formatSnapshotDate(observedAt),
    observedTimeUtcFormatted: formatSnapshotTimeUtc(observedAt),
    httpStatus,
    responseTimeMs,
    responseTimeFormatted,
    server,
    tls,
    technologies,
    dnsRecords,
    rawPayload: snapshot.payload ?? snapshot,
    jobId: snapshot.jobId,
    previousSnapshotId: snapshot.previousSnapshotId,
  };
}

/**
 * Pure helper to extract the snapshot array from diverse response shapes without mutation or sorting.
 */
export function getSnapshotsArray(
  response?:
    | SnapshotListResponseDto
    | readonly InfrastructureSnapshotDto[]
    | null
): readonly InfrastructureSnapshotDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if ('data' in response && Array.isArray(response.data)) return response.data;
  if ('snapshots' in response && Array.isArray(response.snapshots)) return response.snapshots;
  return [];
}

/**
 * Pure deterministic function to resolve the semantic state of Snapshot History.
 */
export function resolveSnapshotHistoryState(params: {
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly selectedSnapshot?: InfrastructureSnapshotDto | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isDomainMismatch?: boolean;
  readonly isPartial?: boolean;
}): SnapshotHistoryState {
  const {
    snapshots,
    selectedSnapshot,
    isLoading,
    isError,
    isDomainMismatch = false,
    isPartial = false,
  } = params;

  if (isDomainMismatch) {
    return 'UNAVAILABLE';
  }

  if (isLoading) {
    return 'LOADING';
  }

  if (isError) {
    return 'ERROR';
  }

  const validSnapshots = (snapshots || []).filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  // If zero valid snapshots exist and no selected snapshot detail exists, state is EMPTY
  if (validSnapshots.length === 0 && !selectedSnapshot) {
    return 'EMPTY';
  }

  if (isPartial) {
    return 'PARTIAL';
  }

  return 'READY';
}

/**
 * Pure resolver to select an active snapshot from the backend-ordered list.
 *
 * Hard Invariant: React must never do `snapshots.sort(...)` to establish historical truth.
 */
export function resolveSelectedSnapshot(params: {
  readonly snapshots: readonly InfrastructureSnapshotDto[];
  readonly requestedSnapshotId?: string | null;
  readonly snapshotDetail?: InfrastructureSnapshotDto | null;
}): {
  readonly selectedSnapshot: InfrastructureSnapshotDto | null;
  readonly isCurrent: boolean;
  readonly isInitialBaseline: boolean;
} {
  const { snapshots = [], requestedSnapshotId, snapshotDetail } = params;

  const validSnapshots = snapshots.filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  const total = validSnapshots.length;
  const isInitialBaseline = total === 1;

  // 1. If explicit detail is provided and matches requested ID
  if (snapshotDetail && snapshotDetail.id) {
    if (!requestedSnapshotId || snapshotDetail.id === requestedSnapshotId) {
      const isFirstInList = total > 0 && validSnapshots[0].id === snapshotDetail.id;
      return {
        selectedSnapshot: snapshotDetail,
        isCurrent: total > 0 ? isFirstInList : true,
        isInitialBaseline,
      };
    }
  }

  // 2. If requested snapshot ID is given, find in list
  if (requestedSnapshotId && total > 0) {
    const foundIndex = validSnapshots.findIndex((s) => s.id === requestedSnapshotId);
    if (foundIndex !== -1) {
      return {
        selectedSnapshot: validSnapshots[foundIndex],
        isCurrent: foundIndex === 0,
        isInitialBaseline,
      };
    }
  }

  // 3. Default to the latest / first snapshot in the backend-ordered list
  if (total > 0) {
    return {
      selectedSnapshot: validSnapshots[0],
      isCurrent: true,
      isInitialBaseline,
    };
  }

  // 4. If snapshotDetail is present without list
  if (snapshotDetail && snapshotDetail.id) {
    return {
      selectedSnapshot: snapshotDetail,
      isCurrent: true,
      isInitialBaseline: false,
    };
  }

  return {
    selectedSnapshot: null,
    isCurrent: false,
    isInitialBaseline: false,
  };
}
