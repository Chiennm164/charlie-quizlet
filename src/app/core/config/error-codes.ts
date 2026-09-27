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
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_ALREADY_REGISTERED: 'AUTH_EMAIL_ALREADY_REGISTERED',
  AUTH_RESET_TOKEN_INVALID: 'AUTH_RESET_TOKEN_INVALID',
  /** Refresh token hết hạn / đã thu hồi: phiên đã kết thúc, phải đăng nhập lại. */
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_CURRENT_PASSWORD_INCORRECT: 'AUTH_CURRENT_PASSWORD_INCORRECT',
  /** Bộ đề không tồn tại, hoặc là nháp mà người xem không phải Admin. */
  QUIZ_NOT_FOUND: 'QUIZ_NOT_FOUND',
  QUIZ_CORRECT_OPTION_REQUIRED: 'QUIZ_CORRECT_OPTION_REQUIRED',
  QUIZ_DUPLICATE_OPTION: 'QUIZ_DUPLICATE_OPTION',
  QUIZ_EMPTY: 'QUIZ_EMPTY',
  QUIZ_ITEM_NOT_FOUND: 'QUIZ_ITEM_NOT_FOUND',
  /** Lượt làm không tồn tại / không phải của mình / đã bị huỷ khi bắt đầu lượt mới. */
  ATTEMPT_NOT_FOUND: 'ATTEMPT_NOT_FOUND',
  ATTEMPT_ALREADY_SUBMITTED: 'ATTEMPT_ALREADY_SUBMITTED',
  /** Quá giờ: BE đã tự nộp bài -> tải lại để xem kết quả. */
  ATTEMPT_TIME_UP: 'ATTEMPT_TIME_UP',
  ATTEMPT_ANSWER_LOCKED: 'ATTEMPT_ANSWER_LOCKED',
  ATTEMPT_INVALID_ANSWER: 'ATTEMPT_INVALID_ANSWER',
  ATTEMPT_NOTHING_TO_RETRY: 'ATTEMPT_NOTHING_TO_RETRY',
  TOPIC_NOT_FOUND: 'TOPIC_NOT_FOUND',
  /** Tên chủ đề trùng (không phân biệt hoa thường) -> báo dưới ô tên. */
  TOPIC_NAME_TAKEN: 'TOPIC_NAME_TAKEN',
  TOPIC_IN_USE: 'TOPIC_IN_USE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Mã hiển thị cho lỗi FE tự gán (không có phản hồi của BE). Cùng dạng MCN-GG-NN với BE (enum ErrorCode):
 * lỗi không rõ dùng lại mã COMMON_INTERNAL_ERROR của BE, mất kết nối dùng MCN-00-99 (BE không cấp số này).
 */
export const FE_ERROR_DISPLAY_CODES: Partial<Record<ErrorCode, string>> = {
  COMMON_NETWORK_ERROR: 'MCN-00-99',
  COMMON_INTERNAL_ERROR: 'MCN-00-07',
};
