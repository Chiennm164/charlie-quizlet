import type { ErrorCode } from '../config/error-codes';

/**
 * Body lỗi BE trả về cho mọi API (RFC 9457 problem detail + errorCode / errorDisplayCode / errorMessage / errorDescription).
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
  /** Mã hiện cho người dùng, dạng MCN-GG-NN (vd MCN-02-01) — không rẽ nhánh theo mã này. */
  errorDisplayCode?: string;
  /** Câu ngắn hiển thị cho người dùng. */
  errorMessage?: string;
  /** Giải thích / hướng dẫn thêm cho người dùng (có thể null). */
  errorDescription?: string | null;
  /** Field name → message, chỉ có khi errorCode = COMMON_VALIDATION_FAILED. */
  errors?: Record<string, string>;
}
