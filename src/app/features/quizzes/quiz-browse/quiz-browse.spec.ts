import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslateService } from '../../../core/i18n/translate.service';
import { QuizBrowseComponent } from './quiz-browse';

const API = environment.apiUrl;
const LIST = `${API}/quizzes`;
const EMPTY_PAGE = { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 };

describe('QuizBrowseComponent', () => {
  let http: HttpTestingController;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let navigate: jest.Mock;

  function create(query: Record<string, string> = {}) {
    queryParamMap = new BehaviorSubject(convertToParamMap(query));
    navigate = jest.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap, snapshot: { queryParamMap: queryParamMap.value } },
        },
        { provide: Router, useValue: { navigate } },
        { provide: TranslateService, useValue: { t: (key: string) => key, locale: signal('vn') } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new QuizBrowseComponent());
    http.expectOne(`${API}/topics`).flush([{ id: 5, name: 'Toán', quizCount: 2 }]);
    return component;
  }

  afterEach(() => {
    http.verify();
    jest.useRealTimers();
  });

  it('đọc chủ đề từ URL (giá trị lạ -> tất cả) và điền sẵn ô chọn chủ đề', () => {
    const component = create({ topicId: '5' });
    const req = http.expectOne((r) => r.url === LIST);
    expect(req.request.params.get('topicId')).toBe('5');
    req.flush(EMPTY_PAGE);
    expect(component.topicControl.value).toBe('5');
    expect(component.topicOptions().map((o) => o.label)).toEqual(['quiz.allTopics', 'Toán']);

    queryParamMap.next(convertToParamMap({ topicId: 'abc' }));
    expect(http.expectOne((r) => r.url === LIST).request.params.has('topicId')).toBe(false);
  });

  it('đổi chủ đề -> ghi vào URL, về trang đầu; chọn "tất cả" -> bỏ khỏi URL', () => {
    const component = create({ page: '2' });
    http.expectOne((r) => r.url === LIST).flush(EMPTY_PAGE);

    component.topicControl.setValue('5');
    expect(navigate.mock.calls[0][1]).toMatchObject({ queryParams: { topicId: '5', page: null } });
    component.topicControl.setValue('');
    expect(navigate.mock.calls[1][1]).toMatchObject({ queryParams: { topicId: null, page: null } });
  });

  it('gõ tìm kiếm: chờ ngừng gõ rồi mới ghi vào URL', () => {
    jest.useFakeTimers();
    const component = create();
    http.expectOne((r) => r.url === LIST).flush(EMPTY_PAGE);

    component.searchControl.setValue('đại');
    component.searchControl.setValue('đại số ');
    jest.advanceTimersByTime(299);
    expect(navigate).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(navigate.mock.calls[0][1]).toMatchObject({ queryParams: { q: 'đại số', page: null } });
  });
});
