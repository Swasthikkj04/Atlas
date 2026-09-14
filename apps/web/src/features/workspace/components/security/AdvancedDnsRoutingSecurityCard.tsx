import React from 'react';
import {
  evaluateClientAdvancedDnsRouting,
  getDnssecBadgeConfig,
  getCaaBadgeConfig,
  getRpkiBadgeConfig,
} from '../../contracts/advanced-dns-routing-security.contract';

interface AdvancedDnsRoutingSecurityCardProps {
  readonly dnsData?: any;
  readonly sslData?: any;
  readonly routingData?: any;
  readonly className?: string;
}

export const AdvancedDnsRoutingSecurityCard: React.FC<
  AdvancedDnsRoutingSecurityCardProps
> = ({ dnsData, sslData, routingData, className = '' }) => {
  const assessment = evaluateClientAdvancedDnsRouting(
    dnsData,
    sslData,
    routingData,
  );
  const { dnssec, caa, bgpRpki, overallScore, isCompliant } = assessment;

  const dnssecBadge = getDnssecBadgeConfig(dnssec.status);
  const caaBadge = getCaaBadgeConfig(caa);
  const rpkiBadge = getRpkiBadgeConfig(bgpRpki.overallStatus, bgpRpki.hijackRiskDetected);

  return (
    <div
      data-testid="advanced-dns-routing-card"
      className={`rounded-xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Advanced DNSSEC, CAA & BGP Security Intelligence
            </h3>
            <p className="text-xs text-slate-400">
              Cryptographic chain-of-trust, certificate authority authorization & route origin validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Posture Score</div>
            <div
              data-testid="posture-score-value"
              className={`text-lg font-bold ${
                overallScore >= 80
                  ? 'text-emerald-400'
                  : overallScore >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {overallScore}/100
            </div>
          </div>
          <span
            data-testid="posture-compliance-badge"
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
              isCompliant
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isCompliant ? 'Compliant' : 'Gaps Detected'}
          </span>
        </div>
      </div>

      {/* 3-Column Security Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Section 1: DNSSEC */}
        <div
          data-testid="dnssec-section"
          className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-200">DNSSEC Posture</span>
            <span
              data-testid="dnssec-status-badge"
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${dnssecBadge.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dnssecBadge.dotClass}`} />
              {dnssecBadge.label}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Parent DS Record:</span>
              <span
                data-testid="dnssec-has-ds"
                className={dnssec.hasDs ? 'text-emerald-400 font-medium' : 'text-slate-500'}
              >
                {dnssec.hasDs ? 'Published' : 'None'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Zone DNSKEY:</span>
              <span
                data-testid="dnssec-has-dnskey"
                className={dnssec.hasDnskey ? 'text-emerald-400 font-medium' : 'text-slate-500'}
              >
                {dnssec.hasDnskey ? 'Present' : 'None'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>RRSIG Cryptographic Proof:</span>
              <span
                data-testid="dnssec-has-rrsig"
                className={dnssec.hasRrsig ? 'text-emerald-400 font-medium' : 'text-slate-500'}
              >
                {dnssec.hasRrsig ? 'Authenticated' : 'None'}
              </span>
            </div>

            {dnssec.algorithms.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-400">Algorithms:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dnssec.algorithms.map((alg) => (
                    <span
                      key={alg}
                      className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300 border border-slate-700"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dnssec.keyTags.length > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Key Tag(s):</span>
                <span className="font-mono text-slate-300">
                  {dnssec.keyTags.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: CAA Policy */}
        <div
          data-testid="caa-section"
          className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-200">CAA Policy (RFC 8659)</span>
            <span
              data-testid="caa-status-badge"
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${caaBadge.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${caaBadge.dotClass}`} />
              {caaBadge.label}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Authorized Issuers:</span>
              <span className="text-slate-300">
                {caa.authorizedIssuers.length > 0
                  ? caa.authorizedIssuers.length
                  : caa.allowsAllIssuers
                  ? 'All (Unrestricted)'
                  : 'None'}
              </span>
            </div>

            {caa.authorizedIssuers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {caa.authorizedIssuers.map((issuer) => (
                  <span
                    key={issuer}
                    data-testid="caa-authorized-issuer-chip"
                    className="rounded bg-indigo-950/60 px-1.5 py-0.5 text-[11px] text-indigo-300 border border-indigo-800/50"
                  >
                    {issuer}
                  </span>
                ))}
              </div>
            )}

            {caa.wildcardIssuers.length > 0 && (
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Wildcard Issuance:</span>
                <span className="text-slate-300 font-mono">
                  {caa.wildcardIssuers.join(', ')}
                </span>
              </div>
            )}

            {caa.iodefMailbox && (
              <div className="flex justify-between text-slate-400">
                <span>Incident Mailbox (iodef):</span>
                <span className="font-mono text-slate-300 truncate max-w-[150px]">
                  {caa.iodefMailbox}
                </span>
              </div>
            )}

            {sslData?.certificate?.issuer && (
              <div className="pt-2 border-t border-slate-800/60 flex justify-between text-slate-400">
                <span>Active TLS Issuer:</span>
                <span
                  data-testid="caa-tls-permitted"
                  className={`font-medium ${
                    caa.isTlsIssuerPermitted ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {caa.isTlsIssuerPermitted ? 'Permitted' : 'Blocked / Mismatch'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: BGP RPKI ROV */}
        <div
          data-testid="bgp-rpki-section"
          className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-200">BGP RPKI ROV</span>
            <span
              data-testid="rpki-status-badge"
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${rpkiBadge.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${rpkiBadge.dotClass}`} />
              {rpkiBadge.label}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Cryptographic ROA Coverage:</span>
              <span data-testid="rpki-coverage-value" className="font-semibold text-slate-200">
                {bgpRpki.coveragePercentage}%
              </span>
            </div>

            {/* Coverage Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  bgpRpki.coveragePercentage === 100
                    ? 'bg-emerald-500'
                    : bgpRpki.coveragePercentage > 0
                    ? 'bg-amber-500'
                    : 'bg-slate-600'
                }`}
                style={{ width: `${bgpRpki.coveragePercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-slate-400 pt-1">
              <span>Routing Topology:</span>
              <span className="text-slate-300">
                {bgpRpki.isMultiHomed ? 'Multi-Homed' : 'Single-Homed'} (
                {bgpRpki.uniqueAsns.length} ASN{bgpRpki.uniqueAsns.length !== 1 ? 's' : ''})
              </span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Announcing ASN(s):</span>
              <span className="font-mono text-slate-300">
                {bgpRpki.uniqueAsns.length > 0
                  ? bgpRpki.uniqueAsns.map((asn) => `AS${asn}`).join(', ')
                  : 'N/A'}
              </span>
            </div>

            {bgpRpki.hijackRiskDetected && (
              <div className="rounded bg-rose-500/10 p-2 text-rose-300 border border-rose-500/20 text-[11px]">
                High Risk: Origin ASN does not match published RPKI Route Origin Authorization.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BGP Prefix Routes Table */}
      {bgpRpki.routes.length > 0 && (
        <div data-testid="bgp-routes-table" className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            BGP Route Announcements &amp; Origin Authorizations
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2">IP Address</th>
                  <th className="px-3 py-2">Announced Prefix</th>
                  <th className="px-3 py-2">Origin ASN</th>
                  <th className="px-3 py-2">Autonomous System Name</th>
                  <th className="px-3 py-2">Registry</th>
                  <th className="px-3 py-2">RPKI Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {bgpRpki.routes.map((route, idx) => (
                  <tr key={`${route.ip}-${idx}`} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-mono text-slate-200">{route.ip}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{route.prefix}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">AS{route.asn}</td>
                    <td className="px-3 py-2 text-slate-300">{route.asName}</td>
                    <td className="px-3 py-2 text-slate-400">{route.registry || 'UNKNOWN'}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          route.rpkiStatus === 'VALID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : route.rpkiStatus === 'INVALID'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {route.rpkiStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
