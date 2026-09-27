import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_CODES, HTTP_STATUS } from '../../core/config';
import {
  formatDate,
  formatDuration,
  formatRelativeTime,
  getInitials,
  hasErrorCode,
  isHttpStatus,
  percent,
  toApiError,
  toCsv,
  toFileName,
} from './common.utils';

const httpError = (status: number) => new HttpErrorResponse({ status });

describe('common.utils', () => {
  it('getInitials: lấy chữ cái đầu của các từ cuối', () => {
    expect(getInitials('Nguyễn Văn An')).toBe('VA');
    expect(getInitials('  an  ')).toBe('A');
    expect(getInitials(null)).toBe('');
  });

  it('formatDate: format theo locale, giá trị lỗi trả chuỗi rỗng', () => {
    expect(formatDate('2026-09-26T10:00:00Z', 'vi-VN')).toBe('26/09/2026');
    expect(formatDate('not-a-date', 'vi-VN')).toBe('');
    expect(formatDate(undefined, 'vi-VN')).toBe('');
  });

  it('isHttpStatus: chỉ đúng với HttpErrorResponse có status trong danh sách', () => {
    expect(isHttpStatus(httpError(401), HTTP_STATUS.unauthorized, HTTP_STATUS.forbidden)).toBe(
      true,
    );
    expect(isHttpStatus(httpError(500), HTTP_STATUS.unauthorized)).toBe(false);
    expect(isHttpStatus(new Error('x'), HTTP_STATUS.unauthorized)).toBe(false);
  });

  describe('toApiError / hasErrorCode', () => {
    const beError = new HttpErrorResponse({
      status: 409,
      error: {
        status: 409,
        errorCode: 'AUTH_EMAIL_ALREADY_REGISTERED',
        errorMessage: 'Email này đã được đăng ký',
      },
    });

    it('lỗi BE đúng format -> giữ nguyên mã và message', () => {
      expect(toApiError(beError)).toMatchObject({
        status: 409,
        errorCode: 'AUTH_EMAIL_ALREADY_REGISTERED',
        errorMessage: 'Email này đã được đăng ký',
      });
    });

    it('lỗi không có mã từ BE -> gán mã chung', () => {
      expect(toApiError(httpError(0)).errorCode).toBe(ERROR_CODES.COMMON_NETWORK_ERROR);
      expect(toApiError(new HttpErrorResponse({ status: 502, error: '<html/>' })).errorCode).toBe(
        ERROR_CODES.COMMON_INTERNAL_ERROR,
      );
      expect(toApiError(new Error('js')).errorCode).toBe(ERROR_CODES.COMMON_INTERNAL_ERROR);
    });

    it('hasErrorCode: so khớp mã lỗi', () => {
      expect(hasErrorCode(beError, 'AUTH_EMAIL_ALREADY_REGISTERED')).toBe(true);
      expect(hasErrorCode(beError, 'COMMON_CONFLICT')).toBe(false);
      expect(hasErrorCode(httpError(0), ERROR_CODES.COMMON_NETWORK_ERROR)).toBe(true);
    });
  });
});

describe('formatDuration', () => {
  it('phút:giây, thêm giờ khi >= 1 giờ, âm coi như 0', () => {
    expect(formatDuration(75_000)).toBe('01:15');
    expect(formatDuration(3_725_400)).toBe('1:02:05');
    expect(formatDuration(-5)).toBe('00:00');
  });
});

describe('percent', () => {
  it('làm tròn, mẫu số 0 -> null', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBeNull();
  });
});

describe('toCsv', () => {
  it('có BOM, bọc ngoặc kép ô có dấu phẩy / ngoặc kép / xuống dòng, null -> ô trống', () => {
    const csv = toCsv([
      ['Câu', 'Nội dung'],
      [1, 'a, "b"\nc'],
      [2, null],
    ]);
    expect(csv).toBe('\uFEFFCâu,Nội dung\r\n1,"a, ""b""\nc"\r\n2,');
  });
});

describe('toFileName', () => {
  it('bỏ dấu tiếng Việt, ký tự lạ -> "-", rỗng -> "file"', () => {
    expect(toFileName('Đại số lớp 10!')).toBe('dai-so-lop-10');
    expect(toFileName('***')).toBe('file');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-09-27T12:00:00Z');
  it('đọc lướt: vừa xong / phút / giờ / hôm qua; từ 7 ngày hiện ngày cụ thể', () => {
    expect(formatRelativeTime('2026-09-27T11:59:30Z', 'vi-VN', now)).toBe('bây giờ');
    expect(formatRelativeTime('2026-09-27T11:55:00Z', 'vi-VN', now)).toBe('5 phút trước');
    expect(formatRelativeTime('2026-09-27T09:00:00Z', 'vi-VN', now)).toBe('3 giờ trước');
    expect(formatRelativeTime('2026-09-26T12:00:00Z', 'en-US', now)).toBe('yesterday');
    expect(formatRelativeTime('2026-09-01T12:00:00Z', 'vi-VN', now)).toBe('01/09/2026');
  });
});
