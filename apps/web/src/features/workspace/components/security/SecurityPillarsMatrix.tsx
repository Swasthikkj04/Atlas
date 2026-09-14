import type { LucideIcon } from 'lucide-react';
import {
  Cookie,
  EyeOff,
  Lock,
  Globe,
  Mail,
  ArrowLeftRight,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  type SecurityPillarSummary,
  type SecurityPillarCode,
  getPillarHealthBadgeConfig,
} from '../../contracts/security-experience.contract';

export interface SecurityPillarsMatrixProps {
  pillars: readonly SecurityPillarSummary[];
  selectedPillarCode?: SecurityPillarCode | null;
  onSelectPillar?: (code: SecurityPillarCode | null) => void;
  className?: string;
}

const PILLAR_ICONS: Record<SecurityPillarCode, LucideIcon> = {
  S1: Cookie,
  S2: EyeOff,
  S3: Lock,
  S4: Globe,
  S5: Mail,
  S6: ArrowLeftRight,
  S7: ShieldAlert,
};

export const SecurityPillarsMatrix: React.FC<SecurityPillarsMatrixProps> = ({
  pillars,
  selectedPillarCode,
  onSelectPillar,
  className = '',
}) => {
  return (
    <section
      data-testid="security-pillars-matrix"
      aria-labelledby="security-pillars-heading"
      className={`flex flex-col gap-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3
              id="security-pillars-heading"
              className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]"
            >
              Security Defense Pillars (S1 – S7)
            </h3>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              • 7-Pillar Infrastructure Posture
            </span>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Select a defense pillar to inspect verified signals and isolate active security findings.
          </p>
        </div>

        {selectedPillarCode && (
          <button
            type="button"
            onClick={() => onSelectPillar?.(null)}
            className="self-start sm:self-auto text-xs text-[#178A68] dark:text-[#34D399] hover:underline font-medium"
          >
            Clear Pillar Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {pillars.map((pillar) => {
          const isSelected = selectedPillarCode === pillar.code;
          const healthBadge = getPillarHealthBadgeConfig(pillar.status);
          const PillarIcon = PILLAR_ICONS[pillar.code] || Lock;

          return (
            <div
              key={pillar.id}
              data-testid={`pillar-card-${pillar.code}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPillar?.(isSelected ? null : pillar.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPillar?.(isSelected ? null : pillar.code);
                }
              }}
              className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-[#178A68] dark:border-[#34D399] bg-[#EAF7F2]/20 dark:bg-[#102D23]/30 shadow-sm'
                  : 'border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46]'
              }`}
            >
              <div>
                {/* Pillar Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F4F4F5] dark:bg-[#27272A] text-[#18181B] dark:text-[#FAFAFA]">
                      {pillar.code}
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#FAFAFA] transition-colors">
                      <Icon icon={PillarIcon} size="micro" />
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${healthBadge.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${healthBadge.dotClass}`} />
                    {healthBadge.label}
                  </span>
                </div>

                {/* Pillar Title */}
                <h4 className="text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">
                  {pillar.name}
                </h4>

                {/* Pillar Summary */}
                <p className="text-[11px] leading-relaxed text-[#71717A] dark:text-[#A1A1AA] line-clamp-2">
                  {pillar.summary}
                </p>
              </div>

              {/* Signals & Findings */}
              <div className="mt-3 pt-3 border-t border-[#F4F4F5] dark:border-[#27272A]">
                <div className="flex flex-wrap gap-1 mb-2">
                  {pillar.signals.map((sig) => (
                    <span
                      key={sig}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[#FAFAFA] dark:bg-[#1C1C20] border border-[#E4E4E7] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]"
                    >
                      {sig}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  {pillar.findingsCount > 0 ? (
                    <span className="font-semibold text-[#A93442] dark:text-[#F87171]">
                      {pillar.findingsCount} finding{pillar.findingsCount > 1 ? 's' : ''} detected
                    </span>
                  ) : (
                    <span className="text-[#178A68] dark:text-[#34D399] flex items-center gap-1 font-medium">
                      <Icon icon={CheckCircle2} size="micro" /> Hardened
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={`transition-transform text-[#A1A1AA] ${
                      isSelected ? 'transform rotate-90 text-[#178A68] dark:text-[#34D399]' : 'group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
