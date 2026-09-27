import { TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { HeaderSearchComponent } from './header-search';

describe('HeaderSearchComponent', () => {
  let events: Subject<unknown>;
  let navigate: jest.Mock;
  let router: { url: string };

  function create(url: string) {
    events = new Subject();
    navigate = jest.fn().mockResolvedValue(true);
    const serializer = new DefaultUrlSerializer();
    router = { url };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: Object.assign(router, {
            events,
            navigate,
            parseUrl: (u: string) => serializer.parse(u),
          }),
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new HeaderSearchComponent());
  }

  function navigateTo(url: string) {
    router.url = url;
    events.next(new NavigationEnd(1, url, url));
  }

  const submit = () => ({ preventDefault: jest.fn() }) as unknown as Event;

  afterEach(() => jest.useRealTimers());

  it('điền từ khoá từ URL trang Bộ đề, rời trang thì xoá', () => {
    const component = create('/quizzes?q=%C4%91%E1%BA%A1i&topicId=5');
    expect(component.searchControl.value).toBe('đại');

    navigateTo('/home');
    expect(component.searchControl.value).toBe('');
  });

  it('ở trang khác: gõ không điều hướng, Enter mới mở trang Bộ đề với từ khoá', () => {
    jest.useFakeTimers();
    const component = create('/home');

    component.searchControl.setValue(' đại số ');
    jest.advanceTimersByTime(300);
    expect(navigate).not.toHaveBeenCalled();

    component.search(submit());
    expect(navigate).toHaveBeenCalledWith(['/quizzes'], {
      queryParams: { q: 'đại số', page: null },
      queryParamsHandling: '',
      replaceUrl: false,
    });
  });

  it('ở trang Bộ đề: chờ ngừng gõ rồi ghi từ khoá vào URL, giữ bộ lọc khác', () => {
    jest.useFakeTimers();
    const component = create('/quizzes?topicId=5&page=2');

    component.searchControl.setValue('đại');
    component.searchControl.setValue('đại số ');
    jest.advanceTimersByTime(299);
    expect(navigate).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledWith(['/quizzes'], {
      queryParams: { q: 'đại số', page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('Back về từ khoá cũ rồi gõ lại đúng từ khoá vừa tìm -> vẫn cập nhật URL', () => {
    jest.useFakeTimers();
    const component = create('/quizzes?q=abc');

    navigateTo('/quizzes');
    expect(component.searchControl.value).toBe('');
    component.searchControl.setValue('abc');
    jest.advanceTimersByTime(300);
    expect(navigate.mock.calls[0][1]).toMatchObject({ queryParams: { q: 'abc' } });
  });
});
