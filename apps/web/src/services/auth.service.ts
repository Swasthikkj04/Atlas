import { apiClient } from '../lib/api-client';
import type {
  UserDto,
  LoginCredentialsDto,
  RegisterCredentialsDto,
  RegisterResponseDto,
  AuthResponseDto,
  VerifyEmailResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  ResetPasswordSubmitDto,
  ResetPasswordResponseDto,
} from '../types/api';

export const authService = {
  getCurrentUser: (signal?: AbortSignal) =>
    apiClient.get<UserDto>('/auth/me', { signal }),

  login: (credentials: LoginCredentialsDto) =>
    apiClient.post<AuthResponseDto>('/auth/login', credentials),

  register: (credentials: RegisterCredentialsDto) =>
    apiClient.post<RegisterResponseDto>('/auth/register', credentials),

  logout: () => apiClient.post<{ success: boolean }>('/auth/logout'),

  verifyEmail: (token: string) =>
    apiClient.get<VerifyEmailResponseDto>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  requestPasswordReset: (payload: ForgotPasswordRequestDto) =>
    apiClient.post<ForgotPasswordResponseDto>('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordSubmitDto) =>
    apiClient.post<ResetPasswordResponseDto>('/auth/reset-password', payload),
};
