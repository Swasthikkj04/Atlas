import React from 'react';
import { LogOut, Moon, Sun, Settings } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { WorkspaceProfileMenuProps } from './WorkspaceProfileMenu.types';

/**
 * Authoritative Workspace Profile Menu (WX-103 / WX-211).
 *
 * Provides contextual account hierarchy, theme toggle, settings link, and sign out actions
 * anchored with strong vertical rhythm at the bottom of the navigation region.
 */
export const WorkspaceProfileMenu: React.FC<WorkspaceProfileMenuProps> = ({
  user,
  onLogout,
  theme,
  onToggleTheme,
  className = '',
  ...rest
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`p-5 sm:p-6 border-t border-border/50 bg-card/30 space-y-4 ${className}`} {...rest}>
      {/* Account Section Overline */}
      <div className="px-1">
        <span className="font-mono text-[10px] font-semibold tracking-[0.26em] uppercase text-muted-foreground/60 select-none">
          ACCOUNT
        </span>
      </div>

      {/* User Info & Theme Toggle */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.fullName || 'User'}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/75 truncate">
            {user?.email || ''}
          </p>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer flex-shrink-0"
            aria-label="Toggle visual theme"
          >
            <Icon icon={isDark ? Sun : Moon} size="small" />
          </button>
        )}
      </div>

      {/* Settings Navigation Link */}
      <a
        href="/settings/account"
        className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors focus-ring"
      >
        <Icon icon={Settings} size="small" />
        <span>Settings</span>
      </a>

      {/* Sign Out Action */}
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-colors focus-ring cursor-pointer"
        >
          <Icon icon={LogOut} size="small" />
          <span>Sign out</span>
        </button>
      )}
    </div>
  );
};

WorkspaceProfileMenu.displayName = 'WorkspaceProfileMenu';
