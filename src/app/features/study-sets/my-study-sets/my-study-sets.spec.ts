import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslateService } from '../../../core/i18n/translate.service';
import { Page, StudySetSummary } from '../../../core/models';
import { MyStudySetsComponent } from './my-study-sets';

const MINE = `${environment.apiUrl}/study-sets/mine`;

const page = (...titles: string[]): Page<StudySetSummary> => ({
  content: titles.map((title, i) => ({
    id: i + 1,
    title,
    description: null,
    visibility: 'PRIVATE',
    cardCount: 2,
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  page: 0,
  size: 12,
  totalElements: titles.length,
  totalPages: 1,
});

describe('MyStudySetsComponent', () => {
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
    return TestBed.runInInjectionContext(() => new MyStudySetsComponent());
  }

  afterEach(() => {
    http.verify();
    jest.useRealTimers();
  });

  it('đọc bộ lọc từ URL, giá trị lạ thì dùng mặc định', () => {
    const component = create({ q: 'anh', sort: 'HACK', page: '-2' });
    expect(component.params()).toEqual({ q: 'anh', sort: 'RECENT', page: 0, size: 12 });
    expect(component.searchControl.value).toBe('anh');

    const req = http.expectOne((r) => r.url === MINE);
    expect(req.request.params.get('q')).toBe('anh');
    req.flush(page('Anh văn'));
    expect(component.result()?.content[0].title).toBe('Anh văn');
    expect(component.loading()).toBe(false);
  });

  it('gõ tìm kiếm: chờ ngừng gõ rồi mới ghi vào URL, về trang đầu', () => {
    jest.useFakeTimers();
    const component = create({ page: '3' });
    http.expectOne((r) => r.url === MINE).flush(page());

    component.searchControl.setValue('a');
    component.searchControl.setValue('an ');
    jest.advanceTimersByTime(299);
    expect(navigate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][1]).toMatchObject({
      queryParams: { q: 'an', page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('bộ lọc đổi khi request cũ chưa xong -> huỷ request cũ (switchMap), chỉ hiện kết quả mới', () => {
    const component = create();
    const first = http.expectOne((r) => r.url === MINE);

    queryParamMap.next(convertToParamMap({ q: 'cat' }));
    const second = http.expectOne((r) => r.url === MINE && r.params.get('q') === 'cat');

    expect(first.cancelled).toBe(true);
    second.flush(page('cat'));
    expect(component.result()?.content.map((s) => s.title)).toEqual(['cat']);
  });

  it('Back đổi URL -> ô tìm kiếm cập nhật theo, không gọi navigate lại', () => {
    jest.useFakeTimers();
    const component = create({ q: 'cat' });
    http.expectOne((r) => r.url === MINE).flush(page());

    queryParamMap.next(convertToParamMap({ q: 'dog', sort: 'TITLE' }));
    http.expectOne((r) => r.url === MINE).flush(page());
    jest.advanceTimersByTime(1000);

    expect(component.searchControl.value).toBe('dog');
    expect(component.sortControl.value).toBe('TITLE');
    expect(navigate).not.toHaveBeenCalled();
  });
});
