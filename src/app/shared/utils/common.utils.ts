import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_CODES, HTTP_STATUS } from '../../core/config';
import type { ProblemDetail } from '../../core/models';

/* =========================================================
   Hàm tiện ích thuần (không state, không inject) dùng chung toàn app.
   ========================================================= */

/** Chữ cái đầu của các từ cuối trong họ tên (mặc định 2), vd "Nguyễn Văn An" -> "VA". */
export function getInitials(fullName: string | null | undefined, maxLetters = 2): string {
  return (fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-maxLetters)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Format ngày theo locale (vd 'vi-VN' -> 26/09/2026). Giá trị rỗng/không hợp lệ trả ''. */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale, options);
}

/** True nếu `err` là lỗi HTTP có status thuộc danh sách. */
export function isHttpStatus(err: unknown, ...statuses: number[]): err is HttpErrorResponse {
  return err instanceof HttpErrorResponse && statuses.includes(err.status);
}

/**
 * Chuẩn hoá mọi lỗi về dạng ProblemDetail luôn có errorCode:
 * - lỗi BE đúng format -> giữ nguyên (errorMessage/errorDescription đã được BE dịch)
 * - mất kết nối -> COMMON_NETWORK_ERROR
 * - còn lại (proxy trả HTML, lỗi JS...) -> COMMON_INTERNAL_ERROR
 * Hai trường hợp sau không có errorMessage — nơi hiển thị tự lấy câu dịch của FE.
 */
export function toApiError(err: unknown): ProblemDetail {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ProblemDetail> | null;
    if (body && typeof body === 'object' && typeof body.errorCode === 'string') {
      return { ...body, status: err.status } as ProblemDetail;
    }
    if (err.status === HTTP_STATUS.networkError) {
      return { status: err.status, errorCode: ERROR_CODES.COMMON_NETWORK_ERROR };
    }
    return { status: err.status, errorCode: ERROR_CODES.COMMON_INTERNAL_ERROR };
  }
  return { status: 0, errorCode: ERROR_CODES.COMMON_INTERNAL_ERROR };
}

/** True nếu lỗi có mã `code` (vd. ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED). */
export function hasErrorCode(err: unknown, code: string): boolean {
  return toApiError(err).errorCode === code;
}
