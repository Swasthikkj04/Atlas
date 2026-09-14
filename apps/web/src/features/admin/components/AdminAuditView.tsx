import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Hash,
} from 'lucide-react';
import {
  adminApi,
  type AdminPaginatedAuditDto,
  type AdminAuditChainVerificationResultDto,
} from '../api/admin-api';

export const AdminAuditView: React.FC = () => {
  const [data, setData] = useState<AdminPaginatedAuditDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [chainVerification, setChainVerification] =
    useState<AdminAuditChainVerificationResultDto | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAudit({
        page,
        limit: 20,
        action: actionFilter,
        outcome: outcomeFilter,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, outcomeFilter]);

  const verifyChainIntegrity = async () => {
    setVerifyingChain(true);
    try {
      const res = await adminApi.verifyAuditChainIntegrity();
      setChainVerification(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingChain(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary,#FFFFFF)]">
            Audit Log & Hash Chain
          </h1>
          <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-1">
            Read-only immutable record of administrative actions with SHA-256 cryptographic chaining.
          </p>
        </div>

        {/* Chain Verification & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={verifyChainIntegrity}
            disabled={verifyingChain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-400 font-medium transition-colors"
          >
            {verifyingChain ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>Verify Chain Integrity</span>
          </button>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-md bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-blue-500"
          >
            <option value="">All Actions</option>
            <option value="USER_DISABLED">USER_DISABLED</option>
            <option value="ADMIN_SESSION_REVOKED">ADMIN_SESSION_REVOKED</option>
            <option value="USER_SESSION_REVOKED">USER_SESSION_REVOKED</option>
            <option value="ADMIN_AUTHORIZATION_GRANTED">ADMIN_AUTHORIZATION_GRANTED</option>
            <option value="ADMIN_AUTHORIZATION_DENIED">ADMIN_AUTHORIZATION_DENIED</option>
            <option value="CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT">CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT</option>
            <option value="SUSPICIOUS_AUTHENTICATION_BURST">SUSPICIOUS_AUTHENTICATION_BURST</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-md bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-blue-500"
          >
            <option value="">All Outcomes</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
          </select>
        </div>
      </div>

      {/* Cryptographic Hash Chain Status Banner */}
      {chainVerification && (
        <div
          className={`p-4 rounded-lg border text-xs ${
            chainVerification.valid
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {chainVerification.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {chainVerification.valid
                ? `Cryptographic SHA-256 Chain Intact: ${chainVerification.totalEventsVerified} events verified from genesis.`
                : `Chain Tamper Alert: Broken linkage detected at index ${chainVerification.brokenIndex}!`}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px] opacity-80">
            <div className="flex items-center gap-1 overflow-hidden">
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Genesis: {chainVerification.genesisHash}</span>
            </div>
            <div className="flex items-center gap-1 overflow-hidden">
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tip: {chainVerification.latestHash}</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Table */}
      <div className="rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] bg-[var(--color-bg-surface,#111726)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/40 text-[var(--color-text-muted,#64748B)] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--color-text-muted,#64748B)]">
                    Loading audit events...
                  </td>
                </tr>
              ) : !data || data.events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--color-text-muted,#64748B)]">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                data.events.map((event) => (
                  <tr key={event.id} className="hover:bg-[var(--color-bg-elevated,#1E293B)]/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[var(--color-text-primary,#FFFFFF)]">
                      {event.action}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-secondary,#94A3B8)]">
                      {event.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--color-text-secondary,#94A3B8)]">
                      {event.targetType ? `${event.targetType}:${event.targetId?.slice(0, 8) || ''}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                          event.outcome === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {event.outcome === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{event.outcome}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--color-text-muted,#64748B)]">
                      <div className="flex items-center gap-1.5">
                        <span title={event.countryName || 'Location'}>{event.countryFlag || '🌐'}</span>
                        <span>{event.ipAddress || '127.0.0.1'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--color-border-hairline,rgba(255,255,255,0.06))] flex items-center justify-between text-xs text-[var(--color-text-secondary,#94A3B8)]">
            <div>
              Showing <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{data.events.length}</span> of{' '}
              <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{data.total}</span> audit records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] disabled:opacity-30 hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs">
                {page} / {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] disabled:opacity-30 hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
