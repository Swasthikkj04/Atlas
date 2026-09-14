import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  AdminSessionPresenceSummaryDto,
  AdminTabPresenceDto,
  AdminVisitorsAnalyticsDto,
  AdminVisitorsQueryDto,
  DocsTrafficMetrics,
  GxTrafficMetrics,
  LandingPageTrafficMetrics,
  RecordVisitDto,
  SurfaceTrafficBreakdownItem,
  TrafficDeviceBreakdown,
  TrafficGeographicItem,
  TrafficOverviewMetrics,
  TrafficTimeSeriesPoint,
  VisitorPeriod,
} from '../contracts/admin-console.contract';
import {
  RecordTelemetryEventDto,
  TelemetryIngestResponseDto,
  TelemetryPrivacyBoundary,
} from '../contracts/telemetry.contract';
import { lookupCountryFromIp } from '../utils/geo-ip.util';

export interface InternalVisitEvent {
  id: string;
  timestamp: Date;
  path: string;
  surface: 'landing' | 'gx' | 'docs' | 'workspace' | 'auth' | 'other';
  ipAddress?: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  userAgent?: string;
  browser: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Other';
  os: string;
  referrer?: string;
  domain?: string;
  action?: string;
  tabInstanceId?: string;
  sessionId?: string;
}

@Injectable()
export class VisitorAnalyticsService {
  private readonly logger = new Logger(VisitorAnalyticsService.name);

  // In-memory telemetry circular buffer (retains up to last 10,000 live events)
  private readonly MAX_EVENTS = 10000;
  private readonly telemetryEvents: InternalVisitEvent[] = [];

  // ADMIN-003: In-memory browser tab presence store (retains up to 5,000 active tab records)
  // FREEZE INVARIANT: SESSION_TAB_CLOSED ≠ SESSION_REVOKED
  // Browser presence is observational telemetry. Session revocation is authoritative security state.
  private readonly MAX_TABS = 5000;
  private readonly tabPresenceMap = new Map<string, AdminTabPresenceDto>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Classifies a URL path into a platform surface.
   */
  public classifyPath(
    path: string,
  ): 'landing' | 'gx' | 'docs' | 'workspace' | 'auth' | 'other' {
    if (!path || path === '/' || path === '') return 'landing';
    if (path.startsWith('/guest')) return 'gx';
    if (path.startsWith('/docs') || path.startsWith('/api-docs')) return 'docs';
    if (path.startsWith('/workspace') || path.startsWith('/dashboard'))
      return 'workspace';
    if (
      path.startsWith('/auth') ||
      path.startsWith('/login') ||
      path.startsWith('/register')
    )
      return 'auth';
    return 'other';
  }

  /**
   * Helper to parse user agent strings into browser, OS, and device type without mock assumptions.
   */
  private parseUserAgent(ua?: string): {
    browser: string;
    os: string;
    deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Other';
  } {
    if (!ua || ua.trim() === '') {
      return { browser: 'Unknown', os: 'Unknown', deviceType: 'Desktop' };
    }
    const clean = ua.toLowerCase();

    // Accurate Browser identification (order matters due to UA token nesting)
    let browser = 'Unknown';
    if (clean.includes('edg/') || clean.includes('edge/')) {
      browser = 'Edge';
    } else if (clean.includes('opr/') || clean.includes('opera/')) {
      browser = 'Opera';
    } else if (
      clean.includes('chrome/') ||
      clean.includes('chromium/') ||
      clean.includes('crios/')
    ) {
      browser = 'Chrome';
    } else if (clean.includes('firefox/') || clean.includes('fxios/')) {
      browser = 'Firefox';
    } else if (clean.includes('safari/') && !clean.includes('chrome')) {
      browser = 'Safari';
    } else if (
      clean.includes('curl/') ||
      clean.includes('postman') ||
      clean.includes('insomnia') ||
      clean.includes('axios')
    ) {
      browser = 'API Client';
    } else {
      browser = 'Other';
    }

    // Accurate Operating System identification
    let os = 'Unknown';
    if (
      clean.includes('windows') ||
      clean.includes('win32') ||
      clean.includes('win64')
    ) {
      os = 'Windows';
    } else if (
      clean.includes('iphone') ||
      clean.includes('ipad') ||
      clean.includes('ipod')
    ) {
      os = 'iOS';
    } else if (
      clean.includes('macintosh') ||
      clean.includes('mac os x') ||
      clean.includes('darwin')
    ) {
      os = 'macOS';
    } else if (clean.includes('android')) {
      os = 'Android';
    } else if (clean.includes('linux') || clean.includes('x11')) {
      os = 'Linux';
    } else {
      os = 'Other';
    }

    // Accurate Device Form-Factor identification
    let deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Other' = 'Desktop';
    if (clean.includes('tablet') || clean.includes('ipad')) {
      deviceType = 'Tablet';
    } else if (
      clean.includes('mobile') ||
      clean.includes('phone') ||
      clean.includes('android') ||
      clean.includes('iphone')
    ) {
      deviceType = 'Mobile';
    }

    return { browser, os, deviceType };
  }

  /**
   * Ingests a live client visit beacon into memory telemetry.
   */
  public recordVisit(
    dto: RecordVisitDto,
    ipAddress?: string,
    userAgent?: string,
    headerCountry?: string,
  ): { success: boolean; eventId: string } {
    const geo = lookupCountryFromIp(ipAddress, headerCountry);
    const uaInfo = this.parseUserAgent(userAgent);
    const surface = (dto.surface as any) || this.classifyPath(dto.path);

    const event: InternalVisitEvent = {
      id: `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(),
      path: dto.path || '/',
      surface,
      ipAddress: ipAddress || '127.0.0.1',
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      countryFlag: geo.countryFlag,
      userAgent,
      browser: uaInfo.browser,
      deviceType: uaInfo.deviceType,
      os: uaInfo.os,
      referrer: dto.referrer,
      domain: dto.domain,
      action: dto.action,
    };

    this.telemetryEvents.push(event);
    if (this.telemetryEvents.length > this.MAX_EVENTS) {
      this.telemetryEvents.shift();
    }

    return { success: true, eventId: event.id };
  }

  /**
   * ADMIN-002: Ingests a strictly validated telemetry action event.
   * Enforces privacy checks, domain normalization, and fail-safe recording.
   */
  public recordTelemetryEvent(
    dto: RecordTelemetryEventDto,
    ipAddress?: string,
    userAgent?: string,
    headerCountry?: string,
  ): { success: boolean; eventId: string } {
    // 1. Enforce privacy boundary: reject sensitive secrets, credentials, or tokens
    TelemetryPrivacyBoundary.assertNoSensitiveData(dto);

    // 2. Parse geographical location & user agent metadata safely
    const geo = lookupCountryFromIp(ipAddress, headerCountry);
    const uaInfo = this.parseUserAgent(userAgent);

    // 3. Resolve surface & normalized path
    const path =
      dto.path || dto.metadata?.path || (dto.surface === 'gx' ? '/guest' : '/');
    const surface =
      (dto.surface as any) ||
      (dto.metadata?.surface as any) ||
      this.classifyPath(path);

    // 4. Normalize timestamp with server bounds fallback
    let eventTime = new Date();
    if (dto.timestamp) {
      const parsed = new Date(dto.timestamp);
      if (!isNaN(parsed.getTime())) {
        const diffMs = Math.abs(eventTime.getTime() - parsed.getTime());
        // Accept timestamp if within 24 hours of server time
        if (diffMs < 24 * 60 * 60 * 1000) {
          eventTime = parsed;
        }
      }
    }

    // 5. Normalize domain if present
    const rawDomain = dto.metadata?.submittedDomain;
    const normalizedDomain = rawDomain
      ? TelemetryPrivacyBoundary.normalizeDomain(rawDomain)
      : undefined;

    // 6. Record tab presence if tabInstanceId is provided
    this.updateTabPresence(dto, eventTime, surface, path);

    const event: InternalVisitEvent = {
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: eventTime,
      path,
      surface,
      ipAddress: ipAddress || '127.0.0.1',
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      countryFlag: geo.countryFlag,
      userAgent,
      browser: uaInfo.browser,
      deviceType: uaInfo.deviceType,
      os: uaInfo.os,
      referrer: dto.metadata?.referrer,
      domain: normalizedDomain,
      action: dto.event,
      tabInstanceId: dto.metadata?.tabInstanceId,
      sessionId: dto.sessionId,
    };

    this.telemetryEvents.push(event);
    if (this.telemetryEvents.length > this.MAX_EVENTS) {
      this.telemetryEvents.shift();
    }

    return { success: true, eventId: event.id };
  }

  /**
   * ADMIN-003: Updates browser tab presence state in memory.
   *
   * FREEZE INVARIANT: SESSION_TAB_CLOSED ≠ SESSION_REVOKED
   * Presence is best-effort observational telemetry. Closing a browser tab
   * does NOT revoke or invalidate the user or admin authentication session.
   */
  public updateTabPresence(
    dto: RecordTelemetryEventDto,
    eventTime: Date,
    surface: string,
    path: string,
  ): void {
    const tabId = dto.metadata?.tabInstanceId;
    if (!tabId || typeof tabId !== 'string') {
      return;
    }

    const sessionId = dto.sessionId || (dto.metadata as any)?.sessionId;
    const existing = this.tabPresenceMap.get(tabId);

    let status: 'active' | 'hidden' | 'closed' = existing?.status || 'active';
    let lastVisibleAt = existing?.lastVisibleAt;
    let lastHiddenAt = existing?.lastHiddenAt;
    let lastClosedAt = existing?.lastClosedAt;

    if (dto.event === 'SESSION_TAB_OPENED') {
      const isHidden = dto.metadata?.status === 'hidden';
      status = isHidden ? 'hidden' : 'active';
      if (status === 'active') {
        lastVisibleAt = eventTime;
      } else {
        lastHiddenAt = eventTime;
      }
    } else if (dto.event === 'SESSION_TAB_VISIBLE') {
      status = 'active';
      lastVisibleAt = eventTime;
    } else if (dto.event === 'SESSION_TAB_HIDDEN') {
      status = 'hidden';
      lastHiddenAt = eventTime;
    } else if (dto.event === 'SESSION_TAB_CLOSED') {
      status = 'closed';
      lastClosedAt = eventTime;
      // Note: SESSION_TAB_CLOSED strictly means the browser document unloaded.
      // It does NOT terminate or revoke the authentication session.
    } else {
      if (status !== 'closed') {
        status = 'active';
        lastVisibleAt = eventTime;
      }
    }

    const record: AdminTabPresenceDto = {
      tabInstanceId: tabId,
      sessionId: sessionId || existing?.sessionId,
      status,
      lastSeenAt: eventTime,
      lastVisibleAt,
      lastHiddenAt,
      lastClosedAt,
      lastPresenceSignal: dto.event,
      path,
      surface,
    };

    this.tabPresenceMap.set(tabId, record);

    if (this.tabPresenceMap.size > this.MAX_TABS) {
      const firstKey = this.tabPresenceMap.keys().next().value;
      if (firstKey) this.tabPresenceMap.delete(firstKey);
    }
  }

  /**
   * Retrieves aggregated presence information for a given session ID.
   * Multi-tab aware: If Tab A is closed but Tab B is active, the session is online.
   */
  public getSessionPresence(sessionId: string): AdminSessionPresenceSummaryDto {
    if (!sessionId) {
      return {
        isOnline: false,
        activeTabsCount: 0,
        hiddenTabsCount: 0,
        closedTabsCount: 0,
        tabs: [],
      };
    }

    const tabs: AdminTabPresenceDto[] = [];
    for (const tab of this.tabPresenceMap.values()) {
      if (tab.sessionId === sessionId) {
        tabs.push(tab);
      }
    }

    const activeTabsCount = tabs.filter((t) => t.status === 'active').length;
    const hiddenTabsCount = tabs.filter((t) => t.status === 'hidden').length;
    const closedTabsCount = tabs.filter((t) => t.status === 'closed').length;
    const isOnline = activeTabsCount > 0 || hiddenTabsCount > 0;

    return {
      isOnline,
      activeTabsCount,
      hiddenTabsCount,
      closedTabsCount,
      tabs,
    };
  }

  /**
   * Retrieves tab presence for a specific tab instance.
   */
  public getTabPresence(
    tabInstanceId: string,
  ): AdminTabPresenceDto | undefined {
    return this.tabPresenceMap.get(tabInstanceId);
  }

  /**
   * Retrieves all tracked tab presence records.
   */
  public getAllTabPresence(): AdminTabPresenceDto[] {
    return Array.from(this.tabPresenceMap.values());
  }

  /**
   * Prunes stale tab presence records older than maxAgeMs (default 24h).
   */
  public pruneStalePresence(maxAgeMs = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [tabId, rec] of this.tabPresenceMap.entries()) {
      if (rec.lastSeenAt.getTime() < cutoff) {
        this.tabPresenceMap.delete(tabId);
      }
    }
  }

  /**
   * ADMIN-002: Ingests a batch of telemetry events.
   */
  public recordTelemetryEvents(
    events: RecordTelemetryEventDto[],
    ipAddress?: string,
    userAgent?: string,
    headerCountry?: string,
  ): TelemetryIngestResponseDto {
    const eventIds: string[] = [];
    for (const ev of events) {
      try {
        const res = this.recordTelemetryEvent(
          ev,
          ipAddress,
          userAgent,
          headerCountry,
        );
        if (res.eventId) {
          eventIds.push(res.eventId);
        }
      } catch (err) {
        // If it's a privacy/validation error, let it propagate; otherwise isolate
        if (err instanceof Error && err.name === 'BadRequestException') {
          throw err;
        }
        this.logger.debug(`Isolated non-fatal telemetry failure: ${err}`);
      }
    }

    return {
      success: true,
      ingested: eventIds.length,
      eventIds,
    };
  }

  /**
   * Calculates comprehensive visitor and traffic analytics using 100% real database records
   * and live telemetry events without synthetic/dummy numbers.
   */
  public async getVisitorAnalytics(
    query: AdminVisitorsQueryDto = {},
  ): Promise<AdminVisitorsAnalyticsDto> {
    const period = query.period || '24h';
    const domainFilter = query.domain || 'all';

    const now = new Date();
    const periodStart = this.calculatePeriodStartDate(period, now);

    // 1. Fetch real available tenant domains from database
    const dbDomains = await this.prisma.domain.findMany({
      select: { domainName: true },
      take: 100,
    });
    const availableDomains = [
      'all',
      'atlas.dev',
      ...Array.from(new Set(dbDomains.map((d) => d.domainName))),
    ];

    // 2. Fetch real database metrics for guest sessions, understandings, and active user sessions
    const [
      totalGxSessions,
      activeGxSessions,
      completedGxSessions,
      convertedGxSessions,
      gxJobsCount,
      activeUserSessionsCount,
      dbGuestSessions,
    ] = await Promise.all([
      this.prisma.guestSession.count(),
      this.prisma.guestSession.count({
        where: { status: 'ACTIVE', expiresAt: { gt: now } },
      }),
      this.prisma.guestSession.count({ where: { status: 'COMPLETED' } }),
      this.prisma.guestSession.count({ where: { status: 'CONVERTED' } }),
      this.prisma.understandingJob.count({
        where: { startedAt: { gte: periodStart } },
      }),
      this.prisma.userSession.count({
        where: { expiresAt: { gt: now }, revokedAt: null },
      }),
      this.prisma.guestSession.findMany({
        where: { domain: { not: null } },
        select: { domain: true },
        take: 100,
      }),
    ]);

    // 3. Filter relevant live telemetry events by time window and domain
    const filteredEvents = this.telemetryEvents.filter((ev) => {
      if (ev.timestamp < periodStart) return false;
      if (domainFilter !== 'all' && ev.domain && ev.domain !== domainFilter) {
        return false;
      }
      return true;
    });

    // 4. Calculate Surface Traffic Breakdown
    const landingEvents = filteredEvents.filter((e) => e.surface === 'landing');
    const gxEvents = filteredEvents.filter((e) => e.surface === 'gx');
    const docsEvents = filteredEvents.filter((e) => e.surface === 'docs');
    const workspaceEvents = filteredEvents.filter(
      (e) => e.surface === 'workspace',
    );
    const authEvents = filteredEvents.filter((e) => e.surface === 'auth');
    const otherEvents = filteredEvents.filter((e) => e.surface === 'other');

    const totalPageviews = filteredEvents.length;
    const uniqueIps = new Set(filteredEvents.map((e) => e.ipAddress || e.id));
    const totalUniqueVisitors = uniqueIps.size;

    // Active Visitors Now (events within last 5 minutes + active guest/user sessions)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentUniqueIps = new Set(
      filteredEvents
        .filter((e) => e.timestamp >= fiveMinutesAgo)
        .map((e) => e.ipAddress || e.id),
    );
    const activeVisitorsNow = Math.max(
      recentUniqueIps.size,
      activeGxSessions + activeUserSessionsCount,
    );

    // Today's visitors (midnight to now)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayEvents = this.telemetryEvents.filter(
      (e) => e.timestamp >= startOfToday,
    );
    const todayVisitors = new Set(todayEvents.map((e) => e.ipAddress || e.id))
      .size;

    // Computed overview metrics
    const bounceRatePercentage =
      totalPageviews > 0 && totalUniqueVisitors > 0
        ? Number(((totalUniqueVisitors / totalPageviews) * 100).toFixed(1))
        : 0;

    const overview: TrafficOverviewMetrics = {
      totalPageviews,
      totalUniqueVisitors,
      todayVisitors,
      activeVisitorsNow,
      avgDurationSeconds: 0,
      bounceRatePercentage,
    };

    // 5. Landing Page Metrics (100% computed from real events)
    const landingUniques = new Set(
      landingEvents.map((e) => e.ipAddress || e.id),
    ).size;
    const scanDomainClicks = landingEvents.filter(
      (e) => e.action === 'SCAN_DOMAIN_CTA' || e.action === 'SCAN_DOMAIN',
    ).length;
    const signUpClicks = landingEvents.filter(
      (e) => e.action === 'SIGN_UP_CTA' || e.action === 'SIGN_UP',
    ).length;
    const exploreDocsClicks = landingEvents.filter(
      (e) => e.action === 'EXPLORE_DOCS_CTA' || e.action === 'EXPLORE_DOCS',
    ).length;

    const landing: LandingPageTrafficMetrics = {
      pageviews: landingEvents.length,
      uniqueVisitors: landingUniques,
      directScansStarted: scanDomainClicks,
      ctaClicks: {
        scanDomain: scanDomainClicks,
        signUp: signUpClicks,
        exploreDocs: exploreDocsClicks,
      },
      topReferrers: this.aggregateReferrers(landingEvents),
    };

    // 6. Guest Experience (GX) Metrics & Funnel (100% computed from database + telemetry)
    const gxUniques =
      new Set(gxEvents.map((e) => e.ipAddress || e.id)).size || totalGxSessions;
    const calculatedConversionRate =
      totalGxSessions > 0
        ? Number(((convertedGxSessions / totalGxSessions) * 100).toFixed(1))
        : 0;

    // Aggregate top scanned domains strictly from DB guest sessions and GX events
    const domainCounts = new Map<string, number>();
    for (const gs of dbGuestSessions) {
      if (gs.domain) {
        domainCounts.set(gs.domain, (domainCounts.get(gs.domain) || 0) + 1);
      }
    }
    for (const ev of gxEvents) {
      if (ev.domain) {
        domainCounts.set(ev.domain, (domainCounts.get(ev.domain) || 0) + 1);
      }
    }
    const topScannedDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const gxMetrics: GxTrafficMetrics = {
      totalVisitors: gxEvents.length || totalGxSessions,
      uniqueGuests: gxUniques,
      activeGuestSessions: activeGxSessions,
      understandingsInitiated: gxJobsCount,
      understandingsCompleted: completedGxSessions,
      conversionsToRegistered: convertedGxSessions,
      conversionRatePercentage: calculatedConversionRate,
      funnel: {
        stage1LandingVisits: gxEvents.length || totalGxSessions,
        stage2DomainEntered: totalGxSessions,
        stage3BriefGenerated: completedGxSessions,
        stage4ClaimCtaClicked: gxEvents.filter(
          (e) => e.action === 'CLAIM_SESSION' || e.action === 'CLAIM_CTA',
        ).length,
        stage5AccountCreated: convertedGxSessions,
      },
      topScannedDomains,
    };

    // 7. Docs Traffic Metrics (100% computed from real docs events)
    const docsUniques = new Set(docsEvents.map((e) => e.ipAddress || e.id))
      .size;
    const docPathCounts = new Map<string, number>();
    for (const ev of docsEvents) {
      const p = ev.path || '/docs';
      docPathCounts.set(p, (docPathCounts.get(p) || 0) + 1);
    }
    const totalDocsViews = docsEvents.length;
    const topSections = Array.from(docPathCounts.entries())
      .map(([p, views]) => {
        const sectionName =
          p.replace('/docs/', '').replace(/-/g, ' ').toUpperCase() ||
          'DOCUMENTATION HOME';
        return {
          section: sectionName,
          path: p,
          views,
          percentage:
            totalDocsViews > 0
              ? Number(((views / totalDocsViews) * 100).toFixed(1))
              : 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const searchEvents = docsEvents.filter(
      (e) => e.action === 'SEARCH' || (e.path && e.path.includes('search')),
    );
    const searchKeywordsMap = new Map<string, number>();
    for (const ev of searchEvents) {
      const kw = ev.referrer || ev.domain || 'query';
      searchKeywordsMap.set(kw, (searchKeywordsMap.get(kw) || 0) + 1);
    }
    const topSearchKeywords = Array.from(searchKeywordsMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const docs: DocsTrafficMetrics = {
      pageviews: docsEvents.length,
      uniqueVisitors: docsUniques,
      topSections,
      searchQueriesCount: searchEvents.length,
      topSearchKeywords,
    };

    // 8. All Surfaces Breakdown Table (100% real)
    const surfacesList = [
      {
        surfaceId: 'landing' as const,
        label: 'Landing Page (Marketing)',
        pathPrefix: '/',
        events: landingEvents,
      },
      {
        surfaceId: 'gx' as const,
        label: 'Guest Experience (Instant Scan)',
        pathPrefix: '/guest',
        events: gxEvents,
      },
      {
        surfaceId: 'docs' as const,
        label: 'Documentation & Guides',
        pathPrefix: '/docs',
        events: docsEvents,
      },
      {
        surfaceId: 'workspace' as const,
        label: 'Authenticated Workspace',
        pathPrefix: '/workspace',
        events: workspaceEvents,
      },
      {
        surfaceId: 'auth' as const,
        label: 'Authentication & Onboarding',
        pathPrefix: '/auth',
        events: authEvents,
      },
      {
        surfaceId: 'other' as const,
        label: 'Other Routes & API',
        pathPrefix: '*',
        events: otherEvents,
      },
    ];

    const allSurfaces: SurfaceTrafficBreakdownItem[] = surfacesList
      .map((s) => {
        const pvs = s.events.length;
        const uniques = new Set(s.events.map((e) => e.ipAddress || e.id)).size;
        const pct =
          totalPageviews > 0
            ? Number(((pvs / totalPageviews) * 100).toFixed(1))
            : 0;
        return {
          surfaceId: s.surfaceId,
          label: s.label,
          pathPrefix: s.pathPrefix,
          pageviews: pvs,
          uniqueVisitors: uniques,
          percentageOfTotal: pct,
          avgTimeOnPageSeconds: 0,
        };
      })
      .filter((s) => s.surfaceId !== 'other' || s.pageviews > 0)
      .sort((a, b) => b.pageviews - a.pageviews);

    // 9. Time Series Points (real event buckets)
    const timeSeries = this.generateTimeSeriesPoints(period, filteredEvents);

    // 10. Geographic Distribution (real geolocation from events)
    const geographicDistribution =
      this.aggregateGeographicDistribution(filteredEvents);

    // 11. Client Demographics (real parsed UA browsers, devices, OS)
    const clientDemographics = this.aggregateClientDemographics(filteredEvents);

    return {
      period,
      domainFilter,
      availableDomains,
      overview,
      surfaces: {
        landing,
        guestExperience: gxMetrics,
        docs,
        allSurfaces,
      },
      timeSeries,
      geographicDistribution,
      clientDemographics,
    };
  }

  /**
   * Generates time series intervals based on period.
   */
  private generateTimeSeriesPoints(
    period: VisitorPeriod,
    events: InternalVisitEvent[],
  ): TrafficTimeSeriesPoint[] {
    const points: TrafficTimeSeriesPoint[] = [];
    const now = new Date();

    if (period === '24h') {
      for (let i = 23; i >= 0; i--) {
        const bucketTime = new Date(now.getTime() - i * 3600 * 1000);
        const hourLabel = `${bucketTime.getHours().toString().padStart(2, '0')}:00`;
        const bucketStart = new Date(bucketTime);
        bucketStart.setMinutes(0, 0, 0);
        const bucketEnd = new Date(bucketTime);
        bucketEnd.setMinutes(59, 59, 999);

        const bucketEvents = events.filter(
          (e) => e.timestamp >= bucketStart && e.timestamp <= bucketEnd,
        );
        const uniqueIps = new Set(bucketEvents.map((e) => e.ipAddress || e.id));

        points.push({
          timestamp: bucketStart.toISOString(),
          label: hourLabel,
          pageviews: bucketEvents.length,
          uniqueVisitors: uniqueIps.size,
          gxVisitors: bucketEvents.filter((e) => e.surface === 'gx').length,
          landingVisitors: bucketEvents.filter((e) => e.surface === 'landing')
            .length,
          docsVisitors: bucketEvents.filter((e) => e.surface === 'docs').length,
        });
      }
    } else {
      const days = period === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400 * 1000);
        const label = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        const bucketEvents = events.filter(
          (e) => e.timestamp >= start && e.timestamp <= end,
        );
        const uniqueIps = new Set(bucketEvents.map((e) => e.ipAddress || e.id));

        points.push({
          timestamp: start.toISOString(),
          label,
          pageviews: bucketEvents.length,
          uniqueVisitors: uniqueIps.size,
          gxVisitors: bucketEvents.filter((e) => e.surface === 'gx').length,
          landingVisitors: bucketEvents.filter((e) => e.surface === 'landing')
            .length,
          docsVisitors: bucketEvents.filter((e) => e.surface === 'docs').length,
        });
      }
    }

    return points;
  }

  /**
   * Aggregates real geographic distribution of visitors from recorded events.
   */
  private aggregateGeographicDistribution(
    events: InternalVisitEvent[],
  ): TrafficGeographicItem[] {
    const countryMap = new Map<
      string,
      { name: string; flag: string; visitors: Set<string>; pageviews: number }
    >();

    for (const ev of events) {
      const code = ev.countryCode;
      const visitorId = ev.ipAddress || ev.id;
      const existing = countryMap.get(code);
      if (existing) {
        existing.visitors.add(visitorId);
        existing.pageviews += 1;
      } else {
        countryMap.set(code, {
          name: ev.countryName,
          flag: ev.countryFlag,
          visitors: new Set([visitorId]),
          pageviews: 1,
        });
      }
    }

    const totalVisitors = Array.from(countryMap.values()).reduce(
      (acc, c) => acc + c.visitors.size,
      0,
    );

    return Array.from(countryMap.entries())
      .map(([code, data]) => ({
        countryCode: code,
        countryName: data.name,
        countryFlag: data.flag,
        visitors: data.visitors.size,
        pageviews: data.pageviews,
        percentage:
          totalVisitors > 0
            ? Number(((data.visitors.size / totalVisitors) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors);
  }

  /**
   * Aggregates client demographics (browsers, devices, OS) strictly from actual events.
   */
  private aggregateClientDemographics(
    events: InternalVisitEvent[],
  ): TrafficDeviceBreakdown {
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const osMap = new Map<string, number>();

    const total = events.length;

    for (const ev of events) {
      deviceMap.set(ev.deviceType, (deviceMap.get(ev.deviceType) || 0) + 1);
      browserMap.set(ev.browser, (browserMap.get(ev.browser) || 0) + 1);
      osMap.set(ev.os, (osMap.get(ev.os) || 0) + 1);
    }

    const devices = Array.from(deviceMap.entries()).map(([type, count]) => ({
      type: type as any,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    }));

    const browsers = Array.from(browserMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    }));

    const operatingSystems = Array.from(osMap.entries()).map(
      ([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }),
    );

    return {
      devices,
      browsers,
      operatingSystems,
    };
  }

  /**
   * Aggregates real referrer traffic sources.
   */
  private aggregateReferrers(
    events: InternalVisitEvent[],
  ): Array<{ referrer: string; count: number; percentage: number }> {
    const map = new Map<string, number>();
    for (const ev of events) {
      if (ev.referrer) {
        map.set(ev.referrer, (map.get(ev.referrer) || 0) + 1);
      }
    }
    const total = Array.from(map.values()).reduce((acc, c) => acc + c, 0);
    return Array.from(map.entries())
      .map(([referrer, count]) => ({
        referrer,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Helper to compute start date for period filter.
   */
  private calculatePeriodStartDate(period: VisitorPeriod, now: Date): Date {
    switch (period) {
      case '24h':
        return new Date(now.getTime() - 24 * 3600 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 86400 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 86400 * 1000);
      case 'all':
      default:
        return new Date(0);
    }
  }
}
