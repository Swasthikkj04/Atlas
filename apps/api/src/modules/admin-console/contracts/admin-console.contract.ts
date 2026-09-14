import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminSessionDto } from '../../admin-session/contracts/admin-session.contract';

/**
 * ADMIN-007: Admin Console Contracts
 *
 * Operational control plane DTOs for Platform metrics, Guest Experience (GX) intelligence,
 * User directory, Sessions, Security posture, and Audit event inspection.
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
  geographicDistribution: AdminGeographicDistributionItem[];
}

export class AdminUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class DisableUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RevokeSessionDto {
  @IsOptional()
  @IsIn(['ADMIN', 'USER'])
  type?: 'ADMIN' | 'USER';
}

export class AdminEmergencyActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export interface AdminUserListItemDto {
  id: string;
  email: string;
  fullName?: string | null;
  status: string;
  createdAt: Date;
  lastLoginAt?: Date | null;
  domainsCount: number;
  activeSessionsCount: number;
  countryCode: string;
  countryName: string;
  countryFlag: string;
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
  fullName?: string | null;
  status: string;
  createdAt: Date;
  lastLoginAt?: Date | null;
  domainsCount: number;
  activeSessionsCount: number;
  authProviders: string[];
  countryCode: string;
  countryName: string;
  countryFlag: string;
  lastIpAddress?: string | null;
}

export interface AdminTabPresenceDto {
  tabInstanceId: string;
  sessionId?: string;
  status: 'active' | 'hidden' | 'closed';
  lastSeenAt: Date;
  lastVisibleAt?: Date;
  lastHiddenAt?: Date;
  lastClosedAt?: Date;
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
  adminSessions: Array<
    AdminSessionDto & {
      countryCode?: string;
      countryName?: string;
      countryFlag?: string;
      presence?: AdminSessionPresenceSummaryDto;
    }
  >;
  userSessionsCount: number;
  userSessions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    countryCode: string;
    countryName: string;
    countryFlag: string;
    createdAt: Date;
    lastActivityAt?: Date | null;
    expiresAt: Date;
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

export class AdminAuditQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
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
  createdAt: Date;
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
  devices: Array<{
    type: 'Desktop' | 'Mobile' | 'Tablet' | 'Other';
    count: number;
    percentage: number;
  }>;
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

export class AdminVisitorsQueryDto {
  @IsOptional()
  @IsIn(['24h', '7d', '30d', 'all'])
  period?: VisitorPeriod;

  @IsOptional()
  @IsString()
  domain?: string;
}

export class RecordVisitDto {
  @IsString()
  path!: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  surface?: string;

  @IsOptional()
  @IsString()
  action?: string;
}
