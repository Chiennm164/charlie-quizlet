/** Mọi key localStorage/sessionStorage của app, dùng chung tiền tố `cq_` để không đụng app khác cùng domain. */
export const STORAGE_KEYS = {
  accessToken: 'cq_access_token',
  tokenExpiresAt: 'cq_token_expires_at',
  locale: 'cq_locale',
} as const;
