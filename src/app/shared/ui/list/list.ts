import { Component, TemplateRef, computed, contentChild, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateService } from '../../../core/i18n/translate.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @if (items().length === 0) {
      <div class="list__empty">{{ emptyText() || defaultEmptyText() }}</div>
    } @else {
      <div class="list">
        @for (item of items(); track trackByFn(item)) {
          <div class="list__item">
            <ng-container
              *ngTemplateOutlet="itemTemplate() ?? null; context: { $implicit: item }"
            />
          </div>
        }
      </div>
    }
  `,
})
export class ListComponent {
  private translate = inject(TranslateService);

  items = input<unknown[]>([]);
  /** Để trống sẽ dùng bản dịch mặc định (common.noData) theo ngôn ngữ hiện tại. */
  emptyText = input<string | null>(null);
  trackBy = input<(item: unknown) => unknown>((item) => item);

  itemTemplate = contentChild<TemplateRef<{ $implicit: unknown }>>('itemTemplate');

  trackByFn = (item: unknown) => this.trackBy()(item);

  defaultEmptyText = computed(() => {
    this.translate.locale();
    return this.translate.t('common.noData');
  });
}
