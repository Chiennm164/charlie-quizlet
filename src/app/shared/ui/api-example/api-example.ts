import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../button/button';
import { LoadingComponent } from '../loading/loading';
import { QuoteService } from './quote.service';

@Component({
  selector: 'app-api-example',
  standalone: true,
  imports: [ButtonComponent, LoadingComponent, TranslatePipe],
  template: `
    <div class="field">
      <app-button (clicked)="load()" [loading]="loading()">{{ 'api.callButton' | translate }}</app-button>

      @if (loading()) {
        <app-loading [text]="'api.calling' | translate" />
      }

      @if (error()) {
        <p class="field__error">{{ error() }}</p>
      }

      @if (data(); as quote) {
        <div class="list__item">{{ quote.title }}</div>
      }
    </div>
  `,
})
export class ApiExampleComponent {
  private quoteService = inject(QuoteService);
  private translate = inject(TranslateService);

  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<{ title: string } | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.quoteService.getQuote(1).subscribe({
      next: (quote) => {
        this.data.set(quote);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.t('api.error'));
        this.loading.set(false);
      },
    });
  }
}
