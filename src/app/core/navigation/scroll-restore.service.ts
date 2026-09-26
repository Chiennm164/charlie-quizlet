import { Injectable, Injector, afterNextRender, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { Router, Scroll } from '@angular/router';

/**
 * Back / Forward về trang danh sách: router khôi phục vị trí cuộn ngay khi chuyển trang, lúc dữ liệu (tải qua API)
 * chưa có nên trang còn ngắn -> cuộn không tới. Service giữ lại vị trí đó; trang gọi `restore()` sau khi đã hiện
 * dữ liệu để cuộn lại đúng chỗ.
 *
 *   effect(() => { if (this.result()) this.scrollRestore.restore(); });
 */
@Injectable({ providedIn: 'root' })
export class ScrollRestoreService {
  private scroller = inject(ViewportScroller);
  private injector = inject(Injector);
  /** Vị trí cần khôi phục của lần Back / Forward gần nhất (mở trang mới thì null). */
  private pending: [number, number] | null = null;

  constructor() {
    inject(Router).events.subscribe((event) => {
      if (event instanceof Scroll) this.pending = event.position;
    });
  }

  /** Cuộn tới vị trí đang chờ (nếu có) sau lần render kế tiếp, rồi bỏ đi — chỉ khôi phục 1 lần. */
  restore(): void {
    const position = this.pending;
    if (!position) return;
    this.pending = null;
    afterNextRender(() => this.scroller.scrollToPosition(position), { injector: this.injector });
  }
}
