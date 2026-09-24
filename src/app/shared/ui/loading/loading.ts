import { Component, computed, inject, input } from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <span class="loading">
      <span class="loading__spinner" aria-hidden="true"></span>
      {{ text() || defaultText() }}
    </span>
  `,
})
export class LoadingComponent {
  private translate = inject(TranslateService);

  /** Để trống sẽ dùng bản dịch mặc định (common.loading) theo ngôn ngữ hiện tại. */
  text = input<string | null>(null);

  defaultText = computed(() => {
    this.translate.locale();
    return this.translate.t('common.loading');
  });
}
