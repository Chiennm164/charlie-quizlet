import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import {
  APP_SETTINGS,
  DEFAULT_AUTHENTICATED_ROUTE,
  ERROR_CODES,
  ROUTES,
  adminQuizEditUrl,
  attemptUrl,
} from '../../../core/config';
import { ConfirmDialogService } from '../../../core/confirm/confirm-dialog.service';
import { handleErrorCode } from '../../../core/error/error-handling';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AttemptMode, AttemptSummary, Quiz } from '../../../core/models';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/ui/breadcrumb/breadcrumb';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { formatDate, formatDateTime, percent } from '../../../shared/utils/common.utils';
import { AttemptsService } from '../../attempts/attempts.service';
import { FavoriteButtonComponent } from '../../me/favorite-button';
import { QuizMarksStore } from '../../me/quiz-marks.store';
import { QuizzesService } from '../quizzes.service';
import { ScorePipe } from '../../attempts/score.pipe';

/** Thông tin 1 bộ đề (`/quizzes/:id`): chọn Luyện tập / Thi thử, làm tiếp lượt dở, lịch sử làm của mình. */
@Component({
  selector: 'app-quiz-detail',
  standalone: true,
  imports: [
    ScorePipe,
    RouterLink,
    BreadcrumbComponent,
    FavoriteButtonComponent,
    IconComponent,
    LoadingComponent,
    MascotComponent,
    TranslatePipe,
  ],
  templateUrl: './quiz-detail.html',
})
export class QuizDetailComponent {
  private translate = inject(TranslateService);
  private attempts = inject(AttemptsService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly browseUrl = ROUTES.quizzes;
  readonly editUrl = adminQuizEditUrl;
  readonly attemptUrl = attemptUrl;
  readonly modes: AttemptMode[] = ['PRACTICE', 'EXAM'];

  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  quiz = signal<Quiz | null>(null);
  loading = signal(true);
  notFound = signal(false);
  /** null = đang tải. Lỗi đã hiện ở dialog chung -> coi như chưa làm lần nào. */
  history = toSignal<AttemptSummary[] | null>(
    this.attempts.history(this.id).pipe(catchError(() => of([]))),
    { initialValue: null },
  );
  starting = signal(false);

  unfinished = computed(() => this.history()?.find((a) => a.status === 'IN_PROGRESS') ?? null);
  submitted = computed(() => (this.history() ?? []).filter((a) => a.status === 'SUBMITTED'));
  /** Tỉ lệ đúng cao nhất trong các lần đã nộp; null = chưa nộp lần nào. */
  bestPercent = computed(() => {
    const percents = this.submitted()
      .map((a) => percent(a.correctCount ?? 0, a.questionCount))
      .filter((p) => p !== null);
    return percents.length ? Math.max(...percents) : null;
  });

  /** Trang chủ › Bộ đề › <chủ đề> › <tên đề>: bấm để quay lại danh sách (lọc sẵn theo chủ đề). */
  breadcrumb = computed<BreadcrumbItem[]>(() => {
    this.translate.locale();
    const quiz = this.quiz();
    if (!quiz) return [];
    return [
      { label: this.translate.t('nav.home'), url: DEFAULT_AUTHENTICATED_ROUTE },
      { label: this.translate.t('nav.quizzes'), url: ROUTES.quizzes },
      { label: quiz.topic.name, url: ROUTES.quizzes, queryParams: { topicId: quiz.topic.id } },
      { label: quiz.title },
    ];
  });

  publishedAt = computed(() =>
    formatDate(this.quiz()?.publishedAt, APP_SETTINGS.i18n.formatLocale[this.translate.locale()]),
  );

  constructor() {
    inject(QuizMarksStore).refresh();
    inject(QuizzesService)
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (quiz) => this.quiz.set(quiz),
        // Không tồn tại / là nháp -> hiện ngay trên trang thay vì dialog lỗi.
        error: (err: unknown) =>
          handleErrorCode(err, ERROR_CODES.QUIZ_NOT_FOUND, () => this.notFound.set(true)),
      });
  }

  formatDateTime(value: string): string {
    return formatDateTime(value, APP_SETTINGS.i18n.formatLocale[this.translate.locale()]);
  }

  /** Còn lượt dở thì hỏi trước: bắt đầu lượt mới sẽ huỷ lượt đó (BE xoá). */
  async start(mode: AttemptMode): Promise<void> {
    const quiz = this.quiz();
    if (!quiz || this.starting()) return;
    if (this.unfinished()) {
      const confirmed = await this.confirmDialog.confirm({
        title: this.translate.t('attempt.restartTitle'),
        message: this.translate.t('attempt.restartMessage'),
        confirmText: this.translate.t('attempt.restartConfirm'),
        danger: true,
      });
      if (!confirmed) return;
    }
    this.starting.set(true);
    this.attempts
      .start(quiz.id, { mode })
      .pipe(
        finalize(() => this.starting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((attempt) => this.router.navigateByUrl(attemptUrl(attempt.id)));
  }
}
