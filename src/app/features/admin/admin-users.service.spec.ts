import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models';
import { AdminUsersService } from './admin-users.service';

const API = environment.apiUrl;

const BOB: User = {
  id: 7,
  email: 'bob@example.com',
  fullName: 'Bob',
  role: 'TEACHER',
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lấy danh sách tài khoản chờ duyệt', () => {
    let users: User[] = [];
    service.listPending().subscribe((res) => (users = res));

    const req = http.expectOne(`${API}/admin/users/pending`);
    expect(req.request.method).toBe('GET');
    req.flush([BOB]);
    expect(users).toEqual([BOB]);
  });

  it('duyệt và từ chối gọi đúng API theo id', () => {
    service.approve(7).subscribe();
    const approve = http.expectOne(`${API}/admin/users/7/approve`);
    expect(approve.request.method).toBe('POST');
    approve.flush({ ...BOB, status: 'ACTIVE' });

    service.reject(7).subscribe();
    const reject = http.expectOne(`${API}/admin/users/7/reject`);
    expect(reject.request.method).toBe('POST');
    reject.flush(null, { status: 204, statusText: 'No Content' });
  });
});
