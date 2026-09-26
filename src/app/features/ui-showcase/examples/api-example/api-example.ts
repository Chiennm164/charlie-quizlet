import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { LoadingComponent } from '../../../../shared/ui/loading/loading';
import { QuoteService } from './quote.service';

@Component({
  selector: 'app-api-example',
  standalone: true,
  imports: [ButtonComponent, LoadingComponent, TranslatePipe],
  template: `
    <div class="field">
      <app-button (clicked)="load()" [loading]="loading()">{{
        'api.callButton' | translate
      }}</app-button>

      @if (loading()) {
        <app-loading [text]="'api.calling' | translate" />
      }

      @if (data(); as quote) {
        <div class="list__item">{{ quote.title }}</div>
      }
    </div>
  `,
})
export class ApiExampleComponent {
  private quoteService = inject(QuoteService);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  data = signal<{ title: string } | null>(null);

  /** Ví dụ mẫu chuẩn gọi API: finalize tắt loading, takeUntilDestroyed tự huỷ, lỗi tự hiện dialog chung. */
  load(): void {
    this.loading.set(true);
    this.quoteService
      .getQuote(1)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((quote) => this.data.set(quote));
  }
}
