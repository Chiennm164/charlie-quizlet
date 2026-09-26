import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { APP_SETTINGS, ROUTES, adminQuizEditUrl, quizUrl } from '../../../core/config';
import { ScrollRestoreService } from '../../../core/navigation/scroll-restore.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { QuizStatus } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination';
import { SelectComponent, SelectOption } from '../../../shared/ui/select/select';
import { formatDate } from '../../../shared/utils/common.utils';
import { QuizzesService } from '../../quizzes/quizzes.service';
import { AdminQuizListParams, AdminQuizzesService } from '../admin-quizzes.service';

const STATUSES: QuizStatus[] = ['DRAFT', 'PUBLISHED'];
/** Giá trị "tất cả" trong ô chọn (select chỉ nhận chuỗi). */
const ALL = '';
const { pageSize, searchDebounceMs } = APP_SETTINGS.quizzes;

function paramsFrom(query: ParamMap): AdminQuizListParams {
  const topicId = Number(query.get('topicId'));
  const status = query.get('status') as QuizStatus;
  const page = Number(query.get('page'));
  return {
    status: STATUSES.includes(status) ? status : null,
    topicId: Number.isInteger(topicId) && topicId > 0 ? topicId : null,
    q: query.get('q') ?? '',
    sort: 'RECENT',
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: pageSize,
  };
}

const sameParams = (a: AdminQuizListParams, b: AdminQuizListParams) =>
  a.status === b.status && a.topicId === b.topicId && a.q === b.q && a.page === b.page;

/**
 * Quản lý bộ đề (`/admin/quizzes?status=&topicId=&q=&page=`, ADMIN): mọi đề kể cả nháp, mới sửa trước.
 * Cùng cách làm với trang tìm bộ đề của học sinh: bộ lọc trên URL, switchMap huỷ request cũ.
 */
@Component({
  selector: 'app-admin-quiz-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    InputTextComponent,
    LoadingComponent,
    PageHeaderComponent,
    PaginationComponent,
    SelectComponent,
    TranslatePipe,
  ],
  templateUrl: './quiz-list.html',
})
export class AdminQuizListComponent {
  private adminQuizzes = inject(AdminQuizzesService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly newUrl = ROUTES.adminQuizNew;
  readonly editUrl = adminQuizEditUrl;
  readonly viewUrl = quizUrl;

  private initial = paramsFrom(this.route.snapshot.queryParamMap);
  statusControl = new FormControl(this.initial.status ?? ALL, { nonNullable: true });
  topicControl = new FormControl(this.initial.topicId?.toString() ?? ALL, { nonNullable: true });
  searchControl = new FormControl(this.initial.q, { nonNullable: true });

  private params$ = this.route.queryParamMap.pipe(
    map(paramsFrom),
    distinctUntilChanged(sameParams),
  );
  params = toSignal(this.params$, { initialValue: this.initial });

  loading = signal(true);
  result = toSignal(
    this.params$.pipe(
      tap(() => this.loading.set(true)),
      switchMap((params) => this.adminQuizzes.list(params).pipe(catchError(() => of(null)))),
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

  statusOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return [
      { value: ALL, label: this.translate.t('adminQuiz.allStatuses') },
      ...STATUSES.map((value) => ({ value, label: this.translate.t(`quiz.status.${value}`) })),
    ];
  });

  topicOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return [
      { value: ALL, label: this.translate.t('quiz.allTopics') },
      ...this.topics().map((topic) => ({ value: String(topic.id), label: topic.name })),
    ];
  });

  private dateLocale = computed(() => APP_SETTINGS.i18n.formatLocale[this.translate.locale()]);

  constructor() {
    // Back về trang này: cuộn lại chỗ đang xem khi danh sách đã hiện.
    const scrollRestore = inject(ScrollRestoreService);
    effect(() => {
      if (this.result()) scrollRestore.restore();
    });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(searchDebounceMs),
        map((q) => q.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((q) => this.updateQuery({ q: q || null, page: null }));
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((status) => this.updateQuery({ status: status || null, page: null }));
    this.topicControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((topicId) => this.updateQuery({ topicId: topicId || null, page: null }));

    this.params$.pipe(takeUntilDestroyed()).subscribe(({ status, topicId, q }) => {
      const statusValue = status ?? ALL;
      const topicValue = topicId?.toString() ?? ALL;
      if (this.statusControl.value !== statusValue) {
        this.statusControl.setValue(statusValue, { emitEvent: false });
      }
      if (this.topicControl.value !== topicValue) {
        this.topicControl.setValue(topicValue, { emitEvent: false });
      }
      if (this.searchControl.value.trim() !== q)
        this.searchControl.setValue(q, { emitEvent: false });
    });
  }

  formatDate(value: string): string {
    return formatDate(value, this.dateLocale());
  }

  goToPage(page: number): void {
    this.updateQuery({ page: page > 0 ? page : null }, false);
  }

  private updateQuery(queryParams: Params, replaceUrl = true): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
