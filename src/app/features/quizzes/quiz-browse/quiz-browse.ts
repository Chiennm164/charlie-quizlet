import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { Observable, catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { APP_SETTINGS, STORAGE_KEYS } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import {
  Page,
  QuizListParams,
  QuizMark,
  QuizSort,
  QuizSummary,
  TopicQuizzes,
} from '../../../core/models';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination';
import { SegmentedComponent, SegmentedOption } from '../../../shared/ui/segmented/segmented';
import { SelectComponent, SelectOption } from '../../../shared/ui/select/select';
import { QuizCardComponent } from '../quiz-card/quiz-card';
import { QuizGroupComponent } from '../quiz-group/quiz-group';
import { QuizMarksStore } from '../../me/quiz-marks.store';
import { QuizzesService } from '../quizzes.service';

const SORTS: QuizSort[] = ['RECENT', 'NEWEST', 'TITLE'];
const MARKS: QuizMark[] = ['ALL', 'NOT_TAKEN', 'FAVORITE'];
/** Giá trị của lựa chọn "Tất cả chủ đề" trong ô chọn (select chỉ nhận chuỗi). */
const ALL_TOPICS = '';
const { pageSize, perTopic } = APP_SETTINGS.quizzes;

/** group: mỗi chủ đề 1 khối (mặc định) · list: 1 lưới chung có phân trang. */
type QuizView = 'group' | 'list';
const VIEWS: QuizView[] = ['group', 'list'];

interface BrowseParams extends QuizListParams {
  view: QuizView;
}

type BrowseResult =
  { kind: 'groups'; groups: TopicQuizzes[] } | { kind: 'page'; page: Page<QuizSummary> };

/** Cách xem người dùng chọn lần trước (chỉ là tiện ích trên trình duyệt này — không có thì xem theo nhóm). */
function storedView(): QuizView {
  try {
    return localStorage.getItem(STORAGE_KEYS.quizView) === 'list' ? 'list' : 'group';
  } catch {
    return 'group';
  }
}

/** Đọc bộ lọc từ query param (URL là nguồn sự thật: F5 / Back / chia sẻ link đều giữ đúng trang đang xem). */
function paramsFrom(query: ParamMap): BrowseParams {
  const topicId = Number(query.get('topicId'));
  const sort = query.get('sort') as QuizSort;
  const page = Number(query.get('page'));
  const view = query.get('view') as QuizView;
  const mark = query.get('mark') as QuizMark;
  return {
    topicId: Number.isInteger(topicId) && topicId > 0 ? topicId : null,
    q: query.get('q') ?? '',
    sort: SORTS.includes(sort) ? sort : 'RECENT',
    mark: MARKS.includes(mark) ? mark : 'ALL',
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: pageSize,
    view: VIEWS.includes(view) ? view : storedView(),
  };
}

const sameParams = (a: BrowseParams, b: BrowseParams) =>
  a.topicId === b.topicId &&
  a.q === b.q &&
  a.sort === b.sort &&
  a.mark === b.mark &&
  a.page === b.page &&
  a.view === b.view;

/** Xem theo nhóm chỉ có nghĩa khi chưa lọc 1 chủ đề — lọc rồi thì chỉ còn 1 nhóm, hiện lưới có phân trang. */
const isGrouped = (params: BrowseParams) => params.view === 'group' && params.topicId === null;

/**
 * Tất cả bộ đề đã xuất bản (`/quizzes?topicId=&q=&sort=&page=&view=`): lọc theo chủ đề, tìm theo tiêu đề, sắp xếp.
 * Mặc định xem theo nhóm (mỗi chủ đề 1 khối); người dùng đổi sang lưới có phân trang, lựa chọn được nhớ trên
 * trình duyệt. Từ khoá `q` do ô tìm kiếm trên header (HeaderSearchComponent) ghi vào URL.
 * URL --queryParamMap--> switchMap gọi API (huỷ request cũ khi bộ lọc đổi).
 */
@Component({
  selector: 'app-quiz-browse',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LoadingComponent,
    MascotComponent,
    PageHeaderComponent,
    PaginationComponent,
    QuizCardComponent,
    QuizGroupComponent,
    SegmentedComponent,
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
  sortControl = new FormControl<QuizSort>(this.initial.sort, { nonNullable: true });
  markControl = new FormControl<QuizMark>(this.initial.mark ?? 'ALL', { nonNullable: true });

  private params$ = this.route.queryParamMap.pipe(
    map(paramsFrom),
    distinctUntilChanged(sameParams),
  );
  params = toSignal(this.params$, { initialValue: this.initial });

  viewOptions = computed<SegmentedOption[]>(() => {
    this.translate.locale();
    return VIEWS.map((value) => ({
      value,
      label: this.translate.t(`quiz.view.${value}`),
      icon: value === 'group' ? 'view-groups' : 'view-list',
    }));
  });

  loading = signal(true);
  result = toSignal<BrowseResult | null>(
    this.params$.pipe(
      tap(() => this.loading.set(true)),
      // Lỗi đã hiện ở dialog chung; trả null để luồng không chết, đổi bộ lọc sau vẫn gọi lại được.
      switchMap((params) => this.load(params).pipe(catchError(() => of(null)))),
      tap(() => this.loading.set(false)),
    ),
    { initialValue: null },
  );

  /** Tổng số đề khớp bộ lọc (xem theo nhóm: cộng các chủ đề). */
  total = computed(() => {
    const result = this.result();
    if (!result) return 0;
    return result.kind === 'page'
      ? result.page.totalElements
      : result.groups.reduce((sum, group) => sum + group.totalQuizzes, 0);
  });

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

  markOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return MARKS.map((value) => ({ value, label: this.translate.t(`quiz.markFilter.${value}`) }));
  });

  constructor() {
    // Dấu trên thẻ đề (điểm cao nhất, đang làm dở, yêu thích) mới nhất mỗi lần mở trang.
    inject(QuizMarksStore).refresh();

    this.markControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((mark) => this.updateQuery({ mark: mark === 'ALL' ? null : mark, page: null }));

    this.topicControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((topicId) => this.updateQuery({ topicId: topicId || null, page: null }));

    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((sort) => this.updateQuery({ sort: sort === 'RECENT' ? null : sort, page: null }));

    // Back / Forward đổi URL -> đưa các ô lọc về đúng bộ lọc (không phát lại valueChanges).
    this.params$.pipe(takeUntilDestroyed()).subscribe(({ topicId, sort, mark }) => {
      if (this.markControl.value !== mark) this.markControl.setValue(mark!, { emitEvent: false });
      const topic = topicId?.toString() ?? ALL_TOPICS;
      if (this.topicControl.value !== topic)
        this.topicControl.setValue(topic, { emitEvent: false });
      if (this.sortControl.value !== sort) this.sortControl.setValue(sort, { emitEvent: false });
    });
  }

  setView(view: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.quizView, view);
    } catch {
      // Không lưu được (chế độ ẩn danh...) -> vẫn đổi cách xem theo URL.
    }
    this.updateQuery({ view, page: null });
  }

  goToPage(page: number): void {
    // Đổi trang thì thêm vào lịch sử (Back quay lại trang trước); đổi bộ lọc thì không.
    this.updateQuery({ page: page > 0 ? page : null }, false);
  }

  private load(params: BrowseParams): Observable<BrowseResult> {
    return isGrouped(params)
      ? this.quizzes
          .listByTopic(perTopic, { q: params.q, sort: params.sort, mark: params.mark })
          .pipe(map((groups) => ({ kind: 'groups' as const, groups })))
      : this.quizzes.listPublished(params).pipe(map((page) => ({ kind: 'page' as const, page })));
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
