import { environment } from '../../../environments/environment';

/** Mọi URL gọi BE — service dùng hằng số này, không tự ghép chuỗi URL. */
const AUTH_BASE = `${environment.apiUrl}/auth`;
const QUIZZES_BASE = `${environment.apiUrl}/quizzes`;
const ADMIN_BASE = `${environment.apiUrl}/admin`;
const ATTEMPTS_BASE = `${environment.apiUrl}/attempts`;
const ME_BASE = `${environment.apiUrl}/me`;

export const API_ENDPOINTS = {
  auth: {
    login: `${AUTH_BASE}/login`,
    register: `${AUTH_BASE}/register`,
    forgotPassword: `${AUTH_BASE}/forgot-password`,
    resetPassword: `${AUTH_BASE}/reset-password`,
    refresh: `${AUTH_BASE}/refresh`,
    logout: `${AUTH_BASE}/logout`,
    /** GET: user hiện tại; PATCH: sửa hồ sơ. */
    me: `${AUTH_BASE}/me`,
    changePassword: `${AUTH_BASE}/change-password`,
  },
  topics: `${environment.apiUrl}/topics`,
  quizzes: {
    /** GET: đề đã xuất bản (lọc topicId, q, sort, page, size). */
    base: QUIZZES_BASE,
    /** Home: đề đã xuất bản nhóm theo chủ đề. */
    byTopic: `${QUIZZES_BASE}/by-topic`,
    detail: (id: number) => `${QUIZZES_BASE}/${id}`,
    /** POST: bắt đầu lượt làm; GET: lịch sử làm của người gọi. */
    attempts: (id: number) => `${QUIZZES_BASE}/${id}/attempts`,
  },
  /** Dữ liệu riêng của người đăng nhập. */
  me: {
    /** GET: lịch sử làm bài (status, mode, topicId, page, size). */
    attempts: `${ME_BASE}/attempts`,
    /** GET: điểm cao nhất / lượt dở theo đề + id đề yêu thích. */
    quizMarks: `${ME_BASE}/quiz-marks`,
    /** PUT: thêm yêu thích; DELETE: bỏ. */
    favorite: (quizId: number) => `${ME_BASE}/favorites/${quizId}`,
  },
  /** Lượt làm bài — chỉ người làm xem được. */
  attempts: {
    detail: (id: number) => `${ATTEMPTS_BASE}/${id}`,
    answer: (id: number, questionId: number) => `${ATTEMPTS_BASE}/${id}/answers/${questionId}`,
    submit: (id: number) => `${ATTEMPTS_BASE}/${id}/submit`,
  },
  /** Chỉ ADMIN. Tạo / sửa / xoá bộ đề dùng `quizzes.base` / `quizzes.detail` (BE chặn theo role). */
  admin: {
    quizzes: `${ADMIN_BASE}/quizzes`,
    quizStats: (id: number) => `${ADMIN_BASE}/quizzes/${id}/stats`,
    topics: `${ADMIN_BASE}/topics`,
    topic: (id: number) => `${ADMIN_BASE}/topics/${id}`,
  },
} as const;

/**
 * API không cần đăng nhập (khớp `ApiPaths.PUBLIC_POST` ở BE): authInterceptor không gắn token, không làm mới phiên.
 * 401 ở đây là lỗi nghiệp vụ (vd. sai mật khẩu), không phải phiên hết hạn.
 */
export const PUBLIC_API_ENDPOINTS: readonly string[] = [
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.register,
  API_ENDPOINTS.auth.forgotPassword,
  API_ENDPOINTS.auth.resetPassword,
  API_ENDPOINTS.auth.refresh,
  API_ENDPOINTS.auth.logout,
];
