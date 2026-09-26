import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import { StudySet, StudySetRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class StudySetsService {
  private http = inject(HttpClient);

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
