import { TestBed } from '@angular/core/testing';
import { APP_SETTINGS } from '../../../core/config';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => jest.useRealTimers());

  it('success / error tạo toast đúng variant', () => {
    service.success('Đã lưu');
    service.error('Lỗi');
    expect(service.toasts().map((t) => [t.message, t.variant])).toEqual([
      ['Đã lưu', 'success'],
      ['Lỗi', 'danger'],
    ]);
  });

  it('tự tắt sau APP_SETTINGS.ui.toastDurationMs', () => {
    service.show('Xin chào');
    jest.advanceTimersByTime(APP_SETTINGS.ui.toastDurationMs - 1);
    expect(service.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it('dismiss chỉ đóng đúng toast được chọn; thời gian tuỳ chỉnh', () => {
    service.show('A', 'info', 10_000);
    service.show('B', 'warning', 10_000);
    service.dismiss(service.toasts()[0].id);
    expect(service.toasts().map((t) => t.message)).toEqual(['B']);
  });
});
