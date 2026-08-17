import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { authService } from '../../../services/auth';
import { claimGuestSession as apiClaimGuestSession } from '../../../services/api/guest';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
  VerifyEmailResponse,
  AuthContextValue,
  ClaimGuestSessionResponse,
} from '../../../types/auth.types';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
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
      // Attempt silent refresh if session refresh cookie is valid
      try {
        await authService.refreshToken();
        const profile = await authService.getProfile();
        setUser(profile);
        return profile;
      } catch {
        setUser(null);
        return null;
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      try {
        await loadUser();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [loadUser]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      const response = await authService.login(credentials);
      setUser(response.user);
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
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const refetchUser = useCallback(async (): Promise<User | null> => {
    return loadUser();
  }, [loadUser]);

  const verifyEmail = useCallback(
    async (token: string): Promise<VerifyEmailResponse> => {
      const response = await authService.verifyEmail(token);
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
        }
        return res;
      } catch (err) {
        console.error('Failed to claim guest session:', err);
        return null;
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
      refetchUser,
      verifyEmail,
      claimGuestSession,
      checkAndClaimGuestSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
