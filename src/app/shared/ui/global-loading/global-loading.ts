import { Component, computed, inject } from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';
import { GlobalLoadingService } from './global-loading.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  template: `
    @if (loadingService.loading()) {
      <div class="global-loading" role="alert" aria-busy="true" animate.leave="anim-fade-out">
        <span class="global-loading__spinner" aria-hidden="true"></span>
        <span class="global-loading__text">{{ text() }}</span>
      </div>
    }
  `,
})
export class GlobalLoadingComponent {
  loadingService = inject(GlobalLoadingService);
  private translate = inject(TranslateService);

  text = computed(() => {
    this.translate.locale();
    return this.translate.t('common.loading');
  });
}
