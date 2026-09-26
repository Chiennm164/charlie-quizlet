import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TranslateService } from '../i18n/translate.service';
import { localeInterceptor } from './locale.interceptor';

describe('localeInterceptor', () => {
  const locale = signal<'vn' | 'en'>('vn');
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([localeInterceptor])),
        provideHttpClientTesting(),
        { provide: TranslateService, useValue: { locale } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('gửi Accept-Language theo ngôn ngữ đang chọn (vn -> vi, en -> en)', () => {
    locale.set('vn');
    http.get(`${environment.apiUrl}/a`).subscribe();
    expect(
      backend.expectOne(`${environment.apiUrl}/a`).request.headers.get('Accept-Language'),
    ).toBe('vi');

    locale.set('en');
    http.get(`${environment.apiUrl}/b`).subscribe();
    expect(
      backend.expectOne(`${environment.apiUrl}/b`).request.headers.get('Accept-Language'),
    ).toBe('en');
  });

  it('không đụng vào request ra ngoài BE (vd. file dịch)', () => {
    http.get('/i18n/vn.json').subscribe();
    expect(backend.expectOne('/i18n/vn.json').request.headers.has('Accept-Language')).toBe(false);
  });
});
