import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTheme } from '../../guest/hooks/useTheme';
import {
  resolveSettingsSection,
  buildSettingsPath,
  type SettingsSection,
} from '../contracts/settings-routing.contract';
import {
  SettingsLayout,
  AccountSettingsView,
  SecuritySettingsView,
  AppearanceSettingsView,
} from '../components';

/**
 * Authoritative Settings Page Container (AX-102).
 *
 * Implements client routing, deep-link preservation, browser back/forward (popstate),
 * and section switching across Account, Security, and Appearance.
 */
export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, mode, setMode } = useTheme();

  const [activeSection, setActiveSection] = useState<SettingsSection>(() => {
    if (typeof window === 'undefined') return 'account';
    return resolveSettingsSection(window.location.pathname);
  });

  // Ensure root /settings redirects canonically to /settings/account
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath === '/settings' || currentPath === '/settings/') {
        window.history.replaceState({}, '', '/settings/account');
      }
    }
  }, []);

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const resolved = resolveSettingsSection(window.location.pathname);
        setActiveSection(resolved);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectSection = useCallback((section: SettingsSection) => {
    setActiveSection(section);
    if (typeof window !== 'undefined') {
      const targetPath = buildSettingsPath(section);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  }, []);

  const handleReturnToWorkspace = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/workspace');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setMode]);

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      onReturnToWorkspace={handleReturnToWorkspace}
      user={user}
      onLogout={logout}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {activeSection === 'account' && <AccountSettingsView user={user} />}
      {activeSection === 'security' && <SecuritySettingsView user={user} />}
      {activeSection === 'appearance' && (
        <AppearanceSettingsView
          theme={mode}
          onThemeChange={setMode}
          onToggleTheme={toggleTheme}
        />
      )}
    </SettingsLayout>
  );
};

SettingsPage.displayName = 'SettingsPage';

export default SettingsPage;

