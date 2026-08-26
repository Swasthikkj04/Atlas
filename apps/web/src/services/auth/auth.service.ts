import { apiClient } from '../api/client';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
  AuthResponse,
  VerifyEmailResponse,
  ResetPasswordCredentials,
} from '../../types/auth.types';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse, LoginCredentials>(
      '/api/v1/auth/login',
      credentials
    );
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse, RegisterCredentials>(
      '/api/v1/auth/register',
      credentials
    );
  }

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/api/v1/auth/me');
  }

  async updateProfile(data: { fullName: string }): Promise<User> {
    return apiClient.patch<User, { fullName: string }>(
      '/api/v1/users/profile',
      data
    );
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      '/api/v1/auth/change-password',
      data
    );
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return apiClient.post<VerifyEmailResponse, { token: string }>(
      '/api/v1/auth/verify-email',
      { token }
    );
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }, { email: string }>(
      '/api/v1/auth/resend-verification',
      { email }
    );
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }, { email: string }>(
      '/api/v1/auth/forgot-password',
      { email }
    );
  }

  async resetPassword(credentials: ResetPasswordCredentials): Promise<{ message: string }> {
    return apiClient.post<{ message: string }, ResetPasswordCredentials>(
      '/api/v1/auth/reset-password',
      credentials
    );
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    return apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh'
    );
  }

  async logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/v1/auth/logout');
  }

  async logoutAll(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/v1/auth/logout-all');
  }

  async getSessions(): Promise<import('../../features/settings/contracts/session-management.contract').UserSession[]> {
    return apiClient.get<import('../../features/settings/contracts/session-management.contract').UserSession[]>(
      '/api/v1/auth/sessions'
    );
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/api/v1/auth/sessions/${sessionId}`
    );
  }

  getGoogleOAuthUrl(): string {
    return '/api/v1/auth/google';
  }

  getGitHubOAuthUrl(): string {
    return '/api/v1/auth/github';
  }

  async getConnectedProviders(): Promise<import('../../features/settings/contracts/connected-accounts.contract').ConnectedProvidersResponse> {
    return apiClient.get<import('../../features/settings/contracts/connected-accounts.contract').ConnectedProvidersResponse>(
      '/api/v1/auth/providers'
    );
  }

  async requestReactivation(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/v1/auth/reactivate/request', {
      email,
    });
  }

  async confirmReactivation(token: string): Promise<{
    message: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  }> {
    return apiClient.post<{
      message: string;
      accessToken?: string;
      refreshToken?: string;
      user?: User;
    }>('/api/v1/auth/reactivate/confirm', { token });
  }
}

export const authService = new AuthService();
