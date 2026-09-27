import { ViewportScroller } from '@angular/common';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router, Scroll } from '@angular/router';
import { Subject } from 'rxjs';
import { ScrollRestoreService } from './scroll-restore.service';

describe('ScrollRestoreService', () => {
  const events = new Subject<unknown>();
  const scrollToPosition = jest.fn();
  let stable: () => void;

  beforeEach(() => {
    scrollToPosition.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } },
        { provide: ViewportScroller, useValue: { scrollToPosition } },
        {
          provide: ApplicationRef,
          useValue: { whenStable: () => new Promise<void>((resolve) => (stable = resolve)) },
        },
      ],
    });
    TestBed.inject(ScrollRestoreService);
  });

  const navigate = (id: number, position: [number, number] | null) => {
    events.next(new NavigationStart(id, '/quizzes'));
    events.next(new Scroll(new NavigationEnd(id, '/quizzes', '/quizzes'), position, null));
  };
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('Back / Forward: chờ dữ liệu tải xong (app ổn định) rồi mới cuộn lại vị trí cũ', async () => {
    navigate(1, [0, 640]);
    await flush();
    expect(scrollToPosition).not.toHaveBeenCalled();

    stable();
    await flush();
    expect(scrollToPosition).toHaveBeenCalledWith([0, 640]);
  });

  it('mở trang mới (không có vị trí cũ) -> không cuộn', async () => {
    navigate(1, null);
    await flush();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });

  it('đã chuyển sang trang khác trước khi dữ liệu về -> bỏ qua vị trí cũ', async () => {
    navigate(1, [0, 640]);
    const first = stable;
    events.next(new NavigationStart(2, '/home'));
    first();
    await flush();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });
});
