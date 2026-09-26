import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { APP_SETTINGS, ERROR_CODES, ROUTES } from '../../../core/config';
import { handleErrorCode } from '../../../core/error/error-handling';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { Quiz } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { formatDate } from '../../../shared/utils/common.utils';
import { QuizzesService } from '../quizzes.service';

/** Thông tin 1 bộ đề (`/quizzes/:id`) trước khi làm bài. Làm bài: giai đoạn 5. */
@Component({
  selector: 'app-quiz-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, LoadingComponent, MascotComponent, TranslatePipe],
  templateUrl: './quiz-detail.html',
})
export class QuizDetailComponent {
  private translate = inject(TranslateService);

  readonly browseUrl = ROUTES.quizzes;

  quiz = signal<Quiz | null>(null);
  loading = signal(true);
  notFound = signal(false);

  publishedAt = computed(() =>
    formatDate(this.quiz()?.publishedAt, APP_SETTINGS.i18n.formatLocale[this.translate.locale()]),
  );

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    inject(QuizzesService)
      .get(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (quiz) => this.quiz.set(quiz),
        // Không tồn tại / là nháp -> hiện ngay trên trang thay vì dialog lỗi.
        error: (err: unknown) =>
          handleErrorCode(err, ERROR_CODES.QUIZ_NOT_FOUND, () => this.notFound.set(true)),
      });
  }
}
