/**
 * Mã lỗi BE trả về (khớp enum ErrorCode + bảng error_codes ở charlie-quizlet-be).
 * FE chỉ dùng để rẽ nhánh xử lý (vd. gắn lỗi vào đúng ô input); nội dung thông báo lấy từ BE.
 * Lỗi không có mã từ BE sẽ được gán mã chung: COMMON_NETWORK_ERROR (mất kết nối) hoặc COMMON_INTERNAL_ERROR.
 */
export const ERROR_CODES = {
  COMMON_BAD_REQUEST: 'COMMON_BAD_REQUEST',
  COMMON_VALIDATION_FAILED: 'COMMON_VALIDATION_FAILED',
  COMMON_UNAUTHORIZED: 'COMMON_UNAUTHORIZED',
  COMMON_FORBIDDEN: 'COMMON_FORBIDDEN',
  COMMON_NOT_FOUND: 'COMMON_NOT_FOUND',
  COMMON_CONFLICT: 'COMMON_CONFLICT',
  COMMON_INTERNAL_ERROR: 'COMMON_INTERNAL_ERROR',
  /** Chỉ có ở FE: không gọi được BE (mất mạng, BE tắt, CORS...). */
  COMMON_NETWORK_ERROR: 'COMMON_NETWORK_ERROR',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_PENDING: 'AUTH_ACCOUNT_PENDING',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_ALREADY_REGISTERED: 'AUTH_EMAIL_ALREADY_REGISTERED',
  AUTH_RESET_TOKEN_INVALID: 'AUTH_RESET_TOKEN_INVALID',
  /** Refresh token hết hạn / đã thu hồi: phiên đã kết thúc, phải đăng nhập lại. */
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
