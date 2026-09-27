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
    /** Tên ngôn ngữ ở ô chọn ngôn ngữ — viết bằng chính ngôn ngữ đó, không dịch. */
    localeNames: { vn: 'Tiếng Việt', en: 'English' } satisfies Record<Locale, string>,
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
    topicNameMaxLength: 100,
    quizTitleMaxLength: 255,
    quizDescriptionMaxLength: 2000,
    quizTimeLimitMaxMinutes: 300,
    quizMaxQuestions: 200,
    questionContentMaxLength: 2000,
    questionExplanationMaxLength: 2000,
    questionMinOptions: 2,
    questionMaxOptions: 6,
    optionContentMaxLength: 1000,
  },

  quizzes: {
    /** Số bộ đề mỗi chủ đề khi xem theo nhóm — Home, trang Bộ đề (BE cho tối đa 20). */
    perTopic: 8,
    /** Số bộ đề mỗi trang ở trang danh sách (BE cho tối đa 50). */
    pageSize: 12,
    /**
     * Số câu mỗi lượt thi thử khi bộ đề không tự đặt — chỉ để hiện gợi ý trong trình soạn đề; BE mới là nơi quyết
     * định (khớp app.attempt.default-exam-question-count ở charlie-quizlet-be).
     */
    defaultExamQuestionCount: 30,
    /** Chờ người dùng ngừng gõ bao lâu (ms) mới tìm kiếm. */
    searchDebounceMs: 300,
  },

  attempt: {
    /** Thang điểm của 1 lượt làm: đúng hết = scoreScale điểm, mỗi câu = scoreScale / số câu của lượt. */
    scoreScale: 100,
    /** Xếp loại kết quả theo tỉ lệ đúng (%): từ mốc này trở lên là "xuất sắc" / "khá"; dưới mốc "khá" là "cần cố gắng". */
    greatFromPercent: 80,
    goodFromPercent: 50,
  },

  questionImport: {
    /** Dung lượng tối đa của file Excel nhập câu hỏi (MB). */
    maxFileSizeMb: 2,
  },

  ui: {
    /** Thời gian hiển thị mặc định của toast (ms). */
    toastDurationMs: 3000,
  },

  home: {
    /** Số mục mỗi khối "của tôi" trên Home (đang làm dở, làm gần đây, yêu thích). */
    recentCount: 4,
    /** Mốc giờ đổi lời chào: < afternoonFromHour là "buổi sáng", < eveningFromHour là "buổi chiều", còn lại "buổi tối". */
    afternoonFromHour: 12,
    eveningFromHour: 18,
  },
} as const;
