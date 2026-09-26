import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import {
  Page,
  StudySet,
  StudySetListParams,
  StudySetRequest,
  StudySetSummary,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class StudySetsService {
  private http = inject(HttpClient);

  listMine(params: StudySetListParams): Observable<Page<StudySetSummary>> {
    const query = new HttpParams({
      fromObject: { q: params.q, sort: params.sort, page: params.page, size: params.size },
    });
    return this.http.get<Page<StudySetSummary>>(API_ENDPOINTS.studySets.mine, { params: query });
  }

  get(id: number): Observable<StudySet> {
    return this.http.get<StudySet>(API_ENDPOINTS.studySets.detail(id));
  }

  create(request: StudySetRequest): Observable<StudySet> {
    return this.http.post<StudySet>(API_ENDPOINTS.studySets.base, request);
  }

  /** Thay toàn bộ: gửi mọi thẻ theo thứ tự mới, thẻ đã có kèm `id`. */
  update(id: number, request: StudySetRequest): Observable<StudySet> {
    return this.http.put<StudySet>(API_ENDPOINTS.studySets.detail(id), request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.studySets.detail(id));
  }
}
