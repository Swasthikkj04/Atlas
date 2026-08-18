export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface VerifyEmailResponse {
  message: string;
  status: string;
  alreadyVerified?: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface ResetPasswordCredentials {
  token: string;
  password: string;
}

export interface ClaimGuestSessionResponse {
  success: boolean;
  message: string;
  domainId: string;
  domainName: string;
  jobId: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<User | null>;
  verifyEmail: (token: string) => Promise<VerifyEmailResponse>;
  claimGuestSession: (sessionToken: string) => Promise<ClaimGuestSessionResponse>;
  checkAndClaimGuestSession: () => Promise<ClaimGuestSessionResponse | null>;
}
