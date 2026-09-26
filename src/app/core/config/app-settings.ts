/**
 * Cấu hình hành vi của app (không phụ thuộc môi trường). Muốn đổi mặc định/ngưỡng/giới hạn
 * thì sửa ở đây, KHÔNG hardcode giá trị trong component/service.
 * Cấu hình theo môi trường (URL API...) nằm ở src/environments/.
 */

/** Ngôn ngữ hỗ trợ — khớp tên file public/i18n/<locale>.json. */
export const SUPPORTED_LOCALES = ['vn', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const APP_SETTINGS = {
  /** Tên app — hiển thị ở logo, footer, tiêu đề tab trình duyệt. */
  appName: 'Charlie Quizlet',

  i18n: {
    defaultLocale: 'vn' as Locale,
    /** Thư mục chứa file dịch (trong public/). */
    translationsPath: '/i18n',
    /** Mã BCP-47 cho thẻ <html lang>. */
    htmlLang: { vn: 'vi', en: 'en' } satisfies Record<Locale, string>,
    /** Locale dùng để format ngày/số (Intl / toLocaleDateString). */
    formatLocale: { vn: 'vi-VN', en: 'en-US' } satisfies Record<Locale, string>,
  },

  auth: {
    /** Trạng thái mặc định của checkbox "Ghi nhớ đăng nhập". */
    rememberMeDefault: true,
  },

  /** Giới hạn validate — phải khớp với validation của BE (các DTO trong charlie-quizlet-be). */
  validation: {
    /** BCrypt chỉ dùng 72 byte đầu của mật khẩu. */
    passwordMinLength: 8,
    passwordMaxLength: 72,
    emailMaxLength: 255,
    fullNameMaxLength: 255,
  },

  quizzes: {
    /** Số bộ đề mỗi chủ đề trên Home (BE cho tối đa 20). */
    homePerTopic: 8,
    /** Số bộ đề mỗi trang ở trang danh sách (BE cho tối đa 50). */
    pageSize: 12,
    /** Chờ người dùng ngừng gõ bao lâu (ms) mới tìm kiếm. */
    searchDebounceMs: 300,
  },

  ui: {
    /** Thời gian hiển thị mặc định của toast (ms). */
    toastDurationMs: 3000,
  },

  home: {
    /** Mốc giờ đổi lời chào: < afternoonFromHour là "buổi sáng", < eveningFromHour là "buổi chiều", còn lại "buổi tối". */
    afternoonFromHour: 12,
    eveningFromHour: 18,
  },
} as const;
