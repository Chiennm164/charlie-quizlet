/** DRAFT: nháp, chỉ Admin thấy · PUBLISHED: đã xuất bản (= đã duyệt), học sinh làm được. */
export type QuizStatus = 'DRAFT' | 'PUBLISHED';

/** RECENT: mới sửa trước (mặc định) · NEWEST: mới tạo trước · TITLE: A → Z. Khớp enum QuizSort ở BE. */
export type QuizSort = 'RECENT' | 'NEWEST' | 'TITLE';

/** Lọc theo quan hệ với người xem: mọi đề · chưa nộp lần nào · yêu thích. Khớp enum QuizMark ở BE. */
export type QuizMark = 'ALL' | 'NOT_TAKEN' | 'FAVORITE';

export interface TopicRef {
  id: number;
  name: string;
}

export interface Topic extends TopicRef {
  /** Số bộ đề thuộc chủ đề (cả nháp). */
  quizCount: number;
}

/** 1 dòng trong danh sách bộ đề — không kèm câu hỏi. */
export interface QuizSummary {
  id: number;
  title: string;
  description: string | null;
  status: QuizStatus;
  /** null = không giới hạn thời gian. */
  timeLimitMinutes: number | null;
  questionCount: number;
  topicId: number;
  topicName: string;
  ownerName: string;
  /** ISO-8601 timestamp. */
  updatedAt: string;
  publishedAt: string | null;
}

/** Home: 1 chủ đề + vài bộ đề mới nhất của nó. */
export interface TopicQuizzes {
  topic: TopicRef;
  /** Tổng số bộ đề đã xuất bản của chủ đề (có thể nhiều hơn số đề trong `quizzes`). */
  totalQuizzes: number;
  quizzes: QuizSummary[];
}

export interface QuizOption {
  id: number;
  content: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: number;
  content: string;
  explanation: string | null;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  topic: TopicRef;
  title: string;
  description: string | null;
  timeLimitMinutes: number | null;
  /** Cấu hình riêng của đề: số câu mỗi lượt thi thử; null = dùng mặc định của hệ thống. */
  examQuestionCount: number | null;
  /** Số câu thực tế mỗi lượt thi thử (cấu hình hoặc mặc định, không quá số câu đang có) — BE tính. */
  examDrawCount: number;
  status: QuizStatus;
  owner: { id: number; fullName: string };
  questionCount: number;
  /** Chỉ có khi `canEdit` (Admin, kèm đáp án đúng); học sinh nhận null — không thấy đáp án trước khi làm. */
  questions: QuizQuestion[] | null;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface QuizListParams {
  /** null = mọi chủ đề. */
  topicId: number | null;
  q: string;
  sort: QuizSort;
  /** Chỉ trang học sinh; bỏ trống = ALL. */
  mark?: QuizMark;
  /** Bắt đầu từ 0. */
  page: number;
  size: number;
}

export interface QuizOptionRequest {
  /** Đáp án đã có: gửi id để BE giữ nguyên; null = đáp án mới. */
  id: number | null;
  content: string;
  correct: boolean;
}

export interface QuizQuestionRequest {
  /** Câu đã có: gửi id để BE giữ nguyên (bài làm cũ vẫn trỏ đúng câu); null = câu mới. */
  id: number | null;
  content: string;
  explanation: string | null;
  /** 2–6 đáp án, đúng 1 đáp án `correct`. */
  options: QuizOptionRequest[];
}

/** Tạo / sửa bộ đề. Khi sửa, `questions` là toàn bộ câu hỏi theo thứ tự mới (câu cũ không có trong đây bị xoá). */
export interface QuizRequest {
  topicId: number;
  title: string;
  description: string | null;
  /** null = không giới hạn. */
  timeLimitMinutes: number | null;
  /** Thi thử rút ngẫu nhiên chừng này câu mỗi lượt; null = dùng mặc định của hệ thống. */
  examQuestionCount: number | null;
  /** PUBLISHED cần ít nhất 1 câu hỏi. */
  status: QuizStatus;
  questions: QuizQuestionRequest[];
}
