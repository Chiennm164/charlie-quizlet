import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { APP_SETTINGS, attemptUrl, quizUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AttemptQuestion } from '../../../core/models';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { TabItem, TabsComponent } from '../../../shared/ui/tabs/tabs';
import { ScorePipe } from '../score.pipe';
import {
  OPTION_LETTERS,
  formatDateTime,
  formatDuration,
  percent,
} from '../../../shared/utils/common.utils';
import { AttemptStore, optionState, scoreLevel } from '../attempt.store';
import { AttemptsService } from '../attempts.service';

type ReviewFilter = 'all' | 'wrong' | 'correct';

/** Câu đã chấm: đúng, sai, hay bỏ trống (bỏ trống cũng tính là sai). */
function questionStatus(question: AttemptQuestion): 'correct' | 'wrong' | 'skipped' {
  if (question.correct) return 'correct';
  return question.selectedOptionId === null ? 'skipped' : 'wrong';
}

/** Kết quả sau khi nộp: điểm, thời gian, xem lại từng câu (đáp án đã chọn, đáp án đúng, giải thích), làm lại. */
@Component({
  selector: 'app-attempt-result',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    MascotComponent,
    ScorePipe,
    TabsComponent,
    TranslatePipe,
  ],
  templateUrl: './attempt-result.html',
})
export class AttemptResultComponent {
  store = inject(AttemptStore);
  private attempts = inject(AttemptsService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly letters = OPTION_LETTERS;
  readonly quizUrl = quizUrl;
  readonly scoreScale = APP_SETTINGS.attempt.scoreScale;

  filter = signal<ReviewFilter>('all');
  starting = signal(false);

  private attempt = computed(() => this.store.attempt()!);
  total = computed(() => this.attempt().questionCount);
  correct = computed(() => this.attempt().correctCount ?? 0);
  wrongCount = computed(() => this.total() - this.correct());
  percent = computed(() => percent(this.correct(), this.total()) ?? 0);
  /** Mức lời khen theo tỉ lệ đúng. */
  verdict = computed(() => scoreLevel(this.percent()));
  duration = computed(() => {
    const { startedAt, submittedAt } = this.attempt();
    return formatDuration(Date.parse(submittedAt!) - Date.parse(startedAt));
  });
  submittedAt = computed(() =>
    formatDateTime(
      this.attempt().submittedAt,
      APP_SETTINGS.i18n.formatLocale[this.translate.locale()],
    ),
  );

  tabs = computed<TabItem[]>(() => {
    this.translate.locale();
    return [
      { id: 'all', label: this.translate.t('attempt.filter.all', { n: this.total() }) },
      { id: 'wrong', label: this.translate.t('attempt.filter.wrong', { n: this.wrongCount() }) },
      { id: 'correct', label: this.translate.t('attempt.filter.correct', { n: this.correct() }) },
    ];
  });

  /** Giữ số thứ tự câu như lúc làm bài dù đang lọc. */
  reviewed = computed(() => {
    const filter = this.filter();
    return this.attempt()
      .questions.map((question, index) => ({ question, index, status: questionStatus(question) }))
      .filter(
        ({ status }) => filter === 'all' || (filter === 'correct') === (status === 'correct'),
      );
  });

  selectFilter(id: string): void {
    this.filter.set(id as ReviewFilter);
  }

  readonly optionState = optionState;

  /** Làm lại cả đề hoặc chỉ các câu sai / bỏ trống, cùng chế độ. */
  retry(onlyWrong: boolean): void {
    if (this.starting()) return;
    const { id, quiz, mode } = this.attempt();
    this.starting.set(true);
    this.attempts
      .start(quiz.id, { mode, retryWrongOf: onlyWrong ? id : undefined })
      .pipe(
        finalize(() => this.starting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((next) => this.router.navigateByUrl(attemptUrl(next.id)));
  }
}
