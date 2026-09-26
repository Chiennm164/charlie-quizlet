import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { APP_SETTINGS } from '../../../core/config';
import { ScrollRestoreService } from '../../../core/navigation/scroll-restore.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { QuizListParams, QuizSort } from '../../../core/models';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination';
import { SelectComponent, SelectOption } from '../../../shared/ui/select/select';
import { QuizCardComponent } from '../quiz-card/quiz-card';
import { QuizzesService } from '../quizzes.service';

const SORTS: QuizSort[] = ['RECENT', 'NEWEST', 'TITLE'];
/** Giá trị của lựa chọn "Tất cả chủ đề" trong ô chọn (select chỉ nhận chuỗi). */
const ALL_TOPICS = '';
const { pageSize, searchDebounceMs } = APP_SETTINGS.quizzes;

/** Đọc bộ lọc từ query param (URL là nguồn sự thật: F5 / Back / chia sẻ link đều giữ đúng trang đang xem). */
function paramsFrom(query: ParamMap): QuizListParams {
  const topicId = Number(query.get('topicId'));
  const sort = query.get('sort') as QuizSort;
  const page = Number(query.get('page'));
  return {
    topicId: Number.isInteger(topicId) && topicId > 0 ? topicId : null,
    q: query.get('q') ?? '',
    sort: SORTS.includes(sort) ? sort : 'RECENT',
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: pageSize,
  };
}

const sameParams = (a: QuizListParams, b: QuizListParams) =>
  a.topicId === b.topicId && a.q === b.q && a.sort === b.sort && a.page === b.page;

/**
 * Tất cả bộ đề đã xuất bản (`/quizzes?topicId=&q=&sort=&page=`): lọc theo chủ đề, tìm theo tiêu đề, sắp xếp,
 * phân trang. Ô tìm kiếm --debounceTime--> URL --queryParamMap--> switchMap gọi API (huỷ request cũ khi bộ lọc đổi).
 */
@Component({
  selector: 'app-quiz-browse',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextComponent,
    LoadingComponent,
    MascotComponent,
    PageHeaderComponent,
    PaginationComponent,
    QuizCardComponent,
    SelectComponent,
    TranslatePipe,
  ],
  templateUrl: './quiz-browse.html',
})
export class QuizBrowseComponent {
  private quizzes = inject(QuizzesService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private initial = paramsFrom(this.route.snapshot.queryParamMap);
  topicControl = new FormControl(this.initial.topicId?.toString() ?? ALL_TOPICS, {
    nonNullable: true,
  });
  searchControl = new FormControl(this.initial.q, { nonNullable: true });
  sortControl = new FormControl<QuizSort>(this.initial.sort, { nonNullable: true });

  private params$ = this.route.queryParamMap.pipe(
    map(paramsFrom),
    distinctUntilChanged(sameParams),
  );
  params = toSignal(this.params$, { initialValue: this.initial });

  loading = signal(true);
  result = toSignal(
    this.params$.pipe(
      tap(() => this.loading.set(true)),
      // Lỗi đã hiện ở dialog chung; trả null để luồng không chết, đổi bộ lọc sau vẫn gọi lại được.
      switchMap((params) => this.quizzes.listPublished(params).pipe(catchError(() => of(null)))),
      tap(() => this.loading.set(false)),
    ),
    { initialValue: null },
  );

  private topics = toSignal(this.quizzes.listTopics().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  topicOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return [
      { value: ALL_TOPICS, label: this.translate.t('quiz.allTopics') },
      ...this.topics().map((topic) => ({ value: String(topic.id), label: topic.name })),
    ];
  });

  sortOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return SORTS.map((value) => ({ value, label: this.translate.t(`quiz.sort.${value}`) }));
  });

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

    this.topicControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((topicId) => this.updateQuery({ topicId: topicId || null, page: null }));

    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((sort) => this.updateQuery({ sort: sort === 'RECENT' ? null : sort, page: null }));

    // Back / Forward đổi URL -> đưa các ô lọc về đúng bộ lọc (không phát lại valueChanges).
    this.params$.pipe(takeUntilDestroyed()).subscribe(({ topicId, q, sort }) => {
      const topic = topicId?.toString() ?? ALL_TOPICS;
      if (this.topicControl.value !== topic)
        this.topicControl.setValue(topic, { emitEvent: false });
      if (this.searchControl.value.trim() !== q)
        this.searchControl.setValue(q, { emitEvent: false });
      if (this.sortControl.value !== sort) this.sortControl.setValue(sort, { emitEvent: false });
    });
  }

  goToPage(page: number): void {
    // Đổi trang thì thêm vào lịch sử (Back quay lại trang trước); gõ tìm kiếm / đổi bộ lọc thì không.
    this.updateQuery({ page: page > 0 ? page : null }, false);
  }

  /** null = bỏ param khỏi URL (giá trị mặc định). */
  private updateQuery(queryParams: Params, replaceUrl = true): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
