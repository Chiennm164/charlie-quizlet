import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { APP_SETTINGS, ROUTES, attemptUrl, quizUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AttemptStatus, MyAttempt, QuizSummary } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { formatRelativeTime, percent } from '../../../shared/utils/common.utils';
import { scoreLevel } from '../../attempts/attempt.store';
import { QuizCardComponent } from '../../quizzes/quiz-card/quiz-card';
import { QuizzesService } from '../../quizzes/quizzes.service';
import { MeService } from '../me.service';
import { ScorePipe } from '../../attempts/score.pipe';

const { recentCount } = APP_SETTINGS.home;
/** Lấy dư để còn đủ `recentCount` đề khác nhau sau khi bỏ lượt cũ của cùng 1 đề. */
const RECENT_FETCH = recentCount * 3;

/**
 * Khối "của tôi" trên Home: bài đang làm dở (làm tiếp 1 chạm), đề làm gần đây (mỗi đề lượt mới nhất, huy hiệu điểm
 * theo mức), bộ đề yêu thích. Khối nào trống thì ẩn; lỗi đã hiện ở dialog chung -> coi như trống.
 */
@Component({
  selector: 'app-my-activity',
  standalone: true,
  imports: [ScorePipe, RouterLink, IconComponent, QuizCardComponent, TranslatePipe],
  templateUrl: './my-activity.html',
})
export class MyActivityComponent {
  private translate = inject(TranslateService);
  private me = inject(MeService);

  readonly attemptUrl = attemptUrl;
  readonly quizUrl = quizUrl;
  readonly historyUrl = ROUTES.history;
  readonly favoritesUrl = ROUTES.quizzes;

  unfinished = this.myAttempts('IN_PROGRESS', recentCount);
  private submitted = this.myAttempts('SUBMITTED', RECENT_FETCH);
  /** Mỗi đề 1 dòng (lượt nộp mới nhất) — làm 1 đề nhiều lần không chiếm hết danh sách. */
  recent = computed(() => {
    const seen = new Set<number>();
    return this.submitted()
      .filter((a) => !seen.has(a.quizId) && seen.add(a.quizId))
      .slice(0, recentCount)
      .map((a) => {
        const score = percent(a.correctCount ?? 0, a.questionCount) ?? 0;
        return { ...a, score, level: scoreLevel(score) };
      });
  });
  /** Có cả 2 khung thì đặt cạnh nhau trên màn rộng; chỉ 1 khung thì chiếm hết bề ngang. */
  bothPanels = computed(() => this.unfinished().length > 0 && this.recent().length > 0);

  favorites = toSignal(
    inject(QuizzesService)
      .listPublished({
        topicId: null,
        q: '',
        sort: 'RECENT',
        mark: 'FAVORITE',
        page: 0,
        size: recentCount,
      })
      .pipe(
        map((page) => page.content),
        catchError(() => of([])),
      ),
    { initialValue: [] as QuizSummary[] },
  );

  timeAgo(value: string): string {
    return formatRelativeTime(value, APP_SETTINGS.i18n.formatLocale[this.translate.locale()]);
  }

  private myAttempts(status: AttemptStatus, size: number) {
    return toSignal(
      this.me.attempts({ status, mode: null, topicId: null, page: 0, size }).pipe(
        map((page) => page.content),
        catchError(() => of([])),
      ),
      { initialValue: [] as MyAttempt[] },
    );
  }
}
