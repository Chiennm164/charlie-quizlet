import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  /** 8–72 characters (BCrypt limit). */
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  /** Token lifetime in seconds. */
  expiresIn: number;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  /** Token lấy từ link trong email (query param `token`). */
  token: string;
  /** 8–72 characters (BCrypt limit). */
  newPassword: string;
}
