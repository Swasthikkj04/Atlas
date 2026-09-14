import React, { useState, useEffect, useTransition } from 'react';
import {
  Globe,
  Eye,
  Sparkles,
  BookOpen,
  MousePointerClick,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  Layers,
  Compass,
} from 'lucide-react';
import {
  adminApi,
  type AdminVisitorsAnalyticsDto,
  type VisitorPeriod,
} from '../api/admin-api';

export const AdminVisitorsView: React.FC = () => {
  const [data, setData] = useState<AdminVisitorsAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<VisitorPeriod>('24h');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [surfaceTab, setSurfaceTab] = useState<'gx' | 'landing' | 'docs' | 'all'>('gx');
  const [, startTransition] = useTransition();

  const loadData = useCallback(async (selectedPeriod = period, selectedDomain = domainFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getVisitorAnalytics({
        period: selectedPeriod,
        domain: selectedDomain !== 'all' ? selectedDomain : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load visitor analytics.');
    } finally {
      setLoading(false);
    }
  }, [period, domainFilter]);

  useEffect(() => {
    loadData(period, domainFilter);
  }, [loadData, period, domainFilter]);

  const handlePeriodChange = (newPeriod: VisitorPeriod) => {
    setPeriod(newPeriod);
    startTransition(() => {
      loadData(newPeriod, domainFilter);
    });
  };

  const handleDomainChange = (newDomain: string) => {
    setDomainFilter(newDomain);
    startTransition(() => {
      loadData(period, newDomain);
    });
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
          <div className="h-32 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
          <div className="h-32 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
          <div className="h-32 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
        </div>
        <div className="h-72 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
        <div className="text-rose-400 font-medium text-sm">Failed to retrieve visitor traffic analytics</div>
        <div className="text-xs text-[var(--color-text-secondary,#94A3B8)] font-mono">{error}</div>
        <button
          onClick={() => loadData()}
          className="px-3 py-1.5 rounded bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { overview, surfaces, timeSeries, geographicDistribution, clientDemographics, availableDomains } = data;

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary,#FFFFFF)]">
              Domain Visitors & Traffic
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-1">
            Real-time domain visitor counts, landing page telemetry, GX instant-scan conversion velocity, and documentation engagement.
          </p>
        </div>

        {/* Global Filters: Domain Selector & Period Toggle */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Domain Dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--color-text-muted,#64748B)]" />
            <select
              value={domainFilter}
              onChange={(e) => handleDomainChange(e.target.value)}
              aria-label="Filter domain traffic"
              className="bg-transparent text-xs font-mono text-[var(--color-text-primary,#FFFFFF)] focus:outline-none cursor-pointer"
            >
              {availableDomains.map((dom) => (
                <option key={dom} value={dom} className="bg-[var(--color-bg-base,#0B0F17)] text-[var(--color-text-primary,#FFFFFF)]">
                  {dom === 'all' ? 'All Monitored Domains' : dom}
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Filter Pills */}
          <div className="flex items-center bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] rounded-lg p-0.5">
            {(['24h', '7d', '30d', 'all'] as VisitorPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-[var(--color-text-secondary,#94A3B8)] hover:text-white'
                }`}
              >
                {p === '24h' ? 'Today (24h)' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-[var(--color-text-secondary,#94A3B8)] hover:text-white hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
            title="Refresh visitor metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 01 PRIMARY METRICS CARDS */}
      <section aria-labelledby="section-visitor-kpis" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">01</span>
          <h2 id="section-visitor-kpis" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Visitor Volume & Traffic Footprint
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Platform Visitors */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Total Unique Visitors</span>
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)] mt-2">
              {overview.totalUniqueVisitors.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-hairline,rgba(255,255,255,0.05))] text-[10px]">
              <span className="text-[var(--color-text-secondary,#94A3B8)]">{overview.totalPageviews.toLocaleString()} Page Impressions</span>
              <span className="font-mono text-emerald-400 font-medium">● {overview.activeVisitorsNow} Active Now</span>
            </div>
          </div>

          {/* Card 2: Landing Page Traffic */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Landing Page Traffic</span>
              <Compass className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-sky-400 mt-2">
              {surfaces.landing.uniqueVisitors.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-hairline,rgba(255,255,255,0.05))] text-[10px]">
              <span className="text-[var(--color-text-secondary,#94A3B8)]">{surfaces.landing.pageviews.toLocaleString()} Views</span>
              <span className="font-mono text-cyan-400 font-medium">{surfaces.landing.ctaClicks.scanDomain} Scans Started</span>
            </div>
          </div>

          {/* Card 3: GX Traffic & Conversion */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Guest Experience (GX)</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-amber-400 mt-2 flex items-center justify-between">
              <span>{surfaces.guestExperience.totalVisitors.toLocaleString()}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans font-medium">
                {surfaces.guestExperience.conversionRatePercentage}% Conv
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-hairline,rgba(255,255,255,0.05))] text-[10px]">
              <span className="text-[var(--color-text-secondary,#94A3B8)]">{surfaces.guestExperience.activeGuestSessions} Active Guests</span>
              <span className="font-mono text-purple-400 font-medium">{surfaces.guestExperience.conversionsToRegistered} Accounts Converted</span>
            </div>
          </div>

          {/* Card 4: Documentation (Docs) */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Docs & Knowledge</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-emerald-400 mt-2">
              {surfaces.docs.pageviews.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-hairline,rgba(255,255,255,0.05))] text-[10px]">
              <span className="text-[var(--color-text-secondary,#94A3B8)]">{surfaces.docs.uniqueVisitors.toLocaleString()} Unique Readers</span>
              <span className="font-mono text-emerald-400 font-medium">{surfaces.docs.searchQueriesCount} Searches</span>
            </div>
          </div>
        </div>
      </section>

      {/* 02 DEEP SURFACE INSPECTION & CONVERSION FUNNELS */}
      <section aria-labelledby="section-surface-breakdown" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">02</span>
            <h2 id="section-surface-breakdown" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Granular Surface Breakdown & Conversion Funnel
            </h2>
          </div>

          {/* Surface Sub-navigation */}
          <div className="flex items-center gap-1 bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] rounded-lg p-1">
            <button
              onClick={() => setSurfaceTab('gx')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                surfaceTab === 'gx'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-[var(--color-text-secondary,#94A3B8)] hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>GX & Conversion</span>
            </button>
            <button
              onClick={() => setSurfaceTab('landing')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                surfaceTab === 'landing'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'text-[var(--color-text-secondary,#94A3B8)] hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Landing Page</span>
            </button>
            <button
              onClick={() => setSurfaceTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                surfaceTab === 'docs'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-[var(--color-text-secondary,#94A3B8)] hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Documentation</span>
            </button>
            <button
              onClick={() => setSurfaceTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                surfaceTab === 'all'
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                  : 'text-[var(--color-text-secondary,#94A3B8)] hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All Surfaces</span>
            </button>
          </div>
        </div>

        {/* Tab 1: GX & Conversion Funnel */}
        {surfaceTab === 'gx' && (
          <div className="space-y-4">
            {/* Visual 5-Stage Conversion Funnel */}
            <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-primary,#FFFFFF)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Guest Experience (GX) Instant-Scan Conversion Funnel
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-0.5">
                    End-to-end journey from guest visitor landing on /guest to claiming and registering a full workspace tenant account.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-semibold text-emerald-400">
                    {surfaces.guestExperience.conversionRatePercentage}%
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted,#64748B)]">Overall GX Conversion Rate</div>
                </div>
              </div>

              {/* 5-Stage Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                {/* Stage 1 */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-amber-500/20 relative">
                  <div className="text-[10px] font-mono text-amber-400 font-semibold">STAGE 01</div>
                  <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)] mt-1">GX Landing Visit</div>
                  <div className="text-xl font-mono font-semibold text-amber-400 mt-2">
                    {surfaces.guestExperience.funnel.stage1LandingVisits.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted,#64748B)] mt-1">100% Top of Funnel</div>
                </div>

                {/* Stage 2 */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-sky-500/20 relative">
                  <div className="text-[10px] font-mono text-sky-400 font-semibold">STAGE 02</div>
                  <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)] mt-1">Domain Submitted</div>
                  <div className="text-xl font-mono font-semibold text-sky-400 mt-2">
                    {surfaces.guestExperience.funnel.stage2DomainEntered.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-sky-400/80 mt-1">
                    {surfaces.guestExperience.funnel.stage1LandingVisits > 0
                      ? `${Math.round((surfaces.guestExperience.funnel.stage2DomainEntered / surfaces.guestExperience.funnel.stage1LandingVisits) * 100)}% Pass-through`
                      : '0%'}
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-blue-500/20 relative">
                  <div className="text-[10px] font-mono text-blue-400 font-semibold">STAGE 03</div>
                  <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)] mt-1">Brief Generated</div>
                  <div className="text-xl font-mono font-semibold text-blue-400 mt-2">
                    {surfaces.guestExperience.funnel.stage3BriefGenerated.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-blue-400/80 mt-1">
                    {surfaces.guestExperience.funnel.stage2DomainEntered > 0
                      ? `${Math.round((surfaces.guestExperience.funnel.stage3BriefGenerated / surfaces.guestExperience.funnel.stage2DomainEntered) * 100)}% Success`
                      : '0%'}
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-purple-500/20 relative">
                  <div className="text-[10px] font-mono text-purple-400 font-semibold">STAGE 04</div>
                  <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)] mt-1">Claim CTA Clicked</div>
                  <div className="text-xl font-mono font-semibold text-purple-400 mt-2">
                    {surfaces.guestExperience.funnel.stage4ClaimCtaClicked.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-purple-400/80 mt-1">
                    {surfaces.guestExperience.funnel.stage3BriefGenerated > 0
                      ? `${Math.round((surfaces.guestExperience.funnel.stage4ClaimCtaClicked / surfaces.guestExperience.funnel.stage3BriefGenerated) * 100)}% Intent`
                      : '0%'}
                  </div>
                </div>

                {/* Stage 5 */}
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 relative">
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">STAGE 05</div>
                  <div className="text-xs font-medium text-emerald-300 mt-1">Account Created</div>
                  <div className="text-xl font-mono font-semibold text-emerald-400 mt-2">
                    {surfaces.guestExperience.funnel.stage5AccountCreated.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium mt-1">
                    {surfaces.guestExperience.conversionRatePercentage}% Final Converted
                  </div>
                </div>
              </div>
            </div>

            {/* Top Scanned Domains Table */}
            <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                Top Domains Analyzed in Guest Experience
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border-hairline,rgba(255,255,255,0.08))] text-[var(--color-text-muted,#64748B)] font-mono">
                      <th className="py-2 px-3">Domain Name</th>
                      <th className="py-2 px-3">Total Scans</th>
                      <th className="py-2 px-3">Popularity Share</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.05))]">
                    {surfaces.guestExperience.topScannedDomains.map((item, idx) => {
                      const maxCount = surfaces.guestExperience.topScannedDomains[0]?.count || 1;
                      const sharePct = Math.round((item.count / maxCount) * 100);
                      return (
                        <tr key={item.domain} className="hover:bg-[var(--color-bg-elevated,#1E293B)]/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-[var(--color-text-primary,#FFFFFF)] flex items-center gap-2">
                            <span className="text-[10px] text-[var(--color-text-muted,#64748B)]">0{idx + 1}</span>
                            <span>{item.domain}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-400">{item.count.toLocaleString()}</td>
                          <td className="py-2.5 px-3 w-48">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${sharePct}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-[var(--color-text-secondary,#94A3B8)]">{sharePct}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Landing Page Marketing & CTA Telemetry */}
        {surfaceTab === 'landing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CTA Clicks Breakdown */}
            <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
                <MousePointerClick className="w-3.5 h-3.5 text-sky-400" />
                Landing Page Call-to-Action (CTA) Engagement
              </h3>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)]">Primary CTA: "Instant Domain Scan"</div>
                    <div className="text-[10px] text-[var(--color-text-muted,#64748B)] mt-0.5">Hero input search action</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-cyan-400">{surfaces.landing.ctaClicks.scanDomain} clicks</div>
                    <div className="text-[10px] text-emerald-400">High intent</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)]">Secondary CTA: "Sign Up / Create Account"</div>
                    <div className="text-[10px] text-[var(--color-text-muted,#64748B)] mt-0.5">Direct onboarding click</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-purple-400">{surfaces.landing.ctaClicks.signUp} clicks</div>
                    <div className="text-[10px] text-purple-400">Direct registration</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)]">Nav CTA: "Explore Documentation"</div>
                    <div className="text-[10px] text-[var(--color-text-muted,#64748B)] mt-0.5">Developer exploration</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-emerald-400">{surfaces.landing.ctaClicks.exploreDocs} clicks</div>
                    <div className="text-[10px] text-emerald-400">Knowledge referral</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Referrers */}
            <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Top Landing Page Traffic Referrers
              </h3>

              <div className="space-y-2.5">
                {surfaces.landing.topReferrers.map((ref) => (
                  <div key={ref.referrer} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[var(--color-text-primary,#FFFFFF)] truncate max-w-[200px]">{ref.referrer}</span>
                      <span className="font-mono text-[var(--color-text-secondary,#94A3B8)]">{ref.count} visits ({ref.percentage}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full" style={{ width: `${ref.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Documentation Engagement */}
        {surfaceTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Doc Sections */}
            <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Most Read Documentation Sections
              </h3>

              <div className="space-y-3">
                {surfaces.docs.topSections.map((sec) => (
                  <div key={sec.path} className="p-3 rounded-lg bg-[var(--color-bg-base,#0B0F17)] border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--color-text-primary,#FFFFFF)]">{sec.section}</span>
                      <span className="font-mono text-emerald-400">{sec.views} views</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted,#64748B)] font-mono">
                      <span>{sec.path}</span>
                      <span>{sec.percentage}% of docs traffic</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${sec.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Search Keywords in Docs */}
            <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                Popular Developer Search Queries in Docs
              </h3>

              <div className="space-y-2">
                {surfaces.docs.topSearchKeywords.map((kw, idx) => (
                  <div key={kw.keyword} className="p-2.5 rounded bg-[var(--color-bg-base,#0B0F17)] border border-[var(--color-border-hairline,rgba(255,255,255,0.05))] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">0{idx + 1}</span>
                      <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">"{kw.keyword}"</span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400">{kw.count} queries</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: All Platform Surfaces Overview */}
        {surfaceTab === 'all' && (
          <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              All Platform Surfaces & Route Distribution
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-hairline,rgba(255,255,255,0.08))] text-[var(--color-text-muted,#64748B)] font-mono">
                    <th className="py-2 px-3">Surface</th>
                    <th className="py-2 px-3">Route Prefix</th>
                    <th className="py-2 px-3">Page Impressions</th>
                    <th className="py-2 px-3">Unique Visitors</th>
                    <th className="py-2 px-3">Traffic Share</th>
                    <th className="py-2 px-3 text-right">Avg Time on Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.05))]">
                  {surfaces.allSurfaces.map((s) => (
                    <tr key={s.surfaceId} className="hover:bg-[var(--color-bg-elevated,#1E293B)]/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[var(--color-text-primary,#FFFFFF)]">{s.label}</td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-text-muted,#64748B)]">{s.pathPrefix}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-400">{s.pageviews.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-text-primary,#FFFFFF)]">{s.uniqueVisitors.toLocaleString()}</td>
                      <td className="py-2.5 px-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.percentageOfTotal}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-[var(--color-text-secondary,#94A3B8)]">{s.percentageOfTotal}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--color-text-secondary,#94A3B8)]">
                        {Math.floor(s.avgTimeOnPageSeconds / 60)}m {s.avgTimeOnPageSeconds % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 03 TIME SERIES ACTIVITY TRENDS */}
      <section aria-labelledby="section-timeseries" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">03</span>
          <h2 id="section-timeseries" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Traffic Activity Over Time ({period === '24h' ? '24 Hours Hourly' : period === '7d' ? '7 Days Daily' : '30 Days'})
          </h2>
        </div>

        <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-sky-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Landing Page
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Guest Experience (GX)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Docs
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">
              Peak: {Math.max(...timeSeries.map((p) => p.pageviews), 1)} pageviews/interval
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            {timeSeries.map((pt, idx) => {
              const maxViews = Math.max(...timeSeries.map((p) => p.pageviews), 1);
              const heightPct = Math.max((pt.pageviews / maxViews) * 100, 6);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 rounded bg-[var(--color-bg-base,#0B0F17)] border border-white/20 text-[10px] font-mono z-20 pointer-events-none whitespace-nowrap shadow-xl">
                    <div className="text-white font-semibold">{pt.label}</div>
                    <div className="text-sky-400">Landing: {pt.landingVisitors}</div>
                    <div className="text-amber-400">GX: {pt.gxVisitors}</div>
                    <div className="text-emerald-400">Docs: {pt.docsVisitors}</div>
                    <div className="text-white/60 border-t border-white/10 mt-1 pt-1">Total Views: {pt.pageviews}</div>
                  </div>

                  {/* Stacked Bars */}
                  <div
                    className="w-full bg-blue-500/30 hover:bg-blue-500/50 rounded-t transition-all flex flex-col justify-end overflow-hidden"
                    style={{ height: `${heightPct}%` }}
                  >
                    <div className="w-full bg-amber-400/80" style={{ height: `${pt.pageviews > 0 ? (pt.gxVisitors / pt.pageviews) * 100 : 0}%` }} />
                    <div className="w-full bg-sky-400/80" style={{ height: `${pt.pageviews > 0 ? (pt.landingVisitors / pt.pageviews) * 100 : 0}%` }} />
                    <div className="w-full bg-emerald-400/80" style={{ height: `${pt.pageviews > 0 ? (pt.docsVisitors / pt.pageviews) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">
            <span>{timeSeries[0]?.label || 'Start'}</span>
            <span>{timeSeries[Math.floor(timeSeries.length / 2)]?.label || 'Mid'}</span>
            <span>{timeSeries[timeSeries.length - 1]?.label || 'Now'}</span>
          </div>
        </div>
      </section>

      {/* 04 GEOGRAPHIC FOOTPRINT & CLIENT DEMOGRAPHICS */}
      <section aria-labelledby="section-demographics" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">04</span>
          <h2 id="section-demographics" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Geographic Footprint & Client Demographics
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Countries List */}
          <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Top Visitor Geographies
            </h3>

            {geographicDistribution.length > 0 ? (
              <div className="space-y-3">
                {geographicDistribution.map((geo) => (
                  <div key={geo.countryCode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{geo.countryFlag}</span>
                        <span className="font-medium text-[var(--color-text-primary,#FFFFFF)]">{geo.countryName}</span>
                        <span className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">({geo.countryCode})</span>
                      </div>
                      <div className="font-mono text-xs text-[var(--color-text-secondary,#94A3B8)]">
                        {geo.visitors.toLocaleString()} visitors ({geo.percentage}%)
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${geo.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-[var(--color-text-muted,#64748B)]">
                No visitor traffic recorded yet for this period.
              </div>
            )}
          </div>

          {/* Device & Browser Demographics */}
          <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-purple-400" />
              Client Browsers & Device Breakdown
            </h3>

            {clientDemographics.devices.length > 0 ? (
              <>
                {/* Devices */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[var(--color-text-muted,#64748B)]">Device Class</div>
                  <div className="grid grid-cols-3 gap-2">
                    {clientDemographics.devices.map((dev) => (
                      <div key={dev.type} className="p-2.5 rounded bg-[var(--color-bg-base,#0B0F17)] border border-[var(--color-border-hairline,rgba(255,255,255,0.05))] text-center">
                        <div className="flex items-center justify-center mb-1 text-[var(--color-text-secondary,#94A3B8)]">
                          {dev.type === 'Desktop' ? <Laptop className="w-4 h-4" /> : dev.type === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Tablet className="w-4 h-4" />}
                        </div>
                        <div className="text-xs font-medium text-white">{dev.type}</div>
                        <div className="text-[10px] font-mono text-purple-400">{dev.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Browsers */}
                <div className="space-y-2 pt-2 border-t border-[var(--color-border-hairline,rgba(255,255,255,0.05))]">
                  <div className="text-[11px] font-medium text-[var(--color-text-muted,#64748B)]">Web Browsers</div>
                  <div className="space-y-1.5">
                    {clientDemographics.browsers.map((b) => (
                      <div key={b.name} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--color-text-secondary,#94A3B8)]">{b.name}</span>
                        <span className="text-white">{b.count} ({b.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-[var(--color-text-muted,#64748B)]">
                No client browser sessions recorded yet for this period.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
