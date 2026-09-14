import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Shield,
} from 'lucide-react';
import { adminApi, type AdminPaginatedUsersDto, type AdminUserDetailDto } from '../api/admin-api';

export const AdminUsersView: React.FC = () => {
  const [data, setData] = useState<AdminPaginatedUsersDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Disable Action State
  const [userToDisable, setUserToDisable] = useState<{ id: string; email: string } | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const [disabling, setDisabling] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        limit: 15,
        search,
        status: statusFilter,
        country: countryFilter || undefined,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, countryFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setUserDetail(null);
    setLoadingDetail(true);
    try {
      const res = await adminApi.getUserDetail(userId);
      setUserDetail(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmDisable = async () => {
    if (!userToDisable) return;
    setDisabling(true);
    try {
      await adminApi.disableUser(userToDisable.id, disableReason || 'Administrative account disable');
      setUserToDisable(null);
      setDisableReason('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setDisabling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary,#FFFFFF)]">
            User Directory
          </h1>
          <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-1">
            Server-side paginated population directory, geographic metadata, and administrative account control.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted,#64748B)]" />
            <input
              type="text"
              placeholder="Search email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-md bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] placeholder-[var(--color-text-muted,#64748B)] focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-md bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-blue-500"
          >
            <option value="">All Countries</option>
            <option value="US">🇺🇸 United States</option>
            <option value="IN">🇮🇳 India</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="DE">🇩🇪 Germany</option>
            <option value="CA">🇨🇦 Canada</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="FR">🇫🇷 France</option>
            <option value="JP">🇯🇵 Japan</option>
            <option value="SG">🇸🇬 Singapore</option>
            <option value="NL">🇳🇱 Netherlands</option>
            <option value="LOCAL">🌐 Local / Dev</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-md bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] bg-[var(--color-bg-surface,#111726)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/40 text-[var(--color-text-muted,#64748B)] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Country / Region</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Domains</th>
                <th className="py-3 px-4">Active Sessions</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted,#64748B)]">
                    Loading users...
                  </td>
                </tr>
              ) : !data || data.users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted,#64748B)]">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-bg-elevated,#1E293B)]/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--color-text-primary,#FFFFFF)]">{user.email}</div>
                      {user.name && <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)]">{user.name}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary,#FFFFFF)]">
                        <span className="text-sm" title={user.countryName || 'Location'}>{user.countryFlag || '🌐'}</span>
                        <span className="text-xs">{user.countryName || user.countryCode || 'Local / Dev'}</span>
                      </div>
                      {user.lastIpAddress && (
                        <div className="text-[10px] font-mono text-[var(--color-text-muted,#64748B)]">{user.lastIpAddress}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--color-text-secondary,#94A3B8)]">
                      {user.domainsCount}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--color-text-secondary,#94A3B8)]">
                      {user.activeSessionsCount}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(user.id)}
                          className="p-1 rounded text-[var(--color-text-secondary,#94A3B8)] hover:text-[var(--color-text-primary,#FFFFFF)] hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
                          title="View user details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {user.status === 'ACTIVE' && (
                          <button
                            onClick={() => setUserToDisable({ id: user.id, email: user.email })}
                            className="p-1 rounded text-[var(--color-text-secondary,#94A3B8)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Disable user account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
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
              Showing <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{data.users.length}</span> of{' '}
              <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{data.total}</span> users
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

      {/* User Detail Drawer / Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.12))] rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary,#FFFFFF)]">User Account Detail</h3>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-[var(--color-text-muted,#64748B)] hover:text-[var(--color-text-primary,#FFFFFF)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail || !userDetail ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted,#64748B)]">Loading detail...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">User ID</span>
                  <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{userDetail.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">Email</span>
                  <span className="font-medium text-[var(--color-text-primary,#FFFFFF)]">{userDetail.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">Country / Region</span>
                  <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary,#FFFFFF)]">
                    <span>{userDetail.countryFlag || '🌐'}</span>
                    <span>{userDetail.countryName || userDetail.countryCode || 'Local / Dev'}</span>
                  </span>
                </div>
                {userDetail.lastIpAddress && (
                  <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                    <span className="text-[var(--color-text-secondary,#94A3B8)]">Last Known IP</span>
                    <span className="font-mono text-[var(--color-text-secondary,#94A3B8)]">{userDetail.lastIpAddress}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">Status</span>
                  <span className="font-mono text-emerald-400">{userDetail.status}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">Auth Providers</span>
                  <span className="font-mono text-[var(--color-text-secondary,#94A3B8)]">
                    {userDetail.authProviders.join(', ') || 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.04))]">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">Domains Owned</span>
                  <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{userDetail.domainsCount}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[var(--color-text-secondary,#94A3B8)]">Active Sessions</span>
                  <span className="font-mono text-[var(--color-text-primary,#FFFFFF)]">{userDetail.activeSessionsCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disable Account Confirmation Modal */}
      {userToDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface,#111726)] border border-rose-500/20 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Disable User Account</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary,#94A3B8)]">
              This will deactivate <span className="font-medium text-[var(--color-text-primary,#FFFFFF)]">{userToDisable.email}</span> and immediately terminate all their active sessions.
            </p>
            <div>
              <label className="text-[11px] text-[var(--color-text-muted,#64748B)] block mb-1">
                Reason for Audit Log:
              </label>
              <input
                type="text"
                placeholder="e.g. Terms of Service violation"
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[var(--color-bg-elevated,#1E293B)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={disabling}
                onClick={() => setUserToDisable(null)}
                className="px-3 py-1.5 rounded text-xs text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={disabling}
                onClick={handleConfirmDisable}
                className="px-3 py-1.5 rounded text-xs font-medium bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-colors"
              >
                {disabling ? 'Disabling...' : 'Confirm Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
