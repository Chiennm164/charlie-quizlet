import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { STORAGE_KEYS } from '../config';
import { AuthResponse } from '../models';
import { AuthService } from './auth.service';

const API = environment.apiUrl;

function authResponse(accessToken: string, refreshToken: string): AuthResponse {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshToken,
    user: {
      id: 1,
      email: 'alice@example.com',
      fullName: 'Alice',
      role: 'STUDENT',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
    },
  };
}

const RESPONSE = authResponse('token-123', 'refresh-123');
const REFRESH_TOKEN_INVALID = { errorCode: 'AUTH_REFRESH_TOKEN_INVALID' };
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };
const NO_CONTENT = { status: 204, statusText: 'No Content' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function login(remember: boolean): void {
    service.login({ email: 'alice@example.com', password: 'secret123' }, remember).subscribe();
    http.expectOne(`${API}/auth/login`).flush(RESPONSE);
  }

  it('đăng ký Student: có phiên đăng nhập ngay', () => {
    service
      .register({
        email: 'alice@example.com',
        password: 'secret123',
        fullName: 'Alice',
        role: 'STUDENT',
      })
      .subscribe();
    http.expectOne(`${API}/auth/register`).flush({ user: RESPONSE.user, session: RESPONSE });

    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBe('token-123');
    expect(service.currentUser()?.email).toBe('alice@example.com');
  });

  it('đăng ký Teacher chờ duyệt: không tạo phiên', () => {
    let pending: string | undefined;
    service
      .register({
        email: 'bob@example.com',
        password: 'secret123',
        fullName: 'Bob',
        role: 'TEACHER',
      })
      .subscribe((res) => (pending = res.user.status));
    http
      .expectOne(`${API}/auth/register`)
      .flush({ user: { ...RESPONSE.user, role: 'TEACHER', status: 'PENDING' }, session: null });

    expect(pending).toBe('PENDING');
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
    expect(service.hasRefreshToken()).toBe(false);
  });

  it('lưu token vào localStorage khi "ghi nhớ đăng nhập"', () => {
    login(true);

    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBe('token-123');
    expect(localStorage.getItem(STORAGE_KEYS.refreshToken)).toBe('refresh-123');
    expect(sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
    expect(service.getToken()).toBe('token-123');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('lưu token vào sessionStorage khi không ghi nhớ', () => {
    login(false);

    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBe('token-123');
    expect(sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBe('refresh-123');
    expect(service.getToken()).toBe('token-123');
  });

  it('access token hết hạn -> getToken trả null nhưng giữ refresh token để làm mới', () => {
    login(true);
    localStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(Date.now() - 1000));

    expect(service.getToken()).toBeNull();
    expect(service.hasRefreshToken()).toBe(true);
  });

  it('refresh: lưu cặp token mới vào đúng storage đang dùng, trả access token mới', () => {
    login(false);
    let newToken: string | undefined;

    service.refresh().subscribe((token) => (newToken = token));
    const req = http.expectOne(`${API}/auth/refresh`);
    expect(req.request.body).toEqual({ refreshToken: 'refresh-123' });
    req.flush(authResponse('token-456', 'refresh-456'));

    expect(newToken).toBe('token-456');
    expect(sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBe('refresh-456');
    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
    expect(service.getToken()).toBe('token-456');
  });

  it('refresh: nhiều nơi gọi cùng lúc chỉ gửi 1 request', () => {
    login(true);
    const tokens: string[] = [];

    service.refresh().subscribe((token) => tokens.push(token));
    service.refresh().subscribe((token) => tokens.push(token));
    http.expectOne(`${API}/auth/refresh`).flush(authResponse('token-456', 'refresh-456'));

    expect(tokens).toEqual(['token-456', 'token-456']);
  });

  it('refresh: nơi gọi huỷ giữa chừng -> request vẫn chạy tiếp và lưu token mới', () => {
    login(true);

    service.refresh().subscribe().unsubscribe();
    http.expectOne(`${API}/auth/refresh`).flush(authResponse('token-456', 'refresh-456'));

    expect(service.getToken()).toBe('token-456');
  });

  it('refresh: refresh token không còn hợp lệ -> xoá phiên', () => {
    login(true);

    service.refresh().subscribe({ error: () => undefined });
    http.expectOne(`${API}/auth/refresh`).flush(REFRESH_TOKEN_INVALID, UNAUTHORIZED);

    expect(service.hasRefreshToken()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('refresh: lỗi mạng -> giữ phiên để lần sau thử lại', () => {
    login(true);

    service.refresh().subscribe({ error: () => undefined });
    http.expectOne(`${API}/auth/refresh`).error(new ProgressEvent('error'), { status: 0 });

    expect(service.hasRefreshToken()).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('refresh: tab khác vừa làm mới trước -> dùng token mới của tab đó, không xoá phiên', () => {
    login(true);
    let newToken: string | undefined;

    service.refresh().subscribe((token) => (newToken = token));
    // Tab khác (chung localStorage) làm mới xong trước nên BE từ chối refresh token cũ của tab này.
    localStorage.setItem(STORAGE_KEYS.accessToken, 'token-other-tab');
    localStorage.setItem(STORAGE_KEYS.refreshToken, 'refresh-other-tab');
    localStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(Date.now() + 60_000));
    http.expectOne(`${API}/auth/refresh`).flush(REFRESH_TOKEN_INVALID, UNAUTHORIZED);

    expect(newToken).toBe('token-other-tab');
    expect(service.hasRefreshToken()).toBe(true);
  });

  it('logout: xoá phiên ở cả 2 storage và báo BE thu hồi refresh token', () => {
    login(false);
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.hasRefreshToken()).toBe(false);
    expect(service.currentUser()).toBeNull();
    const req = http.expectOne(`${API}/auth/logout`);
    expect(req.request.body).toEqual({ refreshToken: 'refresh-123' });
    req.flush(null, NO_CONTENT);
  });

  it('restoreSession chỉ xoá phiên khi BE trả 401, giữ token khi lỗi mạng', async () => {
    login(true);

    const networkError = service.restoreSession();
    http.expectOne(`${API}/auth/me`).error(new ProgressEvent('error'), { status: 0 });
    await networkError;
    expect(service.getToken()).toBe('token-123');

    const unauthorized = service.restoreSession();
    http.expectOne(`${API}/auth/me`).flush(null, UNAUTHORIZED);
    await unauthorized;
    expect(service.getToken()).toBeNull();
    http.expectOne(`${API}/auth/logout`).flush(null, NO_CONTENT);
  });

  it('restoreSession: access token hết hạn nhưng còn refresh token -> vẫn khôi phục phiên', async () => {
    localStorage.setItem(STORAGE_KEYS.accessToken, 'old');
    localStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(Date.now() - 1000));
    localStorage.setItem(STORAGE_KEYS.refreshToken, 'refresh-123');

    const restoring = service.restoreSession();
    http.expectOne(`${API}/auth/me`).flush(RESPONSE.user);
    await restoring;

    expect(service.isAuthenticated()).toBe(true);
  });
});
