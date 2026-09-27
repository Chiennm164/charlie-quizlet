import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import {
  Page,
  Quiz,
  QuizRequest,
  QuizStatus,
  QuizSummary,
  QuizListParams,
  QuizStats,
} from '../../core/models';

export interface AdminQuizListParams extends QuizListParams {
  /** null = mọi trạng thái. */
  status: QuizStatus | null;
}

/** Soạn / quản lý bộ đề (ADMIN). Xem 1 đề kèm đáp án: QuizzesService.get() (BE trả câu hỏi khi canEdit). */
@Injectable({ providedIn: 'root' })
export class AdminQuizzesService {
  private http = inject(HttpClient);

  /** Mọi bộ đề, cả nháp. */
  list(params: AdminQuizListParams): Observable<Page<QuizSummary>> {
    let query = new HttpParams({
      fromObject: { q: params.q, sort: params.sort, page: params.page, size: params.size },
    });
    if (params.status) query = query.set('status', params.status);
    if (params.topicId !== null) query = query.set('topicId', params.topicId);
    return this.http.get<Page<QuizSummary>>(API_ENDPOINTS.admin.quizzes, { params: query });
  }

  create(request: QuizRequest): Observable<Quiz> {
    return this.http.post<Quiz>(API_ENDPOINTS.quizzes.base, request);
  }

  /** Thay toàn bộ: gửi mọi câu hỏi theo thứ tự mới, câu / đáp án đã có kèm `id`. */
  update(id: number, request: QuizRequest): Observable<Quiz> {
    return this.http.put<Quiz>(API_ENDPOINTS.quizzes.detail(id), request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.quizzes.detail(id));
  }

  /** Bản nháp mới chép toàn bộ câu hỏi của `quiz` (cần `quiz.questions` — Admin nhận kèm khi get). */
  duplicate(quiz: Quiz, title: string): Observable<Quiz> {
    return this.create({
      topicId: quiz.topic.id,
      title,
      description: quiz.description,
      timeLimitMinutes: quiz.timeLimitMinutes,
      examQuestionCount: quiz.examQuestionCount,
      status: 'DRAFT',
      questions: (quiz.questions ?? []).map((question) => ({
        id: null,
        content: question.content,
        explanation: question.explanation,
        options: question.options.map((option) => ({
          id: null,
          content: option.content,
          correct: option.correct,
        })),
      })),
    });
  }

  /** Lượt làm, điểm trung bình, từng câu / đáp án (chỉ lượt đã nộp). */
  stats(id: number): Observable<QuizStats> {
    return this.http.get<QuizStats>(API_ENDPOINTS.admin.quizStats(id));
  }
}
