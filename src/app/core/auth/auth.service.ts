import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { isHttpStatus } from '../../shared/utils/common.utils';
import { API_ENDPOINTS, APP_SETTINGS, HTTP_STATUS, STORAGE_KEYS } from '../config';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  Role,
  User,
} from '../models';

const TOKEN_KEY = STORAGE_KEYS.accessToken;
const EXPIRES_AT_KEY = STORAGE_KEYS.tokenExpiresAt;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);

  /**
   * @param remember true: giữ đăng nhập sau khi đóng trình duyệt (localStorage);
   *                 false: chỉ trong phiên hiện tại, đóng trình duyệt là phải đăng nhập lại (sessionStorage).
   */
  login(
    request: LoginRequest,
    remember: boolean = APP_SETTINGS.auth.rememberMeDefault,
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(API_ENDPOINTS.auth.login, request)
      .pipe(tap((res) => this.setSession(res, remember)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(API_ENDPOINTS.auth.register, request)
      .pipe(tap((res) => this.setSession(res, true)));
  }

  /** Luôn trả 204 dù email có tồn tại hay không (tránh dò email). */
  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.auth.forgotPassword, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.auth.resetPassword, request);
  }

  me(): Observable<User> {
    return this.http
      .get<User>(API_ENDPOINTS.auth.me)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Gọi lúc khởi động app (F5): nếu còn token thì lấy lại thông tin user từ BE. */
  async restoreSession(): Promise<void> {
    if (!this.getToken()) return;
    try {
      await firstValueFrom(this.me());
    } catch (err) {
      // Chỉ xoá phiên khi BE xác nhận token không còn hợp lệ; lỗi mạng thì giữ token để lần sau thử lại.
      if (isHttpStatus(err, HTTP_STATUS.unauthorized, HTTP_STATUS.forbidden)) {
        this.logout();
      }
    }
  }

  logout(): void {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(EXPIRES_AT_KEY);
    }
    this.currentUser.set(null);
  }

  /** Trả về access token nếu còn hạn; token hết hạn sẽ bị xoá và trả về null. */
  getToken(): string | null {
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    const token = storage.getItem(TOKEN_KEY);
    const expiresAt = Number(storage.getItem(EXPIRES_AT_KEY));
    if (!token || !expiresAt || Date.now() >= expiresAt) {
      if (token) this.logout();
      return null;
    }
    return token;
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private setSession(res: AuthResponse, remember: boolean): void {
    this.logout();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, res.accessToken);
    storage.setItem(EXPIRES_AT_KEY, String(Date.now() + res.expiresIn * 1000));
    this.currentUser.set(res.user);
  }
}
