import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AdminQuizzesService } from './admin-quizzes.service';
import { AdminTopicsService } from './admin-topics.service';

const API = environment.apiUrl;

describe('Admin services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('danh sách mọi đề: chỉ gửi status / topicId khi có lọc', () => {
    const service = TestBed.inject(AdminQuizzesService);
    service
      .list({ status: null, topicId: null, q: '', sort: 'RECENT', page: 0, size: 12 })
      .subscribe();
    const all = http.expectOne((r) => r.url === `${API}/admin/quizzes`);
    expect(all.request.params.has('status')).toBe(false);
    expect(all.request.params.has('topicId')).toBe(false);

    service
      .list({ status: 'DRAFT', topicId: 5, q: '', sort: 'RECENT', page: 0, size: 12 })
      .subscribe();
    const filtered = http.expectOne((r) => r.url === `${API}/admin/quizzes`);
    expect(filtered.request.params.get('status')).toBe('DRAFT');
    expect(filtered.request.params.get('topicId')).toBe('5');
  });

  it('chủ đề: thêm / đổi tên / xoá gọi API admin', () => {
    const service = TestBed.inject(AdminTopicsService);
    service.create('Toán').subscribe();
    const created = http.expectOne(`${API}/admin/topics`);
    expect(created.request.method).toBe('POST');
    expect(created.request.body).toEqual({ name: 'Toán' });

    service.rename(5, 'Văn').subscribe();
    expect(http.expectOne(`${API}/admin/topics/5`).request.method).toBe('PUT');
    service.delete(5).subscribe();
    expect(http.expectOne(`${API}/admin/topics/5`).request.method).toBe('DELETE');
  });
});
