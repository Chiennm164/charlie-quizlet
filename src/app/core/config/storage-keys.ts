/** Mọi key localStorage/sessionStorage của app, dùng chung tiền tố `cq_` để không đụng app khác cùng domain. */
export const STORAGE_KEYS = {
  accessToken: 'cq_access_token',
  tokenExpiresAt: 'cq_token_expires_at',
  refreshToken: 'cq_refresh_token',
  locale: 'cq_locale',
  /** Cách xem trang Bộ đề người dùng chọn lần trước: 'group' | 'list'. */
  quizView: 'cq_quiz_view',
} as const;
