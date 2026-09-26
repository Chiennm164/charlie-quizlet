import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: string | null;
  const logout = jest.fn();

  beforeEach(() => {
    token = 'token-123';
    logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => token, logout } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('gắn Bearer token vào request gọi BE', () => {
    http.get(`${environment.apiUrl}/things`).subscribe();
    expect(
      backend.expectOne(`${environment.apiUrl}/things`).request.headers.get('Authorization'),
    ).toBe('Bearer token-123');
  });

  it('không gắn token cho request ra ngoài BE (vd. file i18n)', () => {
    http.get('/i18n/vn.json').subscribe();
    expect(backend.expectOne('/i18n/vn.json').request.headers.has('Authorization')).toBe(false);
  });

  it('401 ở API cần đăng nhập -> đăng xuất và về /login', () => {
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get(`${environment.apiUrl}/things`).subscribe({ error: () => undefined });
    backend
      .expectOne(`${environment.apiUrl}/things`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('401 ở /auth/login là lỗi sai mật khẩu -> không đăng xuất', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });
    backend
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
  });
});
