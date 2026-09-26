import type { ErrorCode } from '../config/error-codes';

/**
 * Body lỗi BE trả về cho mọi API (RFC 9457 problem detail + 3 trường errorCode/errorMessage/errorDescription).
 * errorMessage/errorDescription đã được BE dịch theo header Accept-Language (lấy từ bảng error_codes).
 */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  /** Mã lỗi nghiệp vụ, vd AUTH_INVALID_CREDENTIALS — dùng để FE rẽ nhánh xử lý. */
  errorCode?: ErrorCode | string;
  /** Câu ngắn hiển thị cho người dùng. */
  errorMessage?: string;
  /** Giải thích / hướng dẫn thêm cho người dùng (có thể null). */
  errorDescription?: string | null;
  /** Field name → message, chỉ có khi errorCode = COMMON_VALIDATION_FAILED. */
  errors?: Record<string, string>;
}
