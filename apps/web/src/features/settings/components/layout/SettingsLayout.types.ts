import React from 'react';
import type { SettingsSection } from '../../contracts/settings-routing.contract';
import type { User } from '../../../../types/auth.types';

export interface SettingsLayoutProps {
  readonly activeSection: SettingsSection;
  readonly onSelectSection: (section: SettingsSection) => void;
  readonly onReturnToWorkspace: () => void;
  readonly user: User | null;
  readonly onLogout: () => void;
  readonly theme: 'light' | 'dark' | 'system';
  readonly onToggleTheme: () => void;
  readonly children: React.ReactNode;
  readonly className?: string;
}
