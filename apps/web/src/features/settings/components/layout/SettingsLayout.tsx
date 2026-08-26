import React from 'react';
import { User as UserIcon, Shield, Palette, ArrowLeft, type LucideIcon } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import { WorkspaceHeader } from '../../../workspace/components/header';
import { CANONICAL_SETTINGS_SECTIONS, type SettingsSection } from '../../contracts/settings-routing.contract';
import type { SettingsLayoutProps } from './SettingsLayout.types';

const SECTION_ICONS: Record<SettingsSection, LucideIcon> = {
  account: UserIcon,
  security: Shield,
  appearance: Palette,
};

/**
 * Authoritative Account & Settings Layout Shell (AX-102).
 *
 * Implements the quiet utility container for Nebula Settings:
 * - Seamless integration with global Workspace Header
 * - Canonical 3-section sidebar navigation (Account, Security, Appearance)
 * - Accessible <nav> semantics with aria-current="page"
 * - Responsive layout: 256px sidebar on desktop, compact horizontal cluster on mobile
 * - Return path to /workspace
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  activeSection,
  onSelectSection,
  onReturnToWorkspace,
  user,
  onLogout,
  theme,
  onToggleTheme,
  children,
  className = '',
}) => {
  const currentSectionMeta = CANONICAL_SETTINGS_SECTIONS.find((s) => s.id === activeSection) || CANONICAL_SETTINGS_SECTIONS[0];

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${className}`}>
      {/* Top Region: Global Workspace Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border-hairline bg-background/80 backdrop-blur-md px-4 lg:px-8 py-3">
        <WorkspaceHeader
          sectionName="Settings"
          subSection={currentSectionMeta.title}
          user={user}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={onToggleTheme}
          actions={
            <button
              type="button"
              onClick={onReturnToWorkspace}
              aria-label="Return to Workspace"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-hairline bg-surface-elevated hover:border-border-strong text-xs font-medium text-foreground transition-all cursor-pointer focus-ring"
            >
              <Icon icon={ArrowLeft} size="small" />
              <span className="hidden sm:inline">Back to Workspace</span>
            </button>
          }
        />
      </header>

      {/* Main Settings Body */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav aria-label="Settings navigation" className="space-y-1">
            <div className="px-3 pb-2 hidden md:block">
              <h2 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Settings
              </h2>
            </div>

            <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
              {CANONICAL_SETTINGS_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const SectionIconComponent = SECTION_ICONS[section.id];

                return (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onSelectSection(section.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left w-full cursor-pointer focus-ring whitespace-nowrap ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <Icon
                      icon={SectionIconComponent}
                      size="small"
                      className={isActive ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{section.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-border-hairline hidden md:block">
              <button
                type="button"
                onClick={onReturnToWorkspace}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors w-full cursor-pointer focus-ring"
              >
                <Icon icon={ArrowLeft} size="small" />
                <span>Return to Workspace</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <main id="main-content" className="flex-1 min-w-0 max-w-3xl">
          <div className="space-y-6">
            {/* Section Header */}
            <div className="border-b border-border-hairline pb-4">
              <Cluster justify="between" align="center">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {currentSectionMeta.title}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentSectionMeta.description}
                  </p>
                </div>
              </Cluster>
            </div>

            {/* Active Section Surface */}
            <div className="pt-2">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

SettingsLayout.displayName = 'SettingsLayout';
