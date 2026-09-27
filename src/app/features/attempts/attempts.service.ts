import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import {
  AnswerRequest,
  Attempt,
  AttemptQuestion,
  AttemptSummary,
  StartAttemptRequest,
} from '../../core/models';

/** Làm bài: bắt đầu lượt, lưu từng câu trả lời, nộp bài, lịch sử. BE chấm điểm và giữ giờ làm bài. */
@Injectable({ providedIn: 'root' })
export class AttemptsService {
  private http = inject(HttpClient);

  /** Lượt dở của bộ đề này (nếu có) bị huỷ ở BE — hỏi người dùng trước khi gọi. */
  start(quizId: number, request: StartAttemptRequest): Observable<Attempt> {
    return this.http.post<Attempt>(API_ENDPOINTS.quizzes.attempts(quizId), request);
  }

  /** 20 lượt gần nhất của người gọi, mới nhất trước (gồm lượt đang làm dở). */
  history(quizId: number): Observable<AttemptSummary[]> {
    return this.http.get<AttemptSummary[]>(API_ENDPOINTS.quizzes.attempts(quizId));
  }

  get(id: number): Observable<Attempt> {
    return this.http.get<Attempt>(API_ENDPOINTS.attempts.detail(id));
  }

  answer(id: number, questionId: number, request: AnswerRequest): Observable<AttemptQuestion> {
    return this.http.put<AttemptQuestion>(API_ENDPOINTS.attempts.answer(id, questionId), request);
  }

  /** Gọi lại khi đã nộp vẫn trả về kết quả. */
  submit(id: number): Observable<Attempt> {
    return this.http.post<Attempt>(API_ENDPOINTS.attempts.submit(id), {});
  }
}
