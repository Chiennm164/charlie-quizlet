import { environment } from '../../../environments/environment';

/** Mọi URL gọi BE — service dùng hằng số này, không tự ghép chuỗi URL. */
const AUTH_BASE = `${environment.apiUrl}/auth`;

export const API_ENDPOINTS = {
  auth: {
    base: AUTH_BASE,
    login: `${AUTH_BASE}/login`,
    register: `${AUTH_BASE}/register`,
    forgotPassword: `${AUTH_BASE}/forgot-password`,
    resetPassword: `${AUTH_BASE}/reset-password`,
    me: `${AUTH_BASE}/me`,
  },
} as const;
