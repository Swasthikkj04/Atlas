import React, { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  Network,
  Layers,
  ShieldAlert,
  Terminal,
  History,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  GUEST_WORKSPACE_TABS,
  type GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';

interface GuestWorkspaceNavProps {
  activeTab: GuestWorkspaceTabId;
  onSelectTab: (tabId: GuestWorkspaceTabId) => void;
  componentsCount?: number;
  findingsCount?: number;
  evidenceCount?: number;
  reduced?: boolean;
  className?: string;
}

const TAB_ICONS: Record<GuestWorkspaceTabId, LucideIcon> = {
  overview: LayoutGrid,
  architecture: Network,
  infrastructure: Layers,
  findings: ShieldAlert,
  evidence: Terminal,
  history: History,
};

export const GuestWorkspaceNav: React.FC<GuestWorkspaceNavProps> = ({
  activeTab,
  onSelectTab,
  componentsCount = 0,
  findingsCount = 0,
  evidenceCount = 0,
  reduced = false,
  className = '',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const tabs = GUEST_WORKSPACE_TABS;
      let nextIndex = -1;

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== -1) {
        e.preventDefault();
        const nextTab = tabs[nextIndex];
        onSelectTab(nextTab.id);
        const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
        buttons?.[nextIndex]?.focus();
      }
    },
    [onSelectTab]
  );

  return (
    <nav
      aria-label="Guest Workspace Views"
      className={`w-full border-b border-border/70 bg-card/40 backdrop-blur-xs sticky top-16 z-30 ${className}`}
    >
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Intelligence surface tabs"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2"
        >
          {GUEST_WORKSPACE_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const isLocked = tab.status === 'LOCKED_PREVIEW';
            const IconComponent = TAB_ICONS[tab.id] || LayoutGrid;

            // Badges
            let badgeText: string | null = null;
            let isCountBadge = false;
            if (tab.id === 'infrastructure' && componentsCount > 0) {
              badgeText = String(componentsCount);
              isCountBadge = true;
            } else if (tab.id === 'findings' && findingsCount > 0) {
              badgeText = String(findingsCount);
              isCountBadge = true;
            } else if (tab.id === 'evidence' && evidenceCount > 0) {
              badgeText = String(evidenceCount);
              isCountBadge = true;
            } else if (isLocked) {
              badgeText = 'Workspace';
            }

            return (
              <button
                key={tab.id}
                role="tab"
                id={`guest-tab-${tab.id}`}
                aria-controls={`guest-panel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectTab(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-medium transition-all duration-200 shrink-0 cursor-pointer select-none focus-ring ${
                  isActive
                    ? 'text-foreground font-semibold shadow-xs'
                    : isLocked
                    ? 'text-muted-foreground/75 hover:text-foreground/90 hover:bg-muted/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {/* Active animated pill background */}
                {isActive && (
                  <motion.div
                    layoutId={reduced ? undefined : 'guest-active-tab-indicator'}
                    className="absolute inset-0 bg-card border border-border/90 rounded-xl shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                {/* Tab content */}
                <div className="relative z-10 flex items-center gap-2">
                  <IconComponent
                    className={`size-4 transition-colors ${
                      isActive
                        ? 'text-primary'
                        : isLocked
                        ? 'text-muted-foreground/60'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span>{tab.label}</span>

                  {/* Lock icon for preview */}
                  {isLocked && !badgeText && (
                    <Lock className="size-3 text-muted-foreground/50 ml-0.5" />
                  )}

                  {/* Badges */}
                  {badgeText && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold uppercase transition-colors ${
                        isActive && isCountBadge
                          ? 'bg-primary/15 text-primary border border-primary/25'
                          : isCountBadge
                          ? 'bg-muted text-muted-foreground border border-border/60'
                          : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {isLocked && <Lock className="size-2.5 mr-1 text-indigo-500" />}
                      {badgeText}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
