/**
 * ADMIN-007: Admin Console API Client
 *
 * Dedicated API methods for the Admin Console operational control plane.
 * Enforces Bearer token transport and handles standard response models.
 */

export interface AdminPlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  activeNowUsers: number;
  monthlyActiveUsers: number;
  pendingVerificationUsers: number;
  newUsers: number;
  deactivatedUsers: number;
}

export interface AdminGxIntelligence {
  totalGxSessions: number;
  activeGuests: number;
  gxUnderstandings: number;
  convertedUsers: number;
  conversionRate: number;
  trend: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
}

export interface AdminSecurityMetrics {
  adminSessions: number;
  userSessions: number;
  failedAdminAuthCount: number;
  recentSecurityEventsCount: number;
  assuranceLevel: 'AAL3';
  webAuthnStatus: 'OPERATIONAL' | 'DEGRADED';
}

export interface AdminSystemHealth {
  apiHealth: 'HEALTHY' | 'DEGRADED';
  databaseHealth: 'HEALTHY' | 'DEGRADED';
  workersHealth: 'HEALTHY' | 'DEGRADED';
  infrastructureHealth: 'HEALTHY' | 'DEGRADED';
  uptimeSeconds: number;
}

export interface AdminGeographicDistributionItem {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  userCount: number;
  percentage: number;
}

export interface AdminOverviewMetricsDto {
  platform: AdminPlatformMetrics;
  guestExperience: AdminGxIntelligence;
  security: AdminSecurityMetrics;
  system: AdminSystemHealth;
  geographicDistribution?: AdminGeographicDistributionItem[];
}

export interface AdminUserListItemDto {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  domainsCount: number;
  activeSessionsCount: number;
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  lastIpAddress?: string | null;
}

export interface AdminPaginatedUsersDto {
  users: AdminUserListItemDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminUserDetailDto {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  domainsCount: number;
  activeSessionsCount: number;
  authProviders: string[];
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  lastIpAddress?: string | null;
}

export interface AdminTabPresenceDto {
  tabInstanceId: string;
  sessionId?: string;
  status: 'active' | 'hidden' | 'closed';
  lastSeenAt: string;
  lastVisibleAt?: string;
  lastHiddenAt?: string;
  lastClosedAt?: string;
  lastPresenceSignal: string;
  path?: string;
  surface?: string;
}

export interface AdminSessionPresenceSummaryDto {
  isOnline: boolean;
  activeTabsCount: number;
  hiddenTabsCount: number;
  closedTabsCount: number;
  tabs: AdminTabPresenceDto[];
}

export interface AdminSessionsOverviewDto {
  currentSessionId: string;
  adminSessions: Array<{
    id: string;
    adminId: string;
    credentialId?: string | null;
    status: string;
    assuranceLevel: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    countryCode?: string;
    countryName?: string;
    countryFlag?: string;
    expiresAt: string;
    lastActiveAt: string;
    createdAt: string;
    presence?: AdminSessionPresenceSummaryDto;
  }>;
  userSessionsCount: number;
  userSessions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    countryCode?: string;
    countryName?: string;
    countryFlag?: string;
    createdAt: string;
    lastActiveAt?: string | null;
    expiresAt: string;
    presence?: AdminSessionPresenceSummaryDto;
  }>;
}

export interface AdminSecurityOverviewDto {
  adminAuthStatus: 'PROTECTED';
  webAuthnStatus: 'OPERATIONAL';
  activePasskeyCount: number;
  assuranceLevel: 'AAL3';
  failedAuthCount: number;
  recentEventsCount: number;
  lockoutState: 'UNLOCKED' | 'LOCKED';
}

export interface AdminAuditEventDto {
  id: string;
  adminId?: string | null;
  action: string;
  category: string;
  targetType?: string | null;
  targetId?: string | null;
  outcome: string;
  ipAddress?: string | null;
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  userAgent?: string | null;
  createdAt: string;
}

export interface AdminAuditChainVerificationResultDto {
  valid: boolean;
  totalEventsVerified: number;
  genesisHash: string;
  latestHash: string;
  brokenIndex?: number;
  tamperedEventId?: string;
  details?: string;
}

export interface AdminPaginatedAuditDto {
  events: AdminAuditEventDto[];
  total: number;
  page: number;
  totalPages: number;
}

///////////////////////////////////////////////////////////
// VISITOR & TRAFFIC ANALYTICS (ADMIN-VISITORS)
///////////////////////////////////////////////////////////

export type VisitorPeriod = '24h' | '7d' | '30d' | 'all';

export interface TrafficOverviewMetrics {
  totalPageviews: number;
  totalUniqueVisitors: number;
  todayVisitors: number;
  activeVisitorsNow: number;
  avgDurationSeconds: number;
  bounceRatePercentage: number;
}

export interface LandingPageTrafficMetrics {
  pageviews: number;
  uniqueVisitors: number;
  directScansStarted: number;
  ctaClicks: {
    scanDomain: number;
    signUp: number;
    exploreDocs: number;
  };
  topReferrers: Array<{ referrer: string; count: number; percentage: number }>;
}

export interface GxTrafficMetrics {
  totalVisitors: number;
  uniqueGuests: number;
  activeGuestSessions: number;
  understandingsInitiated: number;
  understandingsCompleted: number;
  conversionsToRegistered: number;
  conversionRatePercentage: number;
  funnel: {
    stage1LandingVisits: number;
    stage2DomainEntered: number;
    stage3BriefGenerated: number;
    stage4ClaimCtaClicked: number;
    stage5AccountCreated: number;
  };
  topScannedDomains: Array<{ domain: string; count: number }>;
}

export interface DocsTrafficMetrics {
  pageviews: number;
  uniqueVisitors: number;
  topSections: Array<{
    section: string;
    path: string;
    views: number;
    percentage: number;
  }>;
  searchQueriesCount: number;
  topSearchKeywords: Array<{ keyword: string; count: number }>;
}

export interface SurfaceTrafficBreakdownItem {
  surfaceId: 'landing' | 'gx' | 'docs' | 'workspace' | 'auth' | 'other';
  label: string;
  pathPrefix: string;
  pageviews: number;
  uniqueVisitors: number;
  percentageOfTotal: number;
  avgTimeOnPageSeconds: number;
}

export interface TrafficGeographicItem {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  visitors: number;
  pageviews: number;
  percentage: number;
}

export interface TrafficDeviceBreakdown {
  devices: Array<{ type: 'Desktop' | 'Mobile' | 'Tablet' | 'Other'; count: number; percentage: number }>;
  browsers: Array<{ name: string; count: number; percentage: number }>;
  operatingSystems: Array<{ name: string; count: number; percentage: number }>;
}

export interface TrafficTimeSeriesPoint {
  timestamp: string;
  label: string;
  pageviews: number;
  uniqueVisitors: number;
  gxVisitors: number;
  landingVisitors: number;
  docsVisitors: number;
}

export interface AdminVisitorsAnalyticsDto {
  period: VisitorPeriod;
  domainFilter: string;
  availableDomains: string[];
  overview: TrafficOverviewMetrics;
  surfaces: {
    landing: LandingPageTrafficMetrics;
    guestExperience: GxTrafficMetrics;
    docs: DocsTrafficMetrics;
    allSurfaces: SurfaceTrafficBreakdownItem[];
  };
  timeSeries: TrafficTimeSeriesPoint[];
  geographicDistribution: TrafficGeographicItem[];
  clientDemographics: TrafficDeviceBreakdown;
}

export interface AdminVisitorsQueryDto {
  period?: VisitorPeriod;
  domain?: string;
}

export interface RecordVisitDto {
  path: string;
  referrer?: string;
  domain?: string;
  surface?: string;
  action?: string;
}

const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match =
    document.cookie.match(/(?:^|;\s*)(?:__Secure-|__Host-)?nebula_csrf_token=([^;]+)/) ||
    document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const getAdminHeaders = (): HeadersInit => {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('admin_access_token') || localStorage.getItem('admin_access_token') || ''
      : '';
  const csrfToken = getCsrfToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
  };
};

export const adminApi = {
  async getOverview(): Promise<AdminOverviewMetricsDto> {
    const res = await fetch('/api/v1/admin/overview', {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load Admin overview metrics.');
    return res.json();
  },

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    country?: string;
  }): Promise<AdminPaginatedUsersDto> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.country) query.set('country', params.country);

    const res = await fetch(`/api/v1/admin/users?${query.toString()}`, {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load user directory.');
    return res.json();
  },

  async getUserDetail(userId: string): Promise<AdminUserDetailDto> {
    const res = await fetch(`/api/v1/admin/users/${userId}`, {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load user detail.');
    return res.json();
  },

  async disableUser(userId: string, reason = 'Administrative disable'): Promise<{ success: boolean }> {
    const res = await fetch(`/api/v1/admin/users/${userId}/disable`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to disable user.');
    return res.json();
  },

  async getSessions(): Promise<AdminSessionsOverviewDto> {
    const res = await fetch('/api/v1/admin/sessions', {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load sessions.');
    return res.json();
  },

  async revokeSession(sessionId: string, type: 'ADMIN' | 'USER' = 'ADMIN'): Promise<{ success: boolean }> {
    const res = await fetch(`/api/v1/admin/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error('Failed to revoke session.');
    return res.json();
  },

  async revokeAllOtherAdminSessions(): Promise<{ revokedCount: number }> {
    const res = await fetch('/api/v1/admin/sessions/revoke-all-others', {
      method: 'POST',
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to revoke other sessions.');
    return res.json();
  },

  async getSecurity(): Promise<AdminSecurityOverviewDto> {
    const res = await fetch('/api/v1/admin/security', {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load security overview.');
    return res.json();
  },

  async getAudit(params: {
    page?: number;
    limit?: number;
    action?: string;
    outcome?: string;
    category?: string;
  }): Promise<AdminPaginatedAuditDto> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.action) query.set('action', params.action);
    if (params.outcome) query.set('outcome', params.outcome);
    if (params.category) query.set('category', params.category);

    const res = await fetch(`/api/v1/admin/audit?${query.toString()}`, {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load audit events.');
    return res.json();
  },

  async verifyAuditIntegrity(): Promise<{
    valid: boolean;
    totalEventsVerified: number;
    genesisHash: string;
    latestHash: string;
    brokenIndex?: number;
    tamperedEventId?: string;
    details?: string;
  }> {
    const res = await fetch('/api/v1/admin/audit/verify-integrity', {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to verify audit hash chain integrity.');
    return res.json();
  },

  async triggerLockdown(reason: string): Promise<{
    success: boolean;
    status: string;
    revokedSessionsCount: number;
    lockdownAt: string;
    reason: string;
  }> {
    const res = await fetch('/api/v1/admin/security/lockdown', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to trigger emergency lockdown.');
    return res.json();
  },

  async revokeAllSessions(reason: string): Promise<{ revokedCount: number }> {
    const res = await fetch('/api/v1/admin/security/revoke-all-sessions', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to revoke all sessions.');
    return res.json();
  },

  async verifyAuditChainIntegrity(): Promise<AdminAuditChainVerificationResultDto> {
    const res = await fetch('/api/v1/admin/audit/verify-integrity', {
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to verify audit chain cryptographic integrity.');
    return res.json();
  },

  async cleanupExpiredAudit(): Promise<{ deletedCount: number }> {
    const res = await fetch('/api/v1/admin/audit/retention-cleanup', {
      method: 'POST',
      headers: getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clean up expired audit logs.');
    return res.json();
  },

  async getAuthStatus(): Promise<{
    isProvisioned: boolean;
    isActive?: boolean;
    hasPasskeys: boolean;
    identifier?: string | null;
  }> {
    const res = await fetch('/api/v1/admin/auth/status');
    if (!res.ok) throw new Error('Failed to fetch admin auth status.');
    return res.json();
  },

  async initiateWebAuthnAuth(identifier: string): Promise<{ options: any; challenge: string }> {
    const res = await fetch('/api/v1/admin/auth/webauthn/authenticate/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initiate WebAuthn authentication.');
    }
    return res.json();
  },

  async verifyWebAuthnAuth(
    identifier: string,
    response: any,
    challenge?: string,
  ): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    sessionId: string;
    assuranceLevel: string;
    adminId: string;
    identifier: string;
  }> {
    const res = await fetch('/api/v1/admin/auth/webauthn/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, response, challenge }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'WebAuthn authentication verification failed.');
    }
    return res.json();
  },

  async initiateWebAuthnEnrollment(params: {
    identifier?: string;
    password?: string;
    deviceLabel?: string;
  } = {}): Promise<{ options: any; challenge: string }> {
    const res = await fetch('/api/v1/admin/auth/webauthn/enroll/initiate', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initiate passkey enrollment.');
    }
    return res.json();
  },

  async verifyWebAuthnEnrollment(params: {
    identifier?: string;
    response: any;
    challenge?: string;
    deviceLabel?: string;
  }): Promise<{
    credentialId: string;
    deviceLabel?: string;
    status: string;
  }> {
    const res = await fetch('/api/v1/admin/auth/webauthn/enroll/verify', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Passkey enrollment verification failed.');
    }
    return res.json();
  },

  async getVisitorAnalytics(query: AdminVisitorsQueryDto = {}): Promise<AdminVisitorsAnalyticsDto> {
    const params = new URLSearchParams();
    if (query.period) params.set('period', query.period);
    if (query.domain) params.set('domain', query.domain);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/v1/admin/visitors${qs}`, {
      headers: getAdminHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load visitor analytics.');
    }
    return res.json();
  },

  async recordVisit(dto: RecordVisitDto): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/v1/telemetry/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return res.ok ? await res.json() : { success: false };
    } catch {
      return { success: false };
    }
  },
};
