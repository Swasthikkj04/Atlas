import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Layers,
  Cpu,
  Network,
  ShieldCheck,
  Terminal,
  ArrowUpRight,
  ChevronRight,
  Shield,
  ArrowRight,
  Info,
} from 'lucide-react';
import type {
  CanonicalInfrastructureRowItem,
  CanonicalInfrastructureCategoryKey,
} from '../../contracts/gx-i-01-infrastructure-surface.contract.ts';
import type { GuestWorkspaceTabId } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';

interface InfrastructureRowItemProps {
  item: CanonicalInfrastructureRowItem;
  defaultExpanded?: boolean;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

function getCategoryIcon(key: CanonicalInfrastructureCategoryKey) {
  switch (key) {
    case 'EDGE_CDN':
      return Cloud;
    case 'WEB_SERVER':
      return Server;
    case 'APPLICATION_FRAMEWORK':
      return Layers;
    case 'HOSTING_CLOUD':
      return Cpu;
    case 'DNS':
      return Network;
    case 'TLS_SSL':
      return ShieldCheck;
    case 'IP_ENDPOINTS':
      return Terminal;
    case 'PUBLIC_PORTS':
      return ArrowUpRight;
    default:
      return Server;
  }
}

export const InfrastructureRowItem: React.FC<InfrastructureRowItemProps> = ({
  item,
  defaultExpanded = false,
  onNavigateTab,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const IconComponent = getCategoryIcon(item.categoryKey);

  return (
    <div
      data-testid={`infra-row-${item.id}`}
      className="group transition-colors border-b last:border-b-0 border-[#EEEEEB] dark:border-border-divider"
    >
      {/* 1. Main Clickable Row (≥44px target) */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full min-h-[52px] py-3.5 px-4 sm:px-6 flex items-center justify-between gap-4 text-left hover:bg-[#F8F9FA] dark:hover:bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              isExpanded
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-[#F2F2F0] dark:bg-muted/40 border-[#E5E7EB] dark:border-border text-[#5F625F] dark:text-muted-foreground group-hover:text-foreground'
            }`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-[#5F625F] dark:text-muted-foreground">
                {item.categoryLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-semibold text-foreground">
                {item.componentName}
              </span>
              <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
                &bull;
              </span>
              <span className="text-xs font-mono text-[#178A68] dark:text-emerald-400 font-medium">
                {item.confidence === 'HIGH'
                  ? 'High confidence'
                  : item.confidence === 'MEDIUM'
                    ? 'Moderate confidence'
                    : 'Low confidence'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {item.secondaryDetail && (
            <span className="hidden md:inline-block text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
              {item.secondaryDetail}
            </span>
          )}
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[#5F625F] dark:text-muted-foreground transition-transform duration-200 ${
              isExpanded ? 'rotate-90 text-primary' : 'group-hover:translate-x-0.5'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* 2. Expanded Contextual Detail Accordion */}
      {isExpanded && (
        <div className="px-4 sm:px-6 pb-5 pt-2 bg-[#FAFAF8] dark:bg-muted/10 border-t border-[#EEEEEB] dark:border-border-divider animate-in fade-in slide-in-from-top-1 duration-150 space-y-4">
          {/* Diagnostic Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Observed Role & Why Nebula Believes This */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <span>Observed Role</span>
                </span>
                <p className="text-xs font-sans text-foreground font-medium">
                  {item.observedRole}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-primary" />
                  <span>Why Nebula Believes This</span>
                </span>
                <p className="text-xs font-sans text-foreground">
                  {item.whyNebulaBelievesThis}
                </p>
              </div>
            </div>

            {/* Right Column: Confidence Meaning & Contextual Fields */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold">
                    Evidence Confidence
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {item.confidence} CONFIDENCE
                  </span>
                </div>
                <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed">
                  {item.confidenceExplanation}
                </p>
              </div>

              {/* Contextual Detail Fields */}
              {item.contextualDetails && item.contextualDetails.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold block">
                    Protocol & Wire Attributes
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {item.contextualDetails.map((field, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="text-[10px] text-[#5F625F] dark:text-muted-foreground">
                          {field.label}
                        </span>
                        <div className="text-foreground font-medium truncate">
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Strip: Jump to Evidence */}
          <div className="flex items-center justify-between pt-2 border-t border-[#EEEEEB] dark:border-border-divider">
            <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{item.evidenceCount} verified signals backing this observation</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('evidence')}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-primary/80 transition-colors py-1 px-2 rounded-lg hover:bg-primary/5"
            >
              <span>Inspect evidence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
