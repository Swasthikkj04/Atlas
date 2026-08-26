import React from 'react';
import {
  LayoutGrid,
  ShieldAlert,
  History,
  Server,
  Calendar,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { WorkspaceNavProps, WorkspaceNavigationTab } from './WorkspaceNav.types';

interface NavItemConfig {
  readonly id: WorkspaceNavigationTab;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly path: string;
}

const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    path: '/workspace',
  },
  {
    id: 'findings',
    label: 'Findings',
    icon: ShieldAlert,
    path: '/workspace/findings',
  },
  {
    id: 'changes',
    label: 'Changes',
    icon: History,
    path: '/workspace/changes',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: Server,
    path: '/workspace/infrastructure',
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: Calendar,
    path: '/workspace/memory',
  },
];

/**
 * Authoritative Workspace Product Navigation (WX-902).
 *
 * Implements the canonical 240px product navigation shell:
 * - Brand Header (ARGONION / NEBULA)
 * - WORKSPACE Section with primary product experience items:
 *   - Overview, Findings, Changes, Infrastructure, Memory
 * - Bottom Settings Action
 * - Accessible ARIA navigation landmarks and aria-current state
 * - Zero domain-list clogging in the primary sidebar (domains live in header context switcher)
 */
export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  activeView = 'overview',
  onSelectView,
  onItemClick,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`h-full flex flex-col justify-between overflow-y-auto ${className}`}
      {...rest}
    >
      <div className="flex-1 flex flex-col p-6 space-y-8">
        {/* 1. Brand Header */}
        <div className="px-1 py-1">
          <a
            href="/workspace"
            onClick={(e) => {
              e.preventDefault();
              onSelectView?.('overview');
              onItemClick?.();
            }}
            className="font-mono text-xs tracking-[0.22em] uppercase font-semibold text-foreground hover:opacity-80 transition-opacity flex items-center gap-2.5 focus-ring select-none"
          >
            <div className="w-2 h-2 rounded-full bg-severity-success animate-pulse" />
            <span>ARGONION</span>
            <span className="opacity-30">/</span>
            <span>NEBULA</span>
          </a>
        </div>

        {/* 2. Primary Product Navigation Area */}
        <nav aria-label="Workspace navigation" className="space-y-3">
          <div className="px-2">
            <span className="font-mono text-[10px] font-semibold tracking-[0.26em] uppercase text-muted-foreground/60 select-none">
              WORKSPACE
            </span>
          </div>

          <div className="space-y-1" role="list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              const IconComp = item.icon;

              return (
                <div key={item.id} role="listitem">
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectView?.(item.id);
                      onItemClick?.();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer focus-ring select-none ${
                      isActive
                        ? 'bg-surface-elevated text-text-primary font-medium border border-border-hairline shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle/50 font-normal'
                    }`}
                  >
                    <Icon
                      icon={IconComp}
                      size="small"
                      className={`flex-shrink-0 ${
                        isActive ? 'text-primary' : 'text-muted-foreground/70'
                      }`}
                    />
                    <span className="truncate tracking-tight">{item.label}</span>
                  </a>
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 3. Bottom Settings & Secondary Action */}
      <div className="p-6 pt-0 border-t border-border-hairline">
        <a
          href="/settings"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle/50 transition-all font-normal focus-ring select-none"
        >
          <Icon
            icon={SettingsIcon}
            size="small"
            className="text-muted-foreground/70 flex-shrink-0"
          />
          <span className="truncate tracking-tight">Settings</span>
        </a>
      </div>
    </div>
  );
};

WorkspaceNav.displayName = 'WorkspaceNav';
