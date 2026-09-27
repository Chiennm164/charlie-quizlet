import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import {
  Page,
  Quiz,
  QuizListParams,
  QuizMark,
  QuizSort,
  QuizSummary,
  Topic,
  TopicQuizzes,
} from '../../core/models';

/** Xem bộ đề (mọi người đăng nhập). Soạn đề (ADMIN) sẽ thêm ở trình soạn đề. */
@Injectable({ providedIn: 'root' })
export class QuizzesService {
  private http = inject(HttpClient);

  /**
   * Đề đã xuất bản nhóm theo chủ đề (Home, trang Bộ đề xem theo nhóm): chỉ chủ đề có đề khớp `q`, mỗi chủ đề
   * tối đa `limit` đề theo `sort` (mặc định mới cập nhật trước).
   */
  listByTopic(
    limit: number,
    filter: { q?: string; sort?: QuizSort; mark?: QuizMark } = {},
  ): Observable<TopicQuizzes[]> {
    return this.http.get<TopicQuizzes[]>(API_ENDPOINTS.quizzes.byTopic, {
      params: {
        limit,
        q: filter.q ?? '',
        sort: filter.sort ?? 'RECENT',
        mark: filter.mark ?? 'ALL',
      },
    });
  }

  /** Đề đã xuất bản. */
  listPublished(params: QuizListParams): Observable<Page<QuizSummary>> {
    let query = new HttpParams({
      fromObject: {
        q: params.q,
        sort: params.sort,
        mark: params.mark ?? 'ALL',
        page: params.page,
        size: params.size,
      },
    });
    if (params.topicId !== null) query = query.set('topicId', params.topicId);
    return this.http.get<Page<QuizSummary>>(API_ENDPOINTS.quizzes.base, { params: query });
  }

  get(id: number): Observable<Quiz> {
    return this.http.get<Quiz>(API_ENDPOINTS.quizzes.detail(id));
  }

  listTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(API_ENDPOINTS.topics);
  }
}
