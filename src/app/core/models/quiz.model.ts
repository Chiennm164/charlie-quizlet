/** DRAFT: nháp, chỉ Admin thấy · PUBLISHED: đã xuất bản (= đã duyệt), học sinh làm được. */
export type QuizStatus = 'DRAFT' | 'PUBLISHED';

/** RECENT: mới sửa trước (mặc định) · NEWEST: mới tạo trước · TITLE: A → Z. Khớp enum QuizSort ở BE. */
export type QuizSort = 'RECENT' | 'NEWEST' | 'TITLE';

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
  /** Bắt đầu từ 0. */
  page: number;
  size: number;
}
