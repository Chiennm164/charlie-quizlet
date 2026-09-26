import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  finalize,
  firstValueFrom,
  map,
  of,
  share,
  tap,
  throwError,
} from 'rxjs';
import { hasErrorCode, isHttpStatus } from '../../shared/utils/common.utils';
import { API_ENDPOINTS, APP_SETTINGS, ERROR_CODES, HTTP_STATUS, STORAGE_KEYS } from '../config';
import { markErrorHandled } from '../error/error-handling';
import { SKIP_GLOBAL_LOADING } from '../interceptors/loading.interceptor';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  Role,
  User,
} from '../models';

const ACCESS_TOKEN_KEY = STORAGE_KEYS.accessToken;
const EXPIRES_AT_KEY = STORAGE_KEYS.tokenExpiresAt;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.refreshToken;

/** Làm mới thất bại với các mã này nghĩa là phiên đã kết thúc (khác lỗi mạng tạm thời) → phải đăng nhập lại. */
const SESSION_ENDED_CODES = [
  ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
  ERROR_CODES.AUTH_ACCOUNT_LOCKED,
  ERROR_CODES.AUTH_ACCOUNT_PENDING,
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);

  /** Request làm mới đang chạy — nhiều request cùng gặp access token hết hạn chỉ làm mới 1 lần. */
  private refreshing: Observable<string> | null = null;

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
      .pipe(tap((res) => this.setSession(res, remember ? localStorage : sessionStorage)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(API_ENDPOINTS.auth.register, request)
      .pipe(tap((res) => this.setSession(res, localStorage)));
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

  /**
   * Gọi lúc khởi động app (F5): còn phiên thì lấy lại thông tin user từ BE
   * (access token đã hết hạn thì authInterceptor làm mới trước khi gọi).
   */
  async restoreSession(): Promise<void> {
    if (!this.getToken() && !this.hasRefreshToken()) return;
    try {
      await firstValueFrom(this.me());
    } catch (err) {
      // Chỉ xoá phiên khi BE xác nhận token không còn hợp lệ; lỗi mạng thì giữ token để lần sau thử lại.
      if (isHttpStatus(err, HTTP_STATUS.unauthorized, HTTP_STATUS.forbidden)) {
        this.logout();
      }
    }
  }

  /**
   * Xoá phiên ở FE và báo BE thu hồi refresh token. Gọi BE chạy ngầm: người dùng không phải chờ,
   * lỗi cũng bỏ qua vì FE đã xoá token, không còn ai dùng được.
   */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    this.clearSession();
    if (!refreshToken) return;

    const body: RefreshTokenRequest = { refreshToken };
    this.http
      .post<void>(API_ENDPOINTS.auth.logout, body, {
        context: new HttpContext().set(SKIP_GLOBAL_LOADING, true),
      })
      .subscribe({ error: (err: unknown) => markErrorHandled(err) });
  }

  /**
   * Đổi refresh token lấy cặp token mới (BE thu hồi refresh token cũ), trả về access token mới.
   * Nhiều nơi gọi cùng lúc dùng chung 1 request. Phiên đã kết thúc (refresh token hết hạn / bị thu hồi,
   * tài khoản bị khoá...) → xoá phiên; lỗi mạng → giữ phiên để lần sau thử lại.
   */
  refresh(): Observable<string> {
    this.refreshing ??= defer(() => this.requestRefresh()).pipe(
      finalize(() => (this.refreshing = null)),
      // Nơi gọi có huỷ (vd. rời trang) thì request vẫn chạy tiếp: BE đã thu hồi refresh token cũ,
      // bỏ dở là mất luôn cặp token mới.
      share({ resetOnRefCountZero: false }),
    );
    return this.refreshing;
  }

  /** Access token nếu còn hạn, không thì null — phiên vẫn còn nếu có refresh token (xem refresh()). */
  getToken(): string | null {
    const storage = this.sessionStore();
    const token = storage.getItem(ACCESS_TOKEN_KEY);
    const expiresAt = Number(storage.getItem(EXPIRES_AT_KEY));
    return token && expiresAt && Date.now() < expiresAt ? token : null;
  }

  hasRefreshToken(): boolean {
    return this.getRefreshToken() !== null;
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private requestRefresh(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken)
      return throwError(() => new Error('No refresh token to refresh the session'));

    const storage = this.sessionStore();
    const body: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(API_ENDPOINTS.auth.refresh, body).pipe(
      map((res) => {
        this.setSession(res, storage);
        return res.accessToken;
      }),
      catchError((err: unknown) => {
        // Tab khác (chung localStorage) vừa làm mới bằng chính refresh token này → dùng token mới của tab đó.
        const latest = this.getToken();
        if (latest && this.getRefreshToken() !== refreshToken) return of(latest);
        if (SESSION_ENDED_CODES.some((code) => hasErrorCode(err, code))) this.clearSession();
        return throwError(() => err);
      }),
    );
  }

  /** Nơi đang giữ phiên: localStorage nếu "ghi nhớ đăng nhập", không thì sessionStorage. */
  private sessionStore(): Storage {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ? localStorage : sessionStorage;
  }

  private getRefreshToken(): string | null {
    return this.sessionStore().getItem(REFRESH_TOKEN_KEY);
  }

  private setSession(res: AuthResponse, storage: Storage): void {
    this.clearSession();
    storage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    storage.setItem(EXPIRES_AT_KEY, String(Date.now() + res.expiresIn * 1000));
    storage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of [ACCESS_TOKEN_KEY, EXPIRES_AT_KEY, REFRESH_TOKEN_KEY]) {
        storage.removeItem(key);
      }
    }
    this.currentUser.set(null);
  }
}
