import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { QuietState } from '../../../../components/states';
import type { FindingDto, SecurityPillarCode } from '../../contracts/security-experience.contract';
import { SECURITY_PILLAR_DEFINITIONS } from '../../contracts/security-experience.contract';

export interface SecurityFindingsListProps {
  findings: readonly FindingDto[];
  selectedPillarCode?: SecurityPillarCode | null;
  onSelectFinding: (findingId: string) => void;
  className?: string;
}

export const SecurityFindingsList: React.FC<SecurityFindingsListProps> = ({
  findings,
  selectedPillarCode,
  onSelectFinding,
  className = '',
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // 1. Severity filter
      if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) {
        return false;
      }

      // 2. Pillar filter
      if (selectedPillarCode) {
        const rule = f.rule?.ruleId || (f as { ruleId?: string }).ruleId || f.id || '';
        const cat = (f.category || '').toUpperCase();
        const title = f.title.toLowerCase();

        switch (selectedPillarCode) {
          case 'S1':
            return rule.includes('cookie') || cat === 'COOKIE_SECURITY' || title.includes('cookie');
          case 'S2':
            return rule.includes('debug') || rule.includes('internal-topology') || rule.includes('stack-trace') || title.includes('leakage') || title.includes('stack');
          case 'S3':
            return rule.startsWith('tls.') || rule.startsWith('ssl.') || cat === 'TLS' || cat === 'CERTIFICATE' || title.includes('certificate');
          case 'S4':
            return rule.includes('csp') || rule.includes('cross-origin') || rule.includes('permissions') || rule.includes('missing-content-security');
          case 'S5':
            return rule.startsWith('dns.') || cat === 'DNS_SECURITY' || title.includes('dmarc') || title.includes('spf');
          case 'S6':
            return rule.includes('cors') || rule.includes('dangerous-methods') || rule.includes('cleartext') || title.includes('cors');
          case 'S7':
            return rule.includes('git') || rule.includes('env') || rule.includes('management') || title.includes('.git') || title.includes('.env');
          default:
            return true;
        }
      }

      return true;
    });
  }, [findings, selectedSeverity, selectedPillarCode]);

  const severityCounts = useMemo(() => {
    return {
      ALL: findings.length,
      CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
      HIGH: findings.filter((f) => f.severity === 'HIGH').length,
      MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
      LOW: findings.filter((f) => f.severity === 'LOW' || f.severity === 'INFO').length,
    };
  }, [findings]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#FDEBEC] text-[#A93442] border-[#E9B3B9] dark:bg-[#3D1418] dark:text-[#F87171] dark:border-[#7F1D1D]';
      case 'HIGH':
        return 'bg-[#FFF4E3] text-[#B86F18] border-[#F0D3A5] dark:bg-[#3D2614] dark:text-[#FBBF24] dark:border-[#78350F]';
      case 'MEDIUM':
        return 'bg-[#FEFCE8] text-[#A16207] border-[#FEF08A] dark:bg-[#422006] dark:text-[#FDE047] dark:border-[#854D0E]';
      case 'LOW':
      case 'INFO':
      default:
        return 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7] dark:bg-[#27272A] dark:text-[#A1A1AA] dark:border-[#3F3F46]';
    }
  };

  return (
    <section
      data-testid="security-findings-section"
      aria-labelledby="security-findings-heading"
      className={`flex flex-col gap-4 ${className}`}
    >
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3
            id="security-findings-heading"
            className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]"
          >
            Active Security Findings
          </h3>
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            • {filteredFindings.length} of {findings.length} findings
          </span>
          {selectedPillarCode && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#EAF7F2] text-[#178A68] border border-[#B9E5D6] dark:bg-[#102D23] dark:text-[#34D399] dark:border-[#065F46]">
              Pillar: {selectedPillarCode} ({SECURITY_PILLAR_DEFINITIONS[selectedPillarCode]?.name})
            </span>
          )}
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
            const count = severityCounts[sev];
            const isActive = selectedSeverity === sev;

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-[#18181B] text-white border-[#18181B] dark:bg-[#FAFAFA] dark:text-[#18181B] dark:border-[#FAFAFA]'
                    : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#D4D4D8] dark:bg-[#18181B] dark:text-[#A1A1AA] dark:border-[#27272A] dark:hover:border-[#3F3F46]'
                }`}
              >
                <span>{sev === 'ALL' ? 'All Severities' : sev}</span>
                <span className={`text-[10px] px-1 rounded-full ${
                  isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings List or Empty/Quiet State */}
      {filteredFindings.length === 0 ? (
        <div className="w-full rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] p-8">
          <QuietState
            title={
              selectedPillarCode || selectedSeverity !== 'ALL'
                ? 'No Findings Match Active Filters'
                : 'Zero Active Security Vulnerabilities'
            }
            description={
              selectedPillarCode || selectedSeverity !== 'ALL'
                ? 'Try clearing the severity or pillar filter to inspect other verified observations.'
                : 'Your infrastructure perimeter, transport layer, and session configs conform to production security baselines.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              data-testid={`security-finding-item-${finding.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46] transition-all gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {finding.severity === 'CRITICAL' ? (
                    <Icon icon={ShieldAlert} size="medium" className="text-[#A93442] dark:text-[#F87171]" />
                  ) : finding.severity === 'HIGH' ? (
                    <Icon icon={AlertTriangle} size="medium" className="text-[#B86F18] dark:text-[#FBBF24]" />
                  ) : (
                    <Icon icon={Info} size="medium" className="text-[#178A68] dark:text-[#34D399]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${getSeverityBadge(
                        finding.severity,
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {finding.rule?.ruleId || (finding as any).ruleId || finding.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">
                    {finding.title}
                  </h4>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {finding.description || (finding as any).whyItMatters || 'No additional finding details recorded.'}
                  </p>
                </div>
              </div>

              {/* Action Button: 1-click drilldown to Investigation Drawer */}
              <button
                type="button"
                data-testid={`investigate-finding-${finding.id}`}
                onClick={() => onSelectFinding(finding.id)}
                className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#1C1C20] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] transition-colors shrink-0"
              >
                <span>Investigate</span>
                <Icon icon={ArrowUpRight} size="micro" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
