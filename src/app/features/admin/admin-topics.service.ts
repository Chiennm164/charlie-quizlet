import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import { Topic } from '../../core/models';

/** Thêm / đổi tên / xoá chủ đề (ADMIN). Đọc danh sách: QuizzesService.listTopics(). */
@Injectable({ providedIn: 'root' })
export class AdminTopicsService {
  private http = inject(HttpClient);

  create(name: string): Observable<Topic> {
    return this.http.post<Topic>(API_ENDPOINTS.admin.topics, { name });
  }

  rename(id: number, name: string): Observable<Topic> {
    return this.http.put<Topic>(API_ENDPOINTS.admin.topic(id), { name });
  }

  /** Chỉ xoá được chủ đề chưa có bộ đề (BE báo TOPIC_IN_USE). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.admin.topic(id));
  }
}
