import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown, LogOut, Sun, Moon, Search, User as UserIcon, Shield, Palette } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import { WorkspaceBreadcrumbs } from './WorkspaceBreadcrumbs';
import { DomainContextSwitcher } from './DomainContextSwitcher';
import type { WorkspaceHeaderProps } from './WorkspaceHeader.types';

/**
 * Authoritative Workspace Header with Top-Right Profile Context.
 *
 * Implements the contextual orientation header for Nebula Workspace:
 * - Mobile navigation drawer trigger with accessible aria attributes
 * - Contextual location breadcrumbs (Workspace / domain)
 * - Global cross-workspace search trigger (Cmd/Ctrl+K)
 * - Top-right Profile Dropdown with Account details, Theme toggle, and Sign out
 * - Strictly subordinate to canvas intelligence
 */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  domain,
  domains,
  activeDomainId,
  onSelectDomain,
  onAddDomain,
  onDeleteDomain,
  sectionName = 'Workspace',
  subSection,
  isNavOpen = false,
  onToggleNav,
  user,
  onLogout,
  theme,
  onToggleTheme,
  onOpenSearch,
  actions,
  className = '',
  ...rest
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Handle outside click to close profile dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isProfileOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isProfileOpen]);

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';

  return (
    <div
      className={`w-full flex items-center justify-between gap-4 ${className}`}
      {...rest}
    >
      {/* Left Region: Mobile Trigger & Contextual Breadcrumbs */}
      <Cluster gap="sm" align="center" className="min-w-0 flex-1">
        {onToggleNav && (
          <button
            type="button"
            onClick={onToggleNav}
            aria-expanded={isNavOpen}
            aria-controls="workspace-nav"
            aria-label={isNavOpen ? 'Close navigation' : 'Open navigation'}
            className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer flex-shrink-0"
          >
            <Icon icon={isNavOpen ? X : Menu} size="default" />
          </button>
        )}

        <WorkspaceBreadcrumbs domain={domain} sectionName={sectionName} subSection={subSection} />
      </Cluster>

      {/* Right Region: Domain Context Switcher, Search Trigger & Profile Menu */}
      <Cluster gap="sm" align="center" className="flex-shrink-0">
        {domains && domains.length > 0 && (
          <DomainContextSwitcher
            domains={domains}
            activeDomainId={activeDomainId}
            onSelectDomain={onSelectDomain}
            onAddDomain={onAddDomain}
            onDeleteDomain={onDeleteDomain}
          />
        )}

        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search infrastructure intelligence (Cmd+K)"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-hairline bg-surface-elevated hover:border-border-strong text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer focus-ring"
          >
            <Icon icon={Search} size="small" />
            <span className="hidden md:inline font-sans">Search infrastructure...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        )}

        {actions}

        {/* User Profile Dropdown Menu */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              id="workspace-profile-trigger"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              aria-label={`User menu for ${displayName}`}
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-hairline bg-surface-elevated hover:border-border-strong text-xs font-medium text-foreground transition-all cursor-pointer focus-ring"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate hidden sm:inline">{displayName}</span>
              <Icon icon={ChevronDown} size="small" className="text-muted-foreground" />
            </button>

            {/* Dropdown Menu Popup */}
            {isProfileOpen && (
              <div
                role="menu"
                aria-labelledby="workspace-profile-trigger"
                className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-card border border-border/80 shadow-2xl p-4 z-50 space-y-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Account Header */}
                <div className="space-y-1 pb-2 border-b border-border/50">
                  <p className="text-xs font-medium text-foreground truncate">
                    {user.fullName || displayName}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {user.email || ''}
                  </p>
                </div>

                {/* Settings Navigation Links */}
                <div className="space-y-0.5 pb-2 border-b border-border/50">
                  <a
                    href="/settings/account"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon icon={UserIcon} size="small" className="text-muted-foreground" />
                    <span>Account</span>
                  </a>
                  <a
                    href="/settings/security"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon icon={Shield} size="small" className="text-muted-foreground" />
                    <span>Security</span>
                  </a>
                  <a
                    href="/settings/appearance"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon icon={Palette} size="small" className="text-muted-foreground" />
                    <span>Appearance</span>
                  </a>
                </div>

                {/* Theme Toggle Action */}
                {onToggleTheme && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <span className="text-muted-foreground">Quick Theme</span>
                    <Cluster align="center" gap="xs">
                      <span className="text-[11px] capitalize text-muted-foreground font-mono">
                        {theme || 'system'}
                      </span>
                      <Icon icon={isDark ? Sun : Moon} size="small" className="text-muted-foreground" />
                    </Cluster>
                  </button>
                )}

                {/* Sign Out Action */}
                {onLogout && (
                  <div className="pt-1 border-t border-border/50">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Icon icon={LogOut} size="small" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Cluster>
    </div>
  );
};

WorkspaceHeader.displayName = 'WorkspaceHeader';
