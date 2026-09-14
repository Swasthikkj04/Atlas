import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { authService } from '../../../services/auth';
import { apiClient } from '../../../lib/api-client';
import { accountService } from '../../../services/account/account.service';
import { telemetry } from '../../../services';
import {
  THEME_STORAGE_KEY,
  THEME_CHANGE_EVENT,
  applyThemeToDOM,
  getSystemTheme,
} from '../../../hooks/useTheme';
import {
  MOTION_STORAGE_KEY,
  MOTION_CHANGE_EVENT,
  applyMotionToDOM,
  getSystemReducedMotion,
} from '../../../hooks/useMotion';
import { claimGuestSession as apiClaimGuestSession } from '../../../services/api/guest';
import { AuthContext } from './auth-context';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
  VerifyEmailResponse,
  AuthContextValue,
  ClaimGuestSessionResponse,
} from '../../../types/auth.types';

export { AuthContext };

export interface AuthProviderProps {
  children: React.ReactNode;
}

function syncPreferencesLocally(prefs: { theme?: string; motion?: string }) {
  if (typeof window === 'undefined') return;
  if (prefs.theme && (prefs.theme === 'light' || prefs.theme === 'dark' || prefs.theme === 'system')) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, prefs.theme);
    } catch {
      // Ignore local storage write errors
    }
    const effectiveTheme = prefs.theme === 'system' ? getSystemTheme() : (prefs.theme as 'light' | 'dark');
    applyThemeToDOM(effectiveTheme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: { mode: prefs.theme, theme: effectiveTheme },
      })
    );
  }
  if (prefs.motion && (prefs.motion === 'standard' || prefs.motion === 'reduced' || prefs.motion === 'system')) {
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, prefs.motion);
    } catch {
      // Ignore local storage write errors
    }
    const isReduced = prefs.motion === 'system' ? getSystemReducedMotion() : prefs.motion === 'reduced';
    applyMotionToDOM(isReduced);
    window.dispatchEvent(
      new CustomEvent(MOTION_CHANGE_EVENT, {
        detail: { motion: prefs.motion, isReduced },
      })
    );
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const loadUser = useCallback(async (): Promise<User | null> => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      try {
        const isTabSessionActive =
          typeof window !== 'undefined' &&
          sessionStorage.getItem('nebula_session_active') === 'true';

        const isOAuthCallback =
          typeof window !== 'undefined' &&
          (window.location.pathname.includes('/callback') ||
            window.location.pathname.includes('/verify-email'));

        if (!isTabSessionActive && !isOAuthCallback) {
          // Tab was closed or freshly opened without active tab session.
          // Terminate stale backend session and clear cookies so session terminates on tab close.
          await authService.logout().catch(() => {});
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        const profile = await loadUser();
        if (profile) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('nebula_session_active', 'true');
          }
          try {
            const prefs = await accountService.getPreferences();
            if (prefs && isMounted) {
              syncPreferencesLocally(prefs);
            }
          } catch {
            // Non-blocking preference synchronization
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initAuth();

    apiClient.setOnSessionExpired(() => {
      if (isMounted) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('nebula_session_active');
        }
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      apiClient.setOnSessionExpired(undefined);
    };
  }, [loadUser]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      const response = await authService.login(credentials);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nebula_session_active', 'true');
      }
      setUser(response.user);
      try {
        const prefs = await accountService.getPreferences();
        if (prefs) {
          syncPreferencesLocally(prefs);
        }
      } catch {
        // Non-blocking preference synchronization
      }
      return response.user;
    },
    []
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
      return authService.register(credentials);
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nebula_session_active');
      }
      await authService.logout();
      telemetry.track('SIGN_OUT', { surface: 'auth', status: 'SUCCESS' });
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { fullName: string }): Promise<User> => {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    },
    []
  );

  const refetchUser = useCallback(async (): Promise<User | null> => {
    return loadUser();
  }, [loadUser]);

  const verifyEmail = useCallback(
    async (token: string): Promise<VerifyEmailResponse> => {
      const response = await authService.verifyEmail(token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nebula_session_active', 'true');
      }
      if (response.user) {
        setUser(response.user);
      } else {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch {
          // session fallback
        }
      }
      return response;
    },
    []
  );

  const claimGuestSession = useCallback(
    async (sessionToken: string): Promise<ClaimGuestSessionResponse> => {
      return apiClaimGuestSession(sessionToken);
    },
    []
  );

  const checkAndClaimGuestSession = useCallback(
    async (): Promise<ClaimGuestSessionResponse | null> => {
      let sessionToken: string | null = null;

      // 1. Check URL search param
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        sessionToken = params.get('session');
      }

      // 2. Check sessionStorage fallback
      if (!sessionToken && typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('nebula_guest_claim');
          if (raw) {
            const parsed = JSON.parse(raw);
            sessionToken = parsed.sessionId || null;
          }
        } catch {
          // ignore parsing errors
        }
      }

      if (!sessionToken) return null;

      try {
        const res = await apiClaimGuestSession(sessionToken);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('nebula_guest_claim');
          sessionStorage.removeItem('nebula_claim_error');
        }
        return res;
      } catch (err: unknown) {
        console.error('Failed to claim guest session:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Sorry, your domain limit has been reached.';
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nebula_claim_error', errorMsg);
          sessionStorage.removeItem('nebula_guest_claim');
        }
        throw err;
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refetchUser,
      verifyEmail,
      claimGuestSession,
      checkAndClaimGuestSession,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refetchUser,
      verifyEmail,
      claimGuestSession,
      checkAndClaimGuestSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
