import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_CODES, HTTP_STATUS } from '../../core/config';
import type { ProblemDetail } from '../../core/models';

/* =========================================================
   Hàm tiện ích thuần (không state, không inject) dùng chung toàn app.
   ========================================================= */

/** Nhãn đáp án theo vị trí: 0 -> "A" … 5 -> "F" (tối đa 6 đáp án, khớp APP_SETTINGS.validation.questionMaxOptions). */
export const OPTION_LETTERS = 'ABCDEF';

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

/** Ngày + giờ:phút theo locale (vd 'vi-VN' -> 26/09/2026 14:05). */
export function formatDateTime(value: string | Date | null | undefined, locale: string): string {
  return formatDate(value, locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60],
  ['hour', 60 * 60],
  ['day', 24 * 60 * 60],
];

/**
 * Thời gian tương đối để đọc lướt ("vừa xong", "5 phút trước", "hôm qua"); từ 7 ngày trở lên hiện ngày cụ thể.
 * `now` truyền vào để test cố định được thời gian.
 */
export function formatRelativeTime(value: string, locale: string, now = Date.now()): string {
  const seconds = Math.round((Date.parse(value) - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs >= 7 * 24 * 60 * 60) return formatDate(value, locale);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < 60) return rtf.format(0, 'second');
  const [unit, size] = [...RELATIVE_UNITS].reverse().find(([, size]) => abs >= size)!;
  return rtf.format(Math.round(seconds / size), unit);
}

/** Tỉ lệ phần trăm làm tròn (0–100); mẫu số 0 -> null (chưa có dữ liệu để tính). */
export function percent(part: number, whole: number): number | null {
  return whole ? Math.round((part / whole) * 100) : null;
}

/** Khoảng thời gian (ms) dạng đồng hồ: 75_000 -> "01:15", 3_725_000 -> "1:02:05". Âm -> "00:00". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const rest = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return h > 0 ? `${h}:${rest}` : rest;
}

/**
 * Bảng -> CSV (dấu phẩy, xuống dòng CRLF, ô có dấu phẩy / ngoặc kép / xuống dòng được bọc ngoặc kép). Có BOM ở đầu
 * để Excel mở đúng tiếng Việt (UTF-8).
 */
export function toCsv(rows: (string | number | null)[][]): string {
  const cell = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

/** Tải 1 file tạo trên trình duyệt (CSV, Excel...) về máy người dùng. */
export function downloadFile(content: Blob, fileName: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Tên file an toàn từ tiêu đề: bỏ dấu tiếng Việt, ký tự lạ -> "-" ("Đại số 10!" -> "dai-so-10"). */
export function toFileName(title: string): string {
  const name = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return name || 'file';
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
