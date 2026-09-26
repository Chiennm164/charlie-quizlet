import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { STORAGE_KEYS } from '../config';
import { AuthResponse } from '../models';
import { authInterceptor } from './auth.interceptor';

const API = environment.apiUrl;
const THINGS = `${API}/things`;
const REFRESH = `${API}/auth/refresh`;
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

function tokens(accessToken: string, refreshToken: string): AuthResponse {
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

/** Dùng AuthService thật để test đúng luồng làm mới phiên (interceptor + AuthService + storage). */
describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let navigate: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    // Đã đăng nhập (ghi nhớ): access token 'access-1', refresh token 'refresh-1'.
    auth.login({ email: 'alice@example.com', password: 'secret123' }, true).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(tokens('access-1', 'refresh-1'));
  });

  afterEach(() => backend.verify());

  const bearer = (req: TestRequest) => req.request.headers.get('Authorization');
  const failWith = (req: TestRequest, errorCode: string) => req.flush({ errorCode }, UNAUTHORIZED);

  it('gắn Bearer token vào request gọi BE', () => {
    http.get(THINGS).subscribe();
    expect(bearer(backend.expectOne(THINGS))).toBe('Bearer access-1');
  });

  it('không gắn token cho request ra ngoài BE (vd. file i18n) và API công khai', () => {
    http.get('/i18n/vn.json').subscribe();
    http.post(`${API}/auth/forgot-password`, {}).subscribe();

    expect(bearer(backend.expectOne('/i18n/vn.json'))).toBeNull();
    expect(bearer(backend.expectOne(`${API}/auth/forgot-password`))).toBeNull();
  });

  it('access token đã hết hạn -> làm mới trước rồi mới gửi request', () => {
    localStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(Date.now() - 1000));
    http.get(THINGS).subscribe();

    const refresh = backend.expectOne(REFRESH);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(tokens('access-2', 'refresh-2'));

    expect(bearer(backend.expectOne(THINGS))).toBe('Bearer access-2');
  });

  it('401 COMMON_UNAUTHORIZED -> làm mới rồi gửi lại request bằng token mới', () => {
    let body: unknown;
    http.get(THINGS).subscribe((res) => (body = res));

    failWith(backend.expectOne(THINGS), 'COMMON_UNAUTHORIZED');
    backend.expectOne(REFRESH).flush(tokens('access-2', 'refresh-2'));
    const retry = backend.expectOne(THINGS);
    expect(bearer(retry)).toBe('Bearer access-2');
    retry.flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });

  it('nhiều request cùng bị 401 -> chỉ làm mới 1 lần, cả 2 được gửi lại', () => {
    http.get(`${API}/a`).subscribe();
    http.get(`${API}/b`).subscribe();

    failWith(backend.expectOne(`${API}/a`), 'COMMON_UNAUTHORIZED');
    failWith(backend.expectOne(`${API}/b`), 'COMMON_UNAUTHORIZED');
    backend.expectOne(REFRESH).flush(tokens('access-2', 'refresh-2'));

    expect(bearer(backend.expectOne(`${API}/a`))).toBe('Bearer access-2');
    expect(bearer(backend.expectOne(`${API}/b`))).toBe('Bearer access-2');
  });

  it('phiên đã kết thúc (refresh token hết hạn) -> đăng xuất, về /login, lỗi trả về nơi gọi', () => {
    const onError = jest.fn();
    http.get(THINGS).subscribe({ error: onError });

    failWith(backend.expectOne(THINGS), 'COMMON_UNAUTHORIZED');
    failWith(backend.expectOne(REFRESH), 'AUTH_REFRESH_TOKEN_INVALID');

    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
    expect(onError).toHaveBeenCalled();
  });

  it('làm mới bị lỗi mạng -> giữ phiên, không về /login', () => {
    http.get(THINGS).subscribe({ error: () => undefined });

    failWith(backend.expectOne(THINGS), 'COMMON_UNAUTHORIZED');
    backend.expectOne(REFRESH).error(new ProgressEvent('error'), { status: 0 });

    expect(auth.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('401 mà không có refresh token để làm mới -> đăng xuất, về /login', () => {
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    http.get(THINGS).subscribe({ error: () => undefined });

    failWith(backend.expectOne(THINGS), 'COMMON_UNAUTHORIZED');

    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('401 mã khác (vd. AUTH_USER_NOT_FOUND) -> trả lỗi, không làm mới', () => {
    http.get(`${API}/auth/me`).subscribe({ error: () => undefined });
    failWith(backend.expectOne(`${API}/auth/me`), 'AUTH_USER_NOT_FOUND');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('401 ở /auth/login là lỗi sai mật khẩu -> không làm mới, không đăng xuất', () => {
    http.post(`${API}/auth/login`, {}).subscribe({ error: () => undefined });
    failWith(backend.expectOne(`${API}/auth/login`), 'AUTH_INVALID_CREDENTIALS');

    expect(auth.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
