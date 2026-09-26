import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { IconComponent } from '../icon/icon';

/** Nút trang trước / sau + "Trang x / y". `page` bắt đầu từ 0 (khớp BE). Chỉ 1 trang thì không hiện. */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" [attr.aria-label]="'common.pagination' | translate">
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          [disabled]="page() <= 0"
          (click)="pageChange.emit(page() - 1)"
        >
          <app-icon name="chevron-right" class="rotate-180" />
          {{ 'common.previous' | translate }}
        </button>
        <span class="pagination__status" aria-live="polite">
          {{ 'common.pageOf' | translate: { page: page() + 1, total: totalPages() } }}
        </span>
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          [disabled]="page() >= totalPages() - 1"
          (click)="pageChange.emit(page() + 1)"
        >
          {{ 'common.next' | translate }}
          <app-icon name="chevron-right" />
        </button>
      </nav>
    }
  `,
})
export class PaginationComponent {
  page = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();
}
