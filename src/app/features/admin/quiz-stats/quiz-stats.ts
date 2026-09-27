import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ROUTES, adminQuizEditUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { QuestionStats, QuizStats } from '../../../core/models';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { SegmentedComponent, SegmentedOption } from '../../../shared/ui/segmented/segmented';
import { AdminQuizzesService } from '../admin-quizzes.service';
import {
  OPTION_LETTERS,
  downloadFile,
  percent,
  toCsv,
  toFileName,
} from '../../../shared/utils/common.utils';
import { ScorePipe } from '../../attempts/score.pipe';

type QuestionOrder = 'hardest' | 'position';
const ORDERS: QuestionOrder[] = ['hardest', 'position'];

const correctRate = (question: QuestionStats) =>
  percent(question.correctCount, question.answeredCount);

/**
 * Thống kê 1 bộ đề (`/admin/quizzes/:id/stats`): số lượt nộp, số người làm, điểm trung bình; từng câu tỉ lệ đúng
 * (xếp câu sai nhiều nhất lên đầu) và mỗi đáp án được chọn bao nhiêu lần — thấy đáp án nhiễu nào hay bị chọn nhầm.
 */
@Component({
  selector: 'app-quiz-stats',
  standalone: true,
  imports: [
    ScorePipe,
    BreadcrumbComponent,
    ButtonComponent,
    IconComponent,
    LoadingComponent,
    MascotComponent,
    SegmentedComponent,
    TranslatePipe,
  ],
  templateUrl: './quiz-stats.html',
})
export class QuizStatsComponent {
  private translate = inject(TranslateService);

  readonly letters = OPTION_LETTERS;
  readonly percent = percent;
  readonly correctRate = correctRate;
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  /** undefined = đang tải; null = lỗi (dialog chung đã báo). */
  stats = toSignal<QuizStats | null | undefined>(
    inject(AdminQuizzesService)
      .stats(this.id)
      .pipe(catchError(() => of(null))),
    { initialValue: undefined },
  );

  order = signal<QuestionOrder>('hardest');
  /** Câu đang mở xem chi tiết đáp án. */
  expanded = signal<ReadonlySet<number>>(new Set());

  breadcrumb = computed<BreadcrumbItem[]>(() => {
    this.translate.locale();
    const stats = this.stats();
    return [
      { label: this.translate.t('adminQuiz.listTitle'), url: ROUTES.adminQuizzes },
      ...(stats ? [{ label: stats.title, url: adminQuizEditUrl(stats.quizId) }] : []),
      { label: this.translate.t('quizStats.title') },
    ];
  });

  average = computed(() => {
    const average = this.stats()?.averagePercent;
    return average == null ? null : Math.round(average);
  });

  orderOptions = computed<SegmentedOption[]>(() => {
    this.translate.locale();
    return ORDERS.map((value) => ({ value, label: this.translate.t(`quizStats.order.${value}`) }));
  });

  /** Câu đã có người làm theo tỉ lệ đúng tăng dần (cùng tỉ lệ thì theo thứ tự đề), câu chưa ai làm xuống cuối. */
  private byDifficulty = computed(() => {
    const questions = this.stats()?.questions ?? [];
    return questions
      .filter((q) => q.answeredCount > 0)
      .sort((a, b) => correctRate(a)! - correctRate(b)! || a.position - b.position)
      .concat(questions.filter((q) => q.answeredCount === 0));
  });

  /** Câu có tỉ lệ đúng thấp nhất (trong các câu đã có người làm). */
  hardest = computed(() => {
    const first = this.byDifficulty()[0];
    return first?.answeredCount ? first : null;
  });

  questions = computed(() =>
    this.order() === 'hardest' ? this.byDifficulty() : (this.stats()?.questions ?? []),
  );

  /** Mỗi câu 1 dòng (theo thứ tự đề): số lượt, đúng, bỏ trống, tỉ lệ đúng, đáp án đúng, lượt chọn từng đáp án. */
  downloadCsv(stats: QuizStats): void {
    const t = (key: string) => this.translate.t(`quizStats.csv.${key}`);
    const letters = [...OPTION_LETTERS];
    const header = [
      t('question'),
      t('content'),
      t('answered'),
      t('correct'),
      t('skipped'),
      t('correctRate'),
      t('correctAnswer'),
      ...letters.map((letter) => this.translate.t('quizStats.csv.picks', { letter })),
    ];
    const rows = stats.questions.map((q) => [
      q.position + 1,
      q.content,
      q.answeredCount,
      q.correctCount,
      q.skippedCount,
      correctRate(q),
      OPTION_LETTERS[q.options.findIndex((option) => option.correct)] ?? '',
      ...letters.map((_, i) => q.options[i]?.pickCount ?? null),
    ]);
    downloadFile(
      new Blob([toCsv([header, ...rows])], { type: 'text/csv;charset=utf-8' }),
      `${toFileName(stats.title)}-${t('fileSuffix')}.csv`,
    );
  }

  selectOrder(order: string): void {
    this.order.set(order as QuestionOrder);
  }

  toggle(questionId: number): void {
    this.expanded.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(questionId)) next.add(questionId);
      return next;
    });
  }
}
