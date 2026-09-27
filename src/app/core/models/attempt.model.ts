/** PRACTICE: luyện tập (thấy đúng / sai ngay, không giờ) · EXAM: thi thử (trộn câu, có giờ). Khớp AttemptMode ở BE. */
export type AttemptMode = 'PRACTICE' | 'EXAM';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED';

export interface AttemptOption {
  id: number;
  content: string;
}

/** 1 câu trong lượt làm. Đáp án đúng / giải thích chỉ có khi đã nộp, hoặc luyện tập với câu đã trả lời. */
export interface AttemptQuestion {
  questionId: number;
  content: string;
  /** Thi thử: đã trộn sẵn ở BE. */
  options: AttemptOption[];
  selectedOptionId: number | null;
  flagged: boolean;
  correctOptionId: number | null;
  /** null = chưa chấm. */
  correct: boolean | null;
  explanation: string | null;
}

/** 1 lượt làm bài đầy đủ (câu hỏi, đáp án đã chọn). */
export interface Attempt extends AttemptSummary {
  quiz: { id: number; title: string };
  /** Giờ server lúc trả về — để đếm ngược đúng dù đồng hồ máy lệch. */
  serverTime: string;
  questions: AttemptQuestion[];
}

/** 1 dòng lịch sử làm bài. */
export interface AttemptSummary {
  id: number;
  mode: AttemptMode;
  status: AttemptStatus;
  /** ISO-8601 timestamp. */
  startedAt: string;
  /** null = không giới hạn thời gian. */
  deadline: string | null;
  submittedAt: string | null;
  questionCount: number;
  /** null khi chưa nộp. */
  correctCount: number | null;
}

export interface StartAttemptRequest {
  mode: AttemptMode;
  /** Chỉ làm lại các câu sai / bỏ trống của lượt đã nộp này. */
  retryWrongOf?: number;
}

export interface AnswerRequest {
  /** null = bỏ chọn (chỉ thi thử). */
  optionId: number | null;
  flagged: boolean;
}

/** Thống kê 1 bộ đề cho Admin — chỉ tính các lượt đã nộp. */
export interface QuizStats {
  quizId: number;
  title: string;
  attemptCount: number;
  takerCount: number;
  practiceCount: number;
  examCount: number;
  /** Tỉ lệ đúng trung bình 0–100; null khi chưa có lượt nào. */
  averagePercent: number | null;
  /** Theo thứ tự câu trong đề. */
  questions: QuestionStats[];
}

export interface QuestionStats {
  questionId: number;
  position: number;
  content: string;
  /** Số lượt có câu này (lượt "làm lại câu sai" chỉ gồm vài câu). */
  answeredCount: number;
  correctCount: number;
  skippedCount: number;
  options: { optionId: number; content: string; correct: boolean; pickCount: number }[];
}

/** 1 lượt làm trong lịch sử của người xem (kèm tên đề, chủ đề). */
export interface MyAttempt extends AttemptSummary {
  quizId: number;
  quizTitle: string;
  topicName: string;
}

/** Dấu của người xem trên 1 bộ đề đã làm. */
export interface QuizProgress {
  quizId: number;
  submittedCount: number;
  /** Tỉ lệ đúng cao nhất 0–100; null khi chưa nộp lượt nào. */
  bestPercent: number | null;
  /** Lượt đang làm dở (làm tiếp); null khi không có. */
  inProgressAttemptId: number | null;
}

export interface QuizMarks {
  /** Chỉ các đề người xem đã làm. */
  progress: QuizProgress[];
  favoriteQuizIds: number[];
}
