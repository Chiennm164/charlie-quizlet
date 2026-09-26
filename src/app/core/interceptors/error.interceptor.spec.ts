import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErrorDialogService } from '../error/error-dialog.service';
import { handleErrorCode, markErrorHandled } from '../error/error-handling';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const show = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    show.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ErrorDialogService, useValue: { show } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    jest.useRealTimers();
  });

  /** Gọi API lỗi với callback error của "component", rồi cho dialog (đang hoãn) chạy. */
  const callFailing = (
    status: number,
    errorCode: string,
    onError: (err: unknown) => void = () => undefined,
  ) => {
    http.get('/api/things').subscribe({ error: onError });
    backend.expectOne('/api/things').flush({ errorCode }, { status, statusText: 'Err' });
    jest.runAllTimers();
  };

  it('mặc định: API lỗi -> hiện dialog lỗi chung, lỗi vẫn tới được callback error', () => {
    const onError = jest.fn();
    callFailing(500, 'COMMON_INTERNAL_ERROR', onError);
    expect(onError).toHaveBeenCalled();
    expect(show).toHaveBeenCalledTimes(1);
  });

  it('dev tự xử lý mã lỗi trong callback error -> không hiện dialog', () => {
    const handler = jest.fn();
    callFailing(409, 'AUTH_EMAIL_ALREADY_REGISTERED', (err) =>
      handleErrorCode(err, 'AUTH_EMAIL_ALREADY_REGISTERED', handler),
    );
    expect(handler).toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
  });

  it('mã lỗi khác mã dev xử lý -> vẫn hiện dialog', () => {
    const handler = jest.fn();
    callFailing(500, 'COMMON_INTERNAL_ERROR', (err) =>
      handleErrorCode(err, 'AUTH_EMAIL_ALREADY_REGISTERED', handler),
    );
    expect(handler).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledTimes(1);
  });

  it('markErrorHandled -> tắt dialog cho mọi mã lỗi', () => {
    callFailing(500, 'COMMON_INTERNAL_ERROR', (err) => markErrorHandled(err));
    expect(show).not.toHaveBeenCalled();
  });

  it('phiên hết hạn (COMMON_UNAUTHORIZED) -> không hiện dialog (authInterceptor làm mới phiên)', () => {
    callFailing(401, 'COMMON_UNAUTHORIZED');
    expect(show).not.toHaveBeenCalled();
  });

  it('refresh token hết hạn (AUTH_REFRESH_TOKEN_INVALID) -> không hiện dialog (authInterceptor đưa về login)', () => {
    callFailing(401, 'AUTH_REFRESH_TOKEN_INVALID');
    expect(show).not.toHaveBeenCalled();
  });

  it('401 sai mật khẩu (AUTH_INVALID_CREDENTIALS) -> vẫn hiện dialog', () => {
    callFailing(401, 'AUTH_INVALID_CREDENTIALS');
    expect(show).toHaveBeenCalledTimes(1);
  });
});
