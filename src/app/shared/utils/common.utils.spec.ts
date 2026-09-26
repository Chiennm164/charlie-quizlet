import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_CODES, HTTP_STATUS } from '../../core/config';
import { formatDate, getInitials, hasErrorCode, isHttpStatus, toApiError } from './common.utils';

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
