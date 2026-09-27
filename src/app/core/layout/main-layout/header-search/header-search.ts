import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, filter, map, startWith } from 'rxjs';
import { APP_SETTINGS, ROUTES, ROUTE_SEGMENTS } from '../../../config';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon';

/**
 * Ô tìm bộ đề trên header. Enter -> mở `/quizzes?q=`. Đang ở trang Bộ đề thì gõ tới đâu lọc tới đó
 * (debounce, giữ chủ đề / sắp xếp đang chọn); URL là nguồn sự thật nên Back / Forward cũng đưa ô về đúng từ khoá.
 */
@Component({
  selector: 'app-header-search',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, TranslatePipe],
  template: `
    <form role="search" class="relative" (submit)="search($event)">
      <app-icon
        name="search"
        [size]="18"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        name="q"
        enterkeyhint="search"
        class="input rounded-full py-1.5 pl-10 pr-4"
        [formControl]="searchControl"
        [placeholder]="'nav.search' | translate"
        [attr.aria-label]="'nav.search' | translate"
      />
    </form>
  `,
})
export class HeaderSearchComponent {
  private router = inject(Router);

  searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.browseQuery() ?? ''),
        takeUntilDestroyed(),
      )
      .subscribe((q) => {
        if (this.searchControl.value.trim() !== q)
          this.searchControl.setValue(q, { emitEvent: false });
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(APP_SETTINGS.quizzes.searchDebounceMs),
        map((q) => q.trim()),
        takeUntilDestroyed(),
      )
      .subscribe((q) => {
        const current = this.browseQuery();
        if (current !== null && current !== q) this.goToBrowse(q, true);
      });
  }

  search(event: Event): void {
    event.preventDefault();
    this.goToBrowse(this.searchControl.value.trim(), this.browseQuery() !== null);
  }

  /** Đang ở trang Bộ đề: sửa `q` tại chỗ (không thêm lịch sử). Trang khác: mở trang Bộ đề chỉ với từ khoá. */
  private goToBrowse(q: string, onBrowse: boolean): void {
    this.router.navigate([ROUTES.quizzes], {
      queryParams: { q: q || null, page: null },
      queryParamsHandling: onBrowse ? 'merge' : '',
      replaceUrl: onBrowse,
    });
  }

  /** Từ khoá `q` trên URL nếu đang ở trang Bộ đề, `null` nếu đang ở trang khác. */
  private browseQuery(): string | null {
    const tree = this.router.parseUrl(this.router.url);
    const path = tree.root.children['primary']?.segments.map((s) => s.path).join('/');
    return path === ROUTE_SEGMENTS.quizzes ? (tree.queryParams['q'] ?? '') : null;
  }
}
