import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';
import { ERROR_CODES, ROUTES } from '../../../core/config';
import { handleErrorCode } from '../../../core/error/error-handling';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { AttemptPlayerComponent } from '../attempt-player/attempt-player';
import { AttemptResultComponent } from '../attempt-result/attempt-result';
import { AttemptStore } from '../attempt.store';
import { AttemptsService } from '../attempts.service';

/**
 * `/attempts/:id`: đang làm -> màn làm bài; đã nộp (bấm nộp, hết giờ) -> màn kết quả, cùng URL nên F5 / Back vẫn
 * đúng. "Làm lại" điều hướng sang lượt mới ở chính route này (component được dùng lại, tải theo id mới).
 */
@Component({
  selector: 'app-attempt-page',
  standalone: true,
  imports: [
    RouterLink,
    AttemptPlayerComponent,
    AttemptResultComponent,
    LoadingComponent,
    MascotComponent,
    TranslatePipe,
  ],
  providers: [AttemptStore],
  template: `
    @if (loading()) {
      <app-loading />
    } @else if (notFound()) {
      <section class="max-w-md mx-auto py-12 flex flex-col items-center text-center gap-3">
        <app-mascot mood="sad" class="w-28 h-28" />
        <h1 class="typo-page-title">{{ 'attempt.notFoundTitle' | translate }}</h1>
        <p class="typo-muted">{{ 'attempt.notFoundDescription' | translate }}</p>
        <a class="btn btn--primary btn--md mt-3" [routerLink]="browseUrl">
          {{ 'quiz.backToBrowse' | translate }}
        </a>
      </section>
    } @else if (store.isSubmitted()) {
      <app-attempt-result />
    } @else if (store.attempt()) {
      <app-attempt-player />
    }
  `,
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class AttemptPageComponent implements HasUnsavedChanges {
  store = inject(AttemptStore);

  readonly browseUrl = ROUTES.quizzes;
  loading = signal(true);
  notFound = signal(false);

  constructor() {
    const route = inject(ActivatedRoute);
    const attempts = inject(AttemptsService);
    route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        // Bật loading trong switchMap (sau khi request cũ đã bị huỷ) để finalize của request cũ không tắt nhầm.
        switchMap((id) => {
          this.loading.set(true);
          this.notFound.set(false);
          return attempts.get(id).pipe(
            catchError((err: unknown) => {
              // Không có / không phải bài của mình / đã bị huỷ -> báo ngay trên trang.
              handleErrorCode(err, ERROR_CODES.ATTEMPT_NOT_FOUND, () => this.notFound.set(true));
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((attempt) => this.store.load(attempt));
  }

  /** Còn câu trả lời đang gửi lên BE -> rời trang sẽ mất lựa chọn đó. */
  hasUnsavedChanges(): boolean {
    return this.store.pending() > 0;
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}
