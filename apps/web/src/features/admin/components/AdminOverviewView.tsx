import React from 'react';
import {
  Users,
  Sparkles,
  ShieldAlert,
  Server,
  ArrowUpRight,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import type { AdminOverviewMetricsDto } from '../api/admin-api';

interface AdminOverviewViewProps {
  data: AdminOverviewMetricsDto | null;
  loading: boolean;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
          <div className="h-44 bg-[var(--color-bg-surface,#111726)] rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.06))]" />
        </div>
      </div>
    );
  }

  const { platform, guestExperience: gx, security, system, geographicDistribution } = data;

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary,#FFFFFF)]">
          Platform Overview
        </h1>
        <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-1">
          Operational posture, population metrics, geographic distribution, guest intelligence, and security state across Nebula.
        </p>
      </div>

      {/* 01 PLATFORM */}
      <section aria-labelledby="section-platform" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">01</span>
          <h2 id="section-platform" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Platform Population
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Total Registered Users</div>
            <div className="text-2xl font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)] mt-2">
              {platform.totalUsers.toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-1">All database identities</div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Active Accounts</div>
            <div className="text-2xl font-mono font-semibold text-emerald-400 mt-2">
              {platform.activeUsers.toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-1">Verified 'ACTIVE' standing</div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Monthly Active (30d MAU)</div>
            <div className="text-2xl font-mono font-semibold text-purple-400 mt-2">
              {(platform.monthlyActiveUsers ?? platform.activeUsers).toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-1">Active within 30 days</div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">Online Right Now</div>
            <div className="text-2xl font-mono font-semibold text-cyan-400 mt-2">
              {(platform.activeNowUsers ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-1">Live active user sessions</div>
          </div>
        </div>

        {/* Secondary Population Indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className="px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-elevated,#1E293B)]/30 border border-[var(--color-border-hairline,rgba(255,255,255,0.05))] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary,#94A3B8)]">New Signups (7 Days)</span>
            <span className="font-mono text-xs font-semibold text-sky-400">+{platform.newUsers.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-elevated,#1E293B)]/30 border border-[var(--color-border-hairline,rgba(255,255,255,0.05))] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary,#94A3B8)]">Pending Verification</span>
            <span className="font-mono text-xs font-semibold text-amber-400">{(platform.pendingVerificationUsers ?? 0).toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-elevated,#1E293B)]/30 border border-[var(--color-border-hairline,rgba(255,255,255,0.05))] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary,#94A3B8)]">Deactivated Accounts</span>
            <span className="font-mono text-xs font-semibold text-[var(--color-text-muted,#64748B)]">{platform.deactivatedUsers.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* 02 GUEST EXPERIENCE (GX INTELLIGENCE) */}
      <section aria-labelledby="section-gx" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">02</span>
            <h2 id="section-gx" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Guest Experience (GX Intelligence)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">Read-Only Analytics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-3">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">GX Sessions & Active Guests</div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)]">
                  {gx.totalGxSessions.toLocaleString()}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)]">Total GX Sessions</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-semibold text-emerald-400">
                  {gx.activeGuests.toLocaleString()}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)]">Active Right Now</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-3">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">GX Understandings & Conversion</div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-mono font-semibold text-purple-400">
                  {gx.gxUnderstandings.toLocaleString()}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)]">Understandings Run</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-semibold text-amber-400 flex items-center justify-end gap-1">
                  <span>{gx.conversionRate}%</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)]">{gx.convertedUsers} Registered</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-2">
            <div className="text-[11px] text-[var(--color-text-muted,#64748B)] font-medium">GX Activity Windows</div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/40 border border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                <div className="text-[10px] text-[var(--color-text-muted,#64748B)]">Today</div>
                <div className="text-sm font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)] mt-0.5">{gx.trend.today}</div>
              </div>
              <div className="p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/40 border border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                <div className="text-[10px] text-[var(--color-text-muted,#64748B)]">7 Days</div>
                <div className="text-sm font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)] mt-0.5">{gx.trend.last7Days}</div>
              </div>
              <div className="p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/40 border border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                <div className="text-[10px] text-[var(--color-text-muted,#64748B)]">30 Days</div>
                <div className="text-sm font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)] mt-0.5">{gx.trend.last30Days}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 GEOGRAPHIC USER FOOTPRINT */}
      {geographicDistribution && geographicDistribution.length > 0 && (
        <section aria-labelledby="section-geo" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">03</span>
              <h2 id="section-geo" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Geographic User Footprint
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">Active Sessions by Country</span>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {geographicDistribution.slice(0, 8).map((item) => (
                <div
                  key={item.countryCode}
                  className="p-3 rounded-md bg-[var(--color-bg-elevated,#1E293B)]/40 border border-[var(--color-border-hairline,rgba(255,255,255,0.04))] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.countryFlag}</span>
                      <div>
                        <div className="text-xs font-medium text-[var(--color-text-primary,#FFFFFF)] truncate max-w-[120px]">
                          {item.countryName}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">
                          {item.countryCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-semibold text-emerald-400">{item.userCount}</div>
                      <div className="text-[10px] text-[var(--color-text-muted,#64748B)]">{item.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--color-bg-surface,#111726)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 04 SECURITY & SYSTEM POSTURE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECURITY */}
        <section aria-labelledby="section-security" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">04</span>
            <h2 id="section-security" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              Security Posture
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))]">
              <div className="text-xs text-[var(--color-text-secondary,#94A3B8)]">Admin Authentication</div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Protected ({security.assuranceLevel})</span>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))]">
              <div className="text-xs text-[var(--color-text-secondary,#94A3B8)]">WebAuthn Passkey Ceremony</div>
              <div className="text-xs font-mono text-emerald-400">{security.webAuthnStatus}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--color-text-secondary,#94A3B8)]">Active Sessions (Admin / User)</div>
              <div className="text-xs font-mono text-[var(--color-text-primary,#FFFFFF)]">
                {security.adminSessions} Admin / {security.userSessions.toLocaleString()} User
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM HEALTH */}
        <section aria-labelledby="section-system" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted,#64748B)]">05</span>
            <h2 id="section-system" className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary,#94A3B8)] flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-sky-400" />
              Platform Infrastructure
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/30">
                <span className="text-[var(--color-text-secondary,#94A3B8)]">API Gateway</span>
                <span className="font-mono text-emerald-400">{system.apiHealth}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/30">
                <span className="text-[var(--color-text-secondary,#94A3B8)]">PostgreSQL</span>
                <span className="font-mono text-emerald-400">{system.databaseHealth}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/30">
                <span className="text-[var(--color-text-secondary,#94A3B8)]">Background Jobs</span>
                <span className="font-mono text-emerald-400">{system.workersHealth}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-elevated,#1E293B)]/30">
                <span className="text-[var(--color-text-secondary,#94A3B8)]">Infrastructure</span>
                <span className="font-mono text-emerald-400">{system.infrastructureHealth}</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)] text-right pt-1">
              Platform Uptime: {Math.floor(system.uptimeSeconds / 3600)}h {Math.floor((system.uptimeSeconds % 3600) / 60)}m
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
