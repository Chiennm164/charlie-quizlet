import { ApplicationRef, Injectable, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { NavigationStart, Router, Scroll } from '@angular/router';

/**
 * Back / Forward về trang tải dữ liệu qua API: router khôi phục vị trí cuộn ngay khi chuyển trang, lúc dữ liệu chưa
 * có nên trang còn ngắn -> cuộn không tới. Service chờ app ổn định (mọi request HTTP của trang mới đã xong và đã
 * render — HttpClient tự báo request đang chạy cho `whenStable`) rồi cuộn lại đúng chỗ. Trang không phải tự gọi gì.
 * Người dùng đã chuyển tiếp sang trang khác trước khi dữ liệu về thì bỏ qua.
 */
@Injectable({ providedIn: 'root' })
export class ScrollRestoreService {
  private scroller = inject(ViewportScroller);
  private appRef = inject(ApplicationRef);
  /** Id của lần điều hướng mới nhất. */
  private latestNavigation = 0;

  constructor() {
    inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationStart) this.latestNavigation = event.id;
      if (!(event instanceof Scroll) || !event.position) return;
      const position = event.position;
      const navigation = event.routerEvent.id;
      this.appRef.whenStable().then(() => {
        if (navigation === this.latestNavigation) this.scroller.scrollToPosition(position);
      });
    });
  }
}
