import { type HTMLAttributes } from 'react';
import type { UserDto } from '../../../../types/api';

export interface WorkspaceProfileMenuProps extends HTMLAttributes<HTMLDivElement> {
  user?: UserDto | null;
  onLogout?: () => void;
  theme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
  className?: string;
}
