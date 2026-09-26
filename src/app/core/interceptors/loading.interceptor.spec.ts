import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GlobalLoadingService } from '../../shared/ui/global-loading/global-loading.service';
import { SKIP_GLOBAL_LOADING, loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let loading: GlobalLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(GlobalLoadingService);
  });

  afterEach(() => backend.verify());

  it('bật loading khi đang có request, tắt khi tất cả xong (kể cả lỗi)', () => {
    http.get('/a').subscribe();
    http.get('/b').subscribe({ error: () => undefined });
    expect(loading.loading()).toBe(true);

    backend.expectOne('/a').flush({});
    expect(loading.loading()).toBe(true);

    backend.expectOne('/b').flush(null, { status: 500, statusText: 'Err' });
    expect(loading.loading()).toBe(false);
  });

  it('request có SKIP_GLOBAL_LOADING không bật loading', () => {
    http.get('/bg', { context: new HttpContext().set(SKIP_GLOBAL_LOADING, true) }).subscribe();
    expect(loading.loading()).toBe(false);
    backend.expectOne('/bg').flush({});
  });
});
