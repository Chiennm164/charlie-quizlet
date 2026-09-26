import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, Scroll } from '@angular/router';
import { Subject } from 'rxjs';
import { ScrollRestoreService } from './scroll-restore.service';

describe('ScrollRestoreService', () => {
  const events = new Subject<unknown>();
  const scrollToPosition = jest.fn();

  beforeEach(() => {
    scrollToPosition.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } },
        { provide: ViewportScroller, useValue: { scrollToPosition } },
      ],
    });
  });

  const scroll = (position: [number, number] | null) =>
    events.next(new Scroll(new NavigationEnd(1, '/quizzes', '/quizzes'), position, null));

  it('Back / Forward: cuộn lại vị trí cũ sau khi trang render, chỉ 1 lần', () => {
    const service = TestBed.inject(ScrollRestoreService);
    scroll([0, 640]);

    service.restore();
    TestBed.tick();
    expect(scrollToPosition).toHaveBeenCalledWith([0, 640]);

    service.restore();
    TestBed.tick();
    expect(scrollToPosition).toHaveBeenCalledTimes(1);
  });

  it('mở trang mới (không có vị trí cũ) -> không cuộn', () => {
    const service = TestBed.inject(ScrollRestoreService);
    scroll(null);
    service.restore();
    TestBed.tick();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });
});
