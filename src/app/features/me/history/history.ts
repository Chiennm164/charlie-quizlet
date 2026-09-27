import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { APP_SETTINGS, ROUTES, attemptUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AttemptMode, MyAttempt } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination';
import { SelectComponent, SelectOption } from '../../../shared/ui/select/select';
import { formatDateTime, formatDuration, percent } from '../../../shared/utils/common.utils';
import { scoreLevel } from '../../attempts/attempt.store';
import { QuizzesService } from '../../quizzes/quizzes.service';
import { MeService, MyAttemptParams } from '../me.service';
import { ScorePipe } from '../../attempts/score.pipe';

const MODES: AttemptMode[] = ['PRACTICE', 'EXAM'];
/** Giá trị "tất cả" trong ô chọn (select chỉ nhận chuỗi). */
const ALL = '';
const { pageSize } = APP_SETTINGS.quizzes;

/** Bộ lọc đọc từ URL (F5 / Back / chia sẻ link giữ đúng trang đang xem). */
function paramsFrom(query: ParamMap): MyAttemptParams {
  const mode = query.get('mode') as AttemptMode;
  const topicId = Number(query.get('topicId'));
  const page = Number(query.get('page'));
  return {
    status: 'SUBMITTED',
    mode: MODES.includes(mode) ? mode : null,
    topicId: Number.isInteger(topicId) && topicId > 0 ? topicId : null,
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: pageSize,
  };
}

const sameParams = (a: MyAttemptParams, b: MyAttemptParams) =>
  a.mode === b.mode && a.topicId === b.topicId && a.page === b.page;

/** Lịch sử làm bài (`/history?mode=&topicId=&page=`): mọi lượt đã nộp, mới nhất trước; bấm để xem lại kết quả. */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    ScorePipe,
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    LoadingComponent,
    MascotComponent,
    PageHeaderComponent,
    PaginationComponent,
    SelectComponent,
    TranslatePipe,
  ],
  templateUrl: './history.html',
})
export class HistoryComponent {
  private me = inject(MeService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly attemptUrl = attemptUrl;
  readonly browseUrl = ROUTES.quizzes;

  private initial = paramsFrom(this.route.snapshot.queryParamMap);
  modeControl = new FormControl<string>(this.initial.mode ?? ALL, { nonNullable: true });
  topicControl = new FormControl<string>(this.initial.topicId?.toString() ?? ALL, {
    nonNullable: true,
  });

  private params$ = this.route.queryParamMap.pipe(
    map(paramsFrom),
    distinctUntilChanged(sameParams),
  );
  params = toSignal(this.params$, { initialValue: this.initial });

  loading = signal(true);
  result = toSignal(
    this.params$.pipe(
      tap(() => this.loading.set(true)),
      // Lỗi đã hiện ở dialog chung; trả null để đổi bộ lọc sau vẫn gọi lại được.
      switchMap((params) => this.me.attempts(params).pipe(catchError(() => of(null)))),
      tap(() => this.loading.set(false)),
    ),
    { initialValue: null },
  );

  private topics = toSignal(
    inject(QuizzesService)
      .listTopics()
      .pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  modeOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return [
      { value: ALL, label: this.translate.t('me.allModes') },
      ...MODES.map((mode) => ({ value: mode, label: this.translate.t(`attempt.mode.${mode}`) })),
    ];
  });

  topicOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return [
      { value: ALL, label: this.translate.t('quiz.allTopics') },
      ...this.topics().map((topic) => ({ value: String(topic.id), label: topic.name })),
    ];
  });

  constructor() {
    this.modeControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((mode) => this.updateQuery({ mode: mode || null, page: null }));
    this.topicControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((topicId) => this.updateQuery({ topicId: topicId || null, page: null }));
    // Back / Forward đổi URL -> đưa ô lọc về đúng bộ lọc (không phát lại valueChanges).
    this.params$.pipe(takeUntilDestroyed()).subscribe(({ mode, topicId }) => {
      this.modeControl.setValue(mode ?? ALL, { emitEvent: false });
      this.topicControl.setValue(topicId?.toString() ?? ALL, { emitEvent: false });
    });
  }

  score(attempt: MyAttempt): number {
    return percent(attempt.correctCount ?? 0, attempt.questionCount) ?? 0;
  }

  readonly level = scoreLevel;

  duration(attempt: MyAttempt): string {
    return formatDuration(Date.parse(attempt.submittedAt!) - Date.parse(attempt.startedAt));
  }

  formatDateTime(value: string): string {
    return formatDateTime(value, APP_SETTINGS.i18n.formatLocale[this.translate.locale()]);
  }

  goToPage(page: number): void {
    this.updateQuery({ page: page > 0 ? page : null }, false);
  }

  /** null = bỏ param khỏi URL. Đổi trang thêm vào lịch sử trình duyệt, đổi bộ lọc thì không. */
  private updateQuery(queryParams: Params, replaceUrl = true): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
