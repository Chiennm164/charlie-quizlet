/** Mã HTTP status dùng khi xử lý lỗi từ BE. */
export const HTTP_STATUS = {
  /** HttpClient trả status 0 khi không kết nối được server (mất mạng, BE tắt, CORS...). */
  networkError: 0,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  conflict: 409,
} as const;
