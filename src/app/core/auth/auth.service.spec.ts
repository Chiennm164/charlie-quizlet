import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { STORAGE_KEYS } from '../config';
import { AuthResponse } from '../models';
import { AuthService } from './auth.service';

const RESPONSE: AuthResponse = {
  accessToken: 'token-123',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: {
    id: 1,
    email: 'alice@example.com',
    fullName: 'Alice',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
};

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
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(RESPONSE);
  }

  it('lưu token vào localStorage khi "ghi nhớ đăng nhập"', () => {
    login(true);

    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBe('token-123');
    expect(sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
    expect(service.getToken()).toBe('token-123');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('lưu token vào sessionStorage khi không ghi nhớ', () => {
    login(false);

    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBe('token-123');
    expect(service.getToken()).toBe('token-123');
  });

  it('xoá token đã hết hạn và trả null', () => {
    localStorage.setItem(STORAGE_KEYS.accessToken, 'old');
    localStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(Date.now() - 1000));

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  });

  it('logout xoá phiên ở cả 2 storage', () => {
    login(false);
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('restoreSession chỉ xoá phiên khi BE trả 401, giữ token khi lỗi mạng', async () => {
    login(true);

    const networkError = service.restoreSession();
    http
      .expectOne(`${environment.apiUrl}/auth/me`)
      .error(new ProgressEvent('error'), { status: 0 });
    await networkError;
    expect(service.getToken()).toBe('token-123');

    const unauthorized = service.restoreSession();
    http
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await unauthorized;
    expect(service.getToken()).toBeNull();
  });
});
