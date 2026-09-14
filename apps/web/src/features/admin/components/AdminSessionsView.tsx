import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Shield,
  Trash2,
  AlertOctagon,
  RefreshCw,
  Layers,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { adminApi, type AdminSessionsOverviewDto, type AdminSessionPresenceSummaryDto } from '../api/admin-api';

export const AdminSessionsView: React.FC = () => {
  const [data, setData] = useState<AdminSessionsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSessions();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string, type: 'ADMIN' | 'USER') => {
    setActionInProgress(true);
    try {
      await adminApi.revokeSession(sessionId, type);
      fetchSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRevokeAllOtherAdminSessions = async () => {
    setActionInProgress(true);
    try {
      await adminApi.revokeAllOtherAdminSessions();
      fetchSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  };

  const renderPresenceBadge = (presence?: AdminSessionPresenceSummaryDto) => {
    if (!presence || presence.tabs.length === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Offline
        </span>
      );
    }

    if (presence.isOnline) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Online ({presence.activeTabsCount} {presence.activeTabsCount === 1 ? 'tab' : 'tabs'}
          {presence.hiddenTabsCount > 0 ? `, ${presence.hiddenTabsCount} hidden` : ''})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Tabs Closed ({presence.closedTabsCount})
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary,#FFFFFF)]">
            Session Management
          </h1>
          <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-1">
            Authoritative session control and cryptographic invalidation for Admin and User identities.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] text-xs text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-surface,#111726)] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ADMIN-003 Invariant Informational Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[var(--color-text-primary,#FFFFFF)]">
            Browser Presence Telemetry Policy:
          </span>{' '}
          Browser tab visibility and presence are best-effort observational telemetry. Closing a browser tab reports{' '}
          <code className="text-[11px] px-1 py-0.5 rounded bg-blue-900/30 text-blue-200">SESSION_TAB_CLOSED</code> but
          never revokes the underlying security session (
          <span className="font-mono font-medium">SESSION_TAB_CLOSED ≠ SESSION_REVOKED</span>).
        </div>
      </div>

      {/* 1. Admin Sessions */}
      <section aria-labelledby="section-admin-sessions" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 id="section-admin-sessions" className="text-sm font-semibold text-[var(--color-text-primary,#FFFFFF)]">
              Admin Sessions
            </h2>
          </div>

          {data && data.adminSessions.length > 1 && (
            <button
              disabled={actionInProgress}
              onClick={handleRevokeAllOtherAdminSessions}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Revoke All Other Admin Sessions</span>
            </button>
          )}
        </div>

        <div className="rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] bg-[var(--color-bg-surface,#111726)] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/40 text-[var(--color-text-muted,#64748B)] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Presence</th>
                <th className="py-3 px-4">Assurance Level</th>
                <th className="py-3 px-4">IP / User Agent</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted,#64748B)]">
                    Loading admin sessions...
                  </td>
                </tr>
              ) : !data || data.adminSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted,#64748B)]">
                    No active admin sessions.
                  </td>
                </tr>
              ) : (
                data.adminSessions.map((session) => {
                  const isCurrent = session.id === data.currentSessionId;
                  const isExpanded = !!expandedSessions[session.id];
                  const hasTabs = session.presence && session.presence.tabs.length > 0;

                  return (
                    <React.Fragment key={session.id}>
                      <tr
                        className={`${
                          isCurrent
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'hover:bg-[var(--color-bg-elevated,#1E293B)]/20'
                        } transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {hasTabs && (
                              <button
                                onClick={() => toggleSessionExpanded(session.id)}
                                className="p-0.5 text-[var(--color-text-muted,#64748B)] hover:text-[var(--color-text-primary,#FFFFFF)]"
                                title="Toggle tab details"
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">
                              {session.id.slice(0, 8)}...
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Current
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {renderPresenceBadge(session.presence)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {session.assuranceLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-secondary,#94A3B8)]">
                          <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary,#FFFFFF)]">
                            <span>{session.countryFlag || '🌐'}</span>
                            <span>{session.countryName || session.countryCode || 'Local / Dev'}</span>
                          </div>
                          <div className="font-mono text-[11px] text-[var(--color-text-secondary,#94A3B8)] mt-0.5">
                            {session.ipAddress || '127.0.0.1'}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted,#64748B)] truncate max-w-xs">
                            {session.userAgent || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">
                          {new Date(session.lastActiveAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">
                          {new Date(session.expiresAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isCurrent && (
                            <button
                              disabled={actionInProgress}
                              onClick={() => handleRevokeSession(session.id, 'ADMIN')}
                              className="p-1.5 rounded text-[var(--color-text-secondary,#94A3B8)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Revoke session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasTabs && (
                        <tr className="bg-[var(--color-bg-surface-sunken,#0A0E17)]/60">
                          <td colSpan={7} className="py-2.5 px-8">
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#64748B)] flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                Browser Tabs ({session.presence?.tabs.length})
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {session.presence?.tabs.map((tab) => (
                                  <div
                                    key={tab.tabInstanceId}
                                    className="p-2 rounded border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/30 text-[11px]"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-[var(--color-text-secondary,#94A3B8)] truncate max-w-[140px]">
                                        {tab.tabInstanceId}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                                          tab.status === 'active'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : tab.status === 'hidden'
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'bg-slate-500/20 text-slate-400'
                                        }`}
                                      >
                                        {tab.status}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-[var(--color-text-muted,#64748B)] mt-1 flex items-center justify-between">
                                      <span>Signal: {tab.lastPresenceSignal}</span>
                                      <span>{new Date(tab.lastSeenAt).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. User Sessions */}
      <section aria-labelledby="section-user-sessions" className="space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-400" />
          <h2 id="section-user-sessions" className="text-sm font-semibold text-[var(--color-text-primary,#FFFFFF)]">
            Active User Sessions ({data ? data.userSessionsCount : 0})
          </h2>
        </div>

        <div className="rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] bg-[var(--color-bg-surface,#111726)] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/40 text-[var(--color-text-muted,#64748B)] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">Presence</th>
                <th className="py-3 px-4">Country / Region</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted,#64748B)]">
                    Loading user sessions...
                  </td>
                </tr>
              ) : !data || data.userSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted,#64748B)]">
                    No active user sessions.
                  </td>
                </tr>
              ) : (
                data.userSessions.map((session) => {
                  const isExpanded = !!expandedSessions[session.id];
                  const hasTabs = session.presence && session.presence.tabs.length > 0;

                  return (
                    <React.Fragment key={session.id}>
                      <tr key={session.id} className="hover:bg-[var(--color-bg-elevated,#1E293B)]/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {hasTabs && (
                              <button
                                onClick={() => toggleSessionExpanded(session.id)}
                                className="p-0.5 text-[var(--color-text-muted,#64748B)] hover:text-[var(--color-text-primary,#FFFFFF)]"
                                title="Toggle tab details"
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <span className="font-medium text-[var(--color-text-primary,#FFFFFF)]">
                              {session.userEmail}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {renderPresenceBadge(session.presence)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary,#FFFFFF)]">
                            <span>{session.countryFlag || '🌐'}</span>
                            <span>{session.countryName || session.countryCode || 'Local / Dev'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[var(--color-text-secondary,#94A3B8)]">
                          {session.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">
                          {new Date(session.expiresAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={actionInProgress}
                            onClick={() => handleRevokeSession(session.id, 'USER')}
                            className="p-1.5 rounded text-[var(--color-text-secondary,#94A3B8)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Revoke user session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && hasTabs && (
                        <tr className="bg-[var(--color-bg-surface-sunken,#0A0E17)]/60">
                          <td colSpan={7} className="py-2.5 px-8">
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#64748B)] flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                Browser Tabs ({session.presence?.tabs.length})
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {session.presence?.tabs.map((tab) => (
                                  <div
                                    key={tab.tabInstanceId}
                                    className="p-2 rounded border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/30 text-[11px]"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-[var(--color-text-secondary,#94A3B8)] truncate max-w-[140px]">
                                        {tab.tabInstanceId}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                                          tab.status === 'active'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : tab.status === 'hidden'
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'bg-slate-500/20 text-slate-400'
                                        }`}
                                      >
                                        {tab.status}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-[var(--color-text-muted,#64748B)] mt-1 flex items-center justify-between">
                                      <span>Signal: {tab.lastPresenceSignal}</span>
                                      <span>{new Date(tab.lastSeenAt).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
