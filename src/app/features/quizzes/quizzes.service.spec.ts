import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { QuizzesService } from './quizzes.service';

const API = environment.apiUrl;

describe('QuizzesService', () => {
  let service: QuizzesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuizzesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('Home: lấy đề theo chủ đề kèm giới hạn mỗi chủ đề', () => {
    service.listByTopic(8).subscribe();
    const req = http.expectOne((r) => r.url === `${API}/quizzes/by-topic`);
    expect(req.request.params.get('limit')).toBe('8');
  });

  it('danh sách đề: chỉ gửi topicId khi có lọc theo chủ đề', () => {
    service
      .listPublished({ topicId: null, q: 'toán', sort: 'TITLE', page: 1, size: 12 })
      .subscribe();
    const all = http.expectOne((r) => r.url === `${API}/quizzes`);
    expect(all.request.params.has('topicId')).toBe(false);
    expect(all.request.params.get('q')).toBe('toán');
    expect(all.request.params.get('page')).toBe('1');

    service.listPublished({ topicId: 5, q: '', sort: 'RECENT', page: 0, size: 12 }).subscribe();
    expect(http.expectOne((r) => r.url === `${API}/quizzes`).request.params.get('topicId')).toBe(
      '5',
    );
  });

  it('chi tiết đề và danh sách chủ đề', () => {
    service.get(10).subscribe();
    http.expectOne(`${API}/quizzes/10`);
    service.listTopics().subscribe();
    http.expectOne(`${API}/topics`);
  });
});
