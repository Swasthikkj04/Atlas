/**
 * Authoritative Public Authentication API DTO Contracts.
 *
 * Strictly decoupled from internal database models.
 */

export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly avatarUrl?: string | null;
  readonly createdAt?: string;
  readonly isEmailVerified?: boolean;
}

export interface LoginCredentialsDto {
  readonly email: string;
  readonly password: string;
}

export interface RegisterCredentialsDto {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword?: string;
}

export interface RegisterResponseDto {
  readonly message: string;
  readonly user: UserDto;
}

export interface AuthResponseDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: UserDto;
}

export interface VerifyEmailResponseDto {
  readonly message: string;
  readonly status: string;
  readonly alreadyVerified?: boolean;
  readonly user?: UserDto;
  readonly accessToken?: string;
  readonly refreshToken?: string;
}

export interface ForgotPasswordRequestDto {
  readonly email: string;
}

export interface ForgotPasswordResponseDto {
  readonly message: string;
  readonly maskedEmail?: string;
}

export interface ResetPasswordSubmitDto {
  readonly token: string;
  readonly password: string;
}

export interface ResetPasswordResponseDto {
  readonly message: string;
  readonly success: boolean;
}
