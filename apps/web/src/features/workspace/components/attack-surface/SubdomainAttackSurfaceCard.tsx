import React, { useState } from 'react';
import {
  getEnvironmentColorClass,
  getTakeoverRiskColorClass,
  type DiscoveredSubdomainDto,
  type SubdomainPerimeterReportDto,
} from '../../contracts/subdomain-attack-surface.contract';

interface SubdomainAttackSurfaceCardProps {
  readonly report?: SubdomainPerimeterReportDto;
  readonly onScanRequested?: () => Promise<void>;
  readonly isScanning?: boolean;
  readonly className?: string;
}

export const SubdomainAttackSurfaceCard: React.FC<SubdomainAttackSurfaceCardProps> = ({
  report,
  onScanRequested,
  isScanning = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('ALL');

  const subdomains = report?.subdomains || [];
  const totalCount = report?.totalDiscovered ?? subdomains.length;
  const criticalRisks = report?.takeoverRisksSummary?.CRITICAL || 0;
  const highRisks = report?.takeoverRisksSummary?.HIGH || 0;
  const nonProdCount =
    (report?.environmentsSummary?.STAGING || 0) +
    (report?.environmentsSummary?.DEVELOPMENT || 0) +
    (report?.environmentsSummary?.INTERNAL || 0);

  const filteredSubdomains = subdomains.filter((sub) => {
    const matchesSearch =
      sub.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.subdomainPrefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ipAddresses.some((ip) => ip.includes(searchQuery)) ||
      sub.cnameTargets.some((cn) => cn.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEnv =
      selectedEnvironment === 'ALL' || sub.environmentType === selectedEnvironment;

    return matchesSearch && matchesEnv;
  });

  return (
    <div
      data-testid="subdomain-attack-surface-card"
      className={`rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              Attack Surface &amp; Subdomain Perimeter
            </h4>
            <p className="text-[11px] text-slate-400">
              Active perimeter expansion, cloud takeover analysis &amp; environment classification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onScanRequested && (
            <button
              type="button"
              disabled={isScanning}
              onClick={() => onScanRequested()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enumerating...
                </>
              ) : (
                'Enumerate Perimeter'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400">Discovered Assets</div>
          <div data-testid="total-subdomains-count" className="mt-1 text-lg font-bold text-slate-100">
            {totalCount}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400">Non-Prod Exposure</div>
          <div className="mt-1 text-lg font-bold text-amber-400">
            {nonProdCount} <span className="text-[11px] font-normal text-slate-400">dev/stage/int</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400">Takeover Vulnerabilities</div>
          <div
            data-testid="takeover-risks-count"
            className={`mt-1 text-lg font-bold ${
              criticalRisks > 0 ? 'text-rose-400' : highRisks > 0 ? 'text-orange-400' : 'text-emerald-400'
            }`}
          >
            {criticalRisks + highRisks}
            {criticalRisks > 0 && (
              <span className="ml-1.5 text-[10px] font-medium text-rose-400 uppercase tracking-wider">
                Critical
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400">Wildcard DNS</div>
          <div className="mt-1 text-sm font-semibold text-slate-300">
            {report?.wildcardDetected ? (
              <span className="text-amber-400">Active ({report.wildcardIps.length} IPs)</span>
            ) : (
              <span className="text-emerald-400">Disabled (Clean)</span>
            )}
          </div>
        </div>
      </div>

      {/* Wildcard Alert Banner */}
      {report?.wildcardDetected && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            DNS wildcard detected on <strong>*.{report.domain}</strong>. False-positive filtering is actively preventing synthetic domain collisions.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Filter subdomains, IPs, or CNAME targets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />

        <div className="flex gap-1.5 overflow-x-auto">
          {['ALL', 'PRODUCTION', 'STAGING', 'DEVELOPMENT', 'INTERNAL'].map((env) => (
            <button
              key={env}
              type="button"
              onClick={() => setSelectedEnvironment(env)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                selectedEnvironment === env
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Subdomain Inventory Table */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">Hostname</th>
              <th className="px-3.5 py-2.5">Environment</th>
              <th className="px-3.5 py-2.5">Discovered Via</th>
              <th className="px-3.5 py-2.5">Resolved IP / CNAME</th>
              <th className="px-3.5 py-2.5">TLS</th>
              <th className="px-3.5 py-2.5">Takeover Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filteredSubdomains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-slate-500">
                  {searchQuery || selectedEnvironment !== 'ALL'
                    ? 'No subdomains match the active filter.'
                    : 'No subdomains enumerated yet. Click "Enumerate Perimeter" to begin.'}
                </td>
              </tr>
            ) : (
              filteredSubdomains.map((sub: DiscoveredSubdomainDto) => {
                const envStyle = getEnvironmentColorClass(sub.environmentType);
                const riskStyle = getTakeoverRiskColorClass(sub.takeoverRisk);

                return (
                  <tr key={sub.hostname} className="hover:bg-slate-800/30 transition">
                    <td className="px-3.5 py-2.5 font-mono text-slate-200 font-medium">
                      {sub.hostname}
                      {sub.isWildcard && (
                        <span className="ml-1.5 text-[10px] text-amber-400 font-sans">
                          (wildcard)
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium border ${envStyle.bgClass} ${envStyle.textClass} ${envStyle.borderClass}`}
                      >
                        {sub.environmentType}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-400 text-[11px]">
                      {sub.discoveredVia.replace('_', ' ')}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-300 text-[11px]">
                      {sub.cnameTargets.length > 0 ? (
                        <span className="text-indigo-400" title={`CNAME to ${sub.cnameTargets.join(', ')}`}>
                          CNAME &rarr; {sub.cnameTargets[0]}
                        </span>
                      ) : sub.ipAddresses.length > 0 ? (
                        sub.ipAddresses[0]
                      ) : (
                        <span className="text-slate-500">Unresolved</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {sub.tlsActive ? (
                        <span className="text-emerald-400 text-[11px] font-medium">Secured</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${riskStyle.bgClass} ${riskStyle.textClass} ${riskStyle.borderClass}`}
                        title={sub.takeoverReason || ''}
                      >
                        {sub.takeoverRisk}
                        {sub.takeoverProvider && ` (${sub.takeoverProvider})`}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
