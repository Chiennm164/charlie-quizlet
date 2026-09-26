import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { APP_SETTINGS, ROUTES, studySetUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { StudySetListParams, StudySetSort } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination';
import { SelectComponent, SelectOption } from '../../../shared/ui/select/select';
import { formatDate } from '../../../shared/utils/common.utils';
import { StudySetsService } from '../study-sets.service';

const SORTS: StudySetSort[] = ['RECENT', 'NEWEST', 'TITLE'];
const { pageSize, searchDebounceMs } = APP_SETTINGS.studySets;

/** Đọc bộ lọc từ query param (URL là nguồn sự thật: F5 / Back / chia sẻ link đều giữ đúng trang đang xem). */
function paramsFrom(query: ParamMap): StudySetListParams {
  const sort = query.get('sort') as StudySetSort;
  const page = Number(query.get('page'));
  return {
    q: query.get('q') ?? '',
    sort: SORTS.includes(sort) ? sort : 'RECENT',
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: pageSize,
  };
}

const sameParams = (a: StudySetListParams, b: StudySetListParams) =>
  a.q === b.q && a.sort === b.sort && a.page === b.page;

/**
 * "Học phần của tôi" (`/study-sets?q=&sort=&page=`): tìm theo tiêu đề, sắp xếp, phân trang.
 *
 * Luồng dữ liệu (RxJS): ô tìm kiếm --debounceTime--> ghi vào URL --queryParamMap--> switchMap gọi API.
 * switchMap huỷ request cũ khi bộ lọc đổi trước lúc request đó trả về, nên kết quả hiển thị luôn khớp bộ lọc
 * mới nhất. Cách làm tương đương bằng Signals (httpResource): xem CQ_DEV_GUIDE.md.
 */
@Component({
  selector: 'app-my-study-sets',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    InputTextComponent,
    LoadingComponent,
    MascotComponent,
    PageHeaderComponent,
    PaginationComponent,
    SelectComponent,
    TranslatePipe,
  ],
  templateUrl: './my-study-sets.html',
})
export class MyStudySetsComponent {
  private studySets = inject(StudySetsService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly newUrl = ROUTES.studySetNew;
  readonly studySetUrl = studySetUrl;

  private initial = paramsFrom(this.route.snapshot.queryParamMap);
  searchControl = new FormControl(this.initial.q, { nonNullable: true });
  sortControl = new FormControl<StudySetSort>(this.initial.sort, { nonNullable: true });

  private params$ = this.route.queryParamMap.pipe(
    map(paramsFrom),
    distinctUntilChanged(sameParams),
  );
  params = toSignal(this.params$, { initialValue: this.initial });

  loading = signal(true);
  result = toSignal(
    this.params$.pipe(
      tap(() => this.loading.set(true)),
      switchMap((params) =>
        // Lỗi đã hiện ở dialog chung; trả null để luồng không chết, lần đổi bộ lọc sau vẫn gọi lại được.
        this.studySets.listMine(params).pipe(catchError(() => of(null))),
      ),
      tap(() => this.loading.set(false)),
    ),
    { initialValue: null },
  );

  sortOptions = computed<SelectOption[]>(() => {
    this.translate.locale();
    return SORTS.map((value) => ({ value, label: this.translate.t(`studySet.sort.${value}`) }));
  });

  private dateLocale = computed(() => APP_SETTINGS.i18n.formatLocale[this.translate.locale()]);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(searchDebounceMs),
        map((q) => q.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((q) => this.updateQuery({ q: q || null, page: null }));

    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((sort) => this.updateQuery({ sort: sort === 'RECENT' ? null : sort, page: null }));

    // Back / Forward đổi URL -> đưa ô tìm kiếm và sắp xếp về đúng bộ lọc (không phát lại valueChanges).
    this.params$.pipe(takeUntilDestroyed()).subscribe(({ q, sort }) => {
      if (this.searchControl.value.trim() !== q)
        this.searchControl.setValue(q, { emitEvent: false });
      if (this.sortControl.value !== sort) this.sortControl.setValue(sort, { emitEvent: false });
    });
  }

  goToPage(page: number): void {
    // Đổi trang thì thêm vào lịch sử (Back quay lại trang trước); gõ tìm kiếm thì không.
    this.updateQuery({ page: page > 0 ? page : null }, false);
    window.scrollTo({ top: 0 });
  }

  formatDate(value: string): string {
    return formatDate(value, this.dateLocale());
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
