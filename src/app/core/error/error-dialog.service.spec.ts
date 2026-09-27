import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '../i18n/translate.service';
import { ErrorDialogService } from './error-dialog.service';

describe('ErrorDialogService', () => {
  let service: ErrorDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: { t: (key: string) => `t:${key}` } }],
    });
    service = TestBed.inject(ErrorDialogService);
  });

  it('lỗi BE: hiển thị message/description/mã lỗi và lỗi theo field', () => {
    service.show(
      new HttpErrorResponse({
        status: 400,
        error: {
          errorCode: 'COMMON_VALIDATION_FAILED',
          errorDisplayCode: 'MCN-00-02',
          errorMessage: 'Dữ liệu không hợp lệ',
          errorDescription: 'Kiểm tra lại.',
          errors: { email: 'sai định dạng' },
        },
      }),
    );

    expect(service.data()).toEqual({
      title: 'Dữ liệu không hợp lệ',
      description: 'Kiểm tra lại.',
      displayCode: 'MCN-00-02',
      fieldErrors: [{ field: 'email', message: 'sai định dạng' }],
    });
  });

  it('mất kết nối -> thông báo không kết nối được máy chủ, mã FE tự gán MCN-00-99', () => {
    service.show(new HttpErrorResponse({ status: 0 }));
    expect(service.data()).toMatchObject({
      title: 't:common.serverUnavailable',
      description: 't:common.serverUnavailableDescription',
      displayCode: 'MCN-00-99',
    });
  });

  it('lỗi không theo format BE -> thông báo chung; close() đóng dialog', () => {
    service.show(new HttpErrorResponse({ status: 502, error: '<html>Bad gateway</html>' }));
    expect(service.data()?.title).toBe('t:common.errorTitle');
    expect(service.data()?.displayCode).toBe('MCN-00-07');

    service.close();
    expect(service.isOpen()).toBe(false);
  });
});
