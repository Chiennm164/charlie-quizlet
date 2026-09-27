import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslateService } from '../../../core/i18n/translate.service';
import { QuizMarksStore } from '../../me/quiz-marks.store';
import { QuizBrowseComponent } from './quiz-browse';

const API = environment.apiUrl;
const LIST = `${API}/quizzes`;
const BY_TOPIC = `${API}/quizzes/by-topic`;
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
        { provide: QuizMarksStore, useValue: { refresh: jest.fn() } },
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
    localStorage.clear();
  });

  it('đọc chủ đề từ URL (giá trị lạ -> tất cả) và điền sẵn ô chọn chủ đề', () => {
    const component = create({ topicId: '5' });
    const req = http.expectOne((r) => r.url === LIST);
    expect(req.request.params.get('topicId')).toBe('5');
    req.flush(EMPTY_PAGE);
    expect(component.topicControl.value).toBe('5');
    expect(component.topicOptions().map((o) => o.label)).toEqual(['quiz.allTopics', 'Toán']);

    // Bỏ lọc chủ đề -> về cách xem mặc định: theo nhóm.
    queryParamMap.next(convertToParamMap({ topicId: 'abc' }));
    http.expectOne((r) => r.url === BY_TOPIC).flush([]);
  });

  it('đổi chủ đề -> ghi vào URL, về trang đầu; chọn "tất cả" -> bỏ khỏi URL', () => {
    const component = create({ page: '2', view: 'list' });
    http.expectOne((r) => r.url === LIST).flush(EMPTY_PAGE);

    component.topicControl.setValue('5');
    expect(navigate.mock.calls[0][1]).toMatchObject({ queryParams: { topicId: '5', page: null } });
    component.topicControl.setValue('');
    expect(navigate.mock.calls[1][1]).toMatchObject({ queryParams: { topicId: null, page: null } });
  });

  it('mặc định xem theo nhóm: gửi từ khoá + cách sắp xếp, đếm tổng số đề các chủ đề', () => {
    const component = create({ q: 'đại', sort: 'TITLE' });
    const req = http.expectOne((r) => r.url === BY_TOPIC);
    expect(req.request.params.get('q')).toBe('đại');
    expect(req.request.params.get('sort')).toBe('TITLE');
    req.flush([
      { topic: { id: 5, name: 'Toán' }, totalQuizzes: 9, quizzes: [] },
      { topic: { id: 6, name: 'Lý' }, totalQuizzes: 2, quizzes: [] },
    ]);
    expect(component.result()?.kind).toBe('groups');
    expect(component.total()).toBe(11);
  });

  it('đổi cách xem: ghi vào URL và nhớ cho lần sau; URL không có thì dùng lựa chọn đã nhớ', () => {
    const component = create();
    http.expectOne((r) => r.url === BY_TOPIC).flush([]);

    component.setView('list');
    expect(navigate.mock.calls[0][1]).toMatchObject({ queryParams: { view: 'list', page: null } });
    expect(localStorage.getItem('cq_quiz_view')).toBe('list');

    TestBed.resetTestingModule();
    create();
    http.expectOne((r) => r.url === LIST).flush(EMPTY_PAGE);
  });

  it('lọc "chưa làm" / "yêu thích": ghi vào URL và gửi kèm khi tải danh sách', () => {
    const component = create({ mark: 'FAVORITE', view: 'list' });
    expect(http.expectOne((r) => r.url === LIST).request.params.get('mark')).toBe('FAVORITE');
    expect(component.markControl.value).toBe('FAVORITE');

    component.markControl.setValue('ALL');
    expect(navigate.mock.calls[0][1]).toMatchObject({ queryParams: { mark: null, page: null } });
  });
});
