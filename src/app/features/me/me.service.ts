import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import { AttemptMode, AttemptStatus, MyAttempt, Page, QuizMarks } from '../../core/models';

export interface MyAttemptParams {
  status: AttemptStatus;
  /** null = mọi chế độ / mọi chủ đề. */
  mode: AttemptMode | null;
  topicId: number | null;
  page: number;
  size: number;
}

/** Dữ liệu riêng của người đăng nhập: lịch sử làm bài, dấu trên từng đề, yêu thích. */
@Injectable({ providedIn: 'root' })
export class MeService {
  private http = inject(HttpClient);

  attempts(params: MyAttemptParams): Observable<Page<MyAttempt>> {
    let query = new HttpParams({
      fromObject: { status: params.status, page: params.page, size: params.size },
    });
    if (params.mode) query = query.set('mode', params.mode);
    if (params.topicId !== null) query = query.set('topicId', params.topicId);
    return this.http.get<Page<MyAttempt>>(API_ENDPOINTS.me.attempts, { params: query });
  }

  quizMarks(): Observable<QuizMarks> {
    return this.http.get<QuizMarks>(API_ENDPOINTS.me.quizMarks);
  }

  setFavorite(quizId: number, favorite: boolean): Observable<void> {
    const url = API_ENDPOINTS.me.favorite(quizId);
    return favorite ? this.http.put<void>(url, null) : this.http.delete<void>(url);
  }
}
