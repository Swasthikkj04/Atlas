import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  CardTitle,
  Eyebrow,
} from '../../../../components/typography';
import {
  type SecurityBriefResult,
  getSecurityPostureBadgeConfig,
} from '../../contracts/security-experience.contract';
import { formatUnderstandingFreshness } from '../../contracts/understanding-freshness.contract';

export interface SecurityBriefProps {
  brief: SecurityBriefResult;
  onSelectHighlight?: (highlightId: string) => void;
  className?: string;
}

export const SecurityBrief: React.FC<SecurityBriefProps> = ({
  brief,
  onSelectHighlight,
  className = '',
}) => {
  const badgeConfig = getSecurityPostureBadgeConfig(brief.posture);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#178A68] dark:text-[#34D399]';
    if (score >= 75) return 'text-[#B86F18] dark:text-[#FBBF24]';
    return 'text-[#A93442] dark:text-[#F87171]';
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-[#EAF7F2] text-[#178A68] border-[#B9E5D6] dark:bg-[#102D23] dark:text-[#34D399] dark:border-[#065F46]';
      case 'B':
      case 'C':
        return 'bg-[#FFF4E3] text-[#B86F18] border-[#F0D3A5] dark:bg-[#3D2614] dark:text-[#FBBF24] dark:border-[#78350F]';
      case 'D':
      case 'F':
      default:
        return 'bg-[#FDEBEC] text-[#A93442] border-[#E9B3B9] dark:bg-[#3D1418] dark:text-[#F87171] dark:border-[#7F1D1D]';
    }
  };

  return (
    <section
      data-testid="security-brief-card"
      aria-labelledby="security-brief-heading"
      className={`relative w-full rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] p-5 sm:p-6 shadow-sm overflow-hidden ${className}`}
    >
      {/* Decorative top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: badgeConfig.accentColor }}
      />

      <div className="flex flex-col gap-5">
        {/* Header: Domain, Title, Freshness, Posture & Grade */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#F4F4F5] dark:border-[#27272A]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF7F2] dark:bg-[#102D23] text-[#178A68] dark:text-[#34D399]">
              <Icon icon={ShieldCheck} size="medium" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle id="security-brief-heading" className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                  Security Brief
                </CardTitle>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  • {brief.domainName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Icon icon={Clock} size="micro" className="text-[#A1A1AA]" />
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {formatUnderstandingFreshness(brief.verifiedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Security Grade & Score */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#1C1C20]">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                  Security Score
                </span>
                <span className={`text-sm font-bold ${getScoreColor(brief.securityScore)}`}>
                  {brief.securityScore}
                  <span className="text-[11px] font-normal text-[#71717A] dark:text-[#A1A1AA]">/100</span>
                </span>
              </div>
              <span
                data-testid="security-grade-badge"
                className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded border ${getGradeBadge(brief.securityGrade)}`}
              >
                Grade {brief.securityGrade}
              </span>
            </div>

            {/* Posture Badge */}
            <span
              data-testid="security-posture-badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${badgeConfig.bgClass} ${badgeConfig.textClass} ${badgeConfig.borderClass}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: badgeConfig.accentColor }}
              />
              {badgeConfig.label}
            </span>
          </div>
        </div>

        {/* Security Executive Narrative */}
        <div className="relative">
          <p className="text-sm leading-relaxed text-[#3F3F46] dark:text-[#D4D4D8]">
            {brief.securitySummary}
          </p>
        </div>

        {/* Highlights / Key Security Developments */}
        {brief.highlights.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <Eyebrow className="text-xs uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Key Security Developments & Observations
            </Eyebrow>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brief.highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  data-testid={`security-highlight-${highlight.id}`}
                  onClick={() => onSelectHighlight?.(highlight.id)}
                  className={`group flex items-start gap-3 p-3 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#1C1C20] ${
                    onSelectHighlight ? 'cursor-pointer hover:border-[#178A68] dark:hover:border-[#34D399] transition-colors' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {highlight.severity === 'CRITICAL' && (
                      <Icon icon={ShieldAlert} size="small" className="text-[#A93442] dark:text-[#F87171]" />
                    )}
                    {highlight.severity === 'HIGH' && (
                      <Icon icon={AlertTriangle} size="small" className="text-[#B86F18] dark:text-[#FBBF24]" />
                    )}
                    {highlight.severity === 'MEDIUM' && (
                      <Icon icon={AlertTriangle} size="small" className="text-[#B86F18] dark:text-[#FBBF24]" />
                    )}
                    {(highlight.severity === 'LOW' || highlight.severity === 'INFO') && (
                      <Icon icon={CheckCircle2} size="small" className="text-[#178A68] dark:text-[#34D399]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA] truncate">
                        {highlight.title}
                      </span>
                      {highlight.pillarCode && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA]">
                          {highlight.pillarCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 line-clamp-2">
                      {highlight.description}
                    </p>
                  </div>
                  {onSelectHighlight && (
                    <Icon
                      icon={ArrowUpRight}
                      size="micro"
                      className="text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#FAFAFA] shrink-0 mt-0.5 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Strategic Recommendations */}
        {brief.recommendations.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <Eyebrow className="text-xs uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Actionable Security Remediation Plan
            </Eyebrow>
            <div className="flex flex-col gap-2">
              {brief.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-start justify-between p-3 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 mt-0.5 ${
                        rec.priority === 'P0'
                          ? 'bg-[#FDEBEC] text-[#A93442] dark:bg-[#3D1418] dark:text-[#F87171]'
                          : rec.priority === 'P1'
                          ? 'bg-[#FFF4E3] text-[#B86F18] dark:bg-[#3D2614] dark:text-[#FBBF24]'
                          : 'bg-[#F4F4F5] text-[#71717A] dark:bg-[#27272A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                        {rec.title}
                      </span>
                      <p className="text-xs text-[#3F3F46] dark:text-[#D4D4D8] mt-0.5">
                        <span className="font-medium text-[#18181B] dark:text-[#FAFAFA]">Action:</span> {rec.action}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                        <span className="font-medium">Rationale:</span> {rec.rationale}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
