import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config';
import { User } from '../../core/models';

/** Duyệt tài khoản chờ duyệt (Teacher tự đăng ký). Chỉ ADMIN gọi được. */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);

  /** Cũ nhất trước. */
  listPending(): Observable<User[]> {
    return this.http.get<User[]>(API_ENDPOINTS.admin.pendingUsers);
  }

  approve(id: number): Observable<User> {
    return this.http.post<User>(API_ENDPOINTS.admin.approveUser(id), null);
  }

  /** BE xoá hẳn tài khoản, email đó đăng ký lại được. */
  reject(id: number): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.admin.rejectUser(id), null);
  }
}
