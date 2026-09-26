import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { catchError, finalize, map, of, startWith } from 'rxjs';
import { ConfirmDialogService } from '../../../core/confirm/confirm-dialog.service';
import { APP_SETTINGS, ROUTES, adminQuizEditUrl, quizUrl } from '../../../core/config';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { Quiz, QuizRequest, QuizStatus } from '../../../core/models';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { InputNumberComponent } from '../../../shared/ui/input-number/input-number';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { SelectComponent, SelectOption } from '../../../shared/ui/select/select';
import { TextErrorComponent } from '../../../shared/ui/text-error/text-error';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { controlErrorMessage, notBlankValidator } from '../../../shared/utils/validation.utils';
import { QuizzesService } from '../../quizzes/quizzes.service';
import { AdminQuizzesService } from '../admin-quizzes.service';
import { QuestionEditorComponent } from './question-editor/question-editor';
import { QuestionImportDialogComponent } from './question-import-dialog/question-import-dialog';
import { ImportedQuestion } from './question-import';
import {
  QuestionForm,
  createQuestion,
  createQuestionFrom,
  isBlankQuestion,
  toQuestionRequest,
} from './quiz-form';

const v = APP_SETTINGS.validation;

/**
 * Trình soạn bộ đề (`/admin/quizzes/new`, `/admin/quizzes/:id/edit`, ADMIN): thông tin đề + danh sách câu hỏi
 * (FormArray, kéo thả sắp xếp). Lưu nháp / xuất bản (= duyệt, học sinh thấy). Có cảnh báo rời trang khi chưa lưu.
 */
@Component({
  selector: 'app-quiz-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CdkDropList,
    CdkDrag,
    BreadcrumbComponent,
    ButtonComponent,
    IconComponent,
    InputNumberComponent,
    InputTextComponent,
    LoadingComponent,
    PageHeaderComponent,
    QuestionEditorComponent,
    QuestionImportDialogComponent,
    SelectComponent,
    TextErrorComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './quiz-editor.html',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class QuizEditorComponent implements HasUnsavedChanges {
  private adminQuizzes = inject(AdminQuizzesService);
  private quizzes = inject(QuizzesService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  private route = inject(ActivatedRoute).snapshot;
  /** Có id = đang sửa đề đã có. */
  readonly editingId = Number(this.route.paramMap.get('id')) || null;
  /** Trang học sinh của đề đang sửa (nút "Xem như học sinh" khi đề đã xuất bản). */
  readonly viewUrl = this.editingId ? quizUrl(this.editingId) : null;
  readonly listUrl = ROUTES.adminQuizzes;
  readonly topicsUrl = ROUTES.adminTopics;
  readonly maxQuestions = v.quizMaxQuestions;
  readonly maxTimeLimit = v.quizTimeLimitMaxMinutes;

  loading = signal(this.editingId !== null);
  saving = signal(false);
  /** Trạng thái đã lưu trên BE (đề mới = nháp) — quyết định các nút lưu. */
  savedStatus = signal<QuizStatus>('DRAFT');
  /** Bấm xuất bản khi chưa có câu nào. */
  emptyError = signal(false);
  importOpen = signal(false);

  private questionRows = viewChildren('questionRow', { read: ElementRef<HTMLElement> });

  form = new FormGroup({
    topicId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(v.quizTitleMaxLength)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(v.quizDescriptionMaxLength)],
    }),
    timeLimitMinutes: new FormControl<number | null>(null, [
      Validators.min(1),
      Validators.max(v.quizTimeLimitMaxMinutes),
    ]),
    questions: new FormArray<QuestionForm>([]),
  });

  get questions() {
    return this.form.controls.questions;
  }

  /** FormArray không phải signal: đếm lại mỗi khi danh sách đổi để template (zoneless) cập nhật. */
  questionCount = toSignal(
    this.questions.valueChanges.pipe(
      startWith(null),
      map(() => this.questions.length),
    ),
    { initialValue: 0 },
  );

  private topics = toSignal(this.quizzes.listTopics().pipe(catchError(() => of([]))));
  topicOptions = computed<SelectOption[]>(() =>
    (this.topics() ?? []).map((topic) => ({ value: String(topic.id), label: topic.name })),
  );
  noTopics = computed(() => this.topics()?.length === 0);

  breadcrumb = computed<BreadcrumbItem[]>(() => {
    this.translate.locale();
    return [
      { label: this.translate.t('nav.manageQuizzes'), url: ROUTES.adminQuizzes },
      {
        label: this.translate.t(this.editingId ? 'adminQuiz.editTitle' : 'adminQuiz.createTitle'),
      },
    ];
  });

  constructor() {
    if (this.editingId) {
      this.load(this.editingId);
    } else {
      this.questions.push(createQuestion());
      // Mở từ "Tạo đề trong chủ đề này" (/admin/quizzes/new?topicId=5): chọn sẵn chủ đề.
      const topicId = this.route.queryParamMap.get('topicId');
      if (topicId) this.form.controls.topicId.setValue(topicId);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  errorFor(control: FormControl<string> | FormControl<number | null>): string | null {
    return controlErrorMessage(control, this.translate);
  }

  addQuestion(): void {
    if (this.questions.length >= v.quizMaxQuestions) return;
    this.questions.push(createQuestion());
    this.questions.markAsDirty();
    this.emptyError.set(false);
    // Câu mới chỉ có trên DOM sau lần render kế tiếp: cuộn tới và đặt con trỏ vào ô nội dung.
    afterNextRender(
      () => {
        const row = this.questionRows().at(-1)?.nativeElement;
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row?.querySelector('textarea')?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  /** Số câu còn nhập thêm được — câu trống sẽ bị thay bằng câu nhập vào nên không tính. */
  importCapacity(): number {
    return v.quizMaxQuestions - this.questions.controls.filter((q) => !isBlankQuestion(q)).length;
  }

  /** Câu nhập nhanh thay cho các câu trống (vd. câu trống có sẵn của đề mới), rồi thêm vào cuối. */
  importQuestions(imported: ImportedQuestion[]): void {
    for (let i = this.questions.length - 1; i >= 0; i--) {
      if (isBlankQuestion(this.questions.at(i))) this.questions.removeAt(i);
    }
    for (const question of imported) this.questions.push(createQuestionFrom(question));
    this.questions.markAsDirty();
    this.emptyError.set(false);
    this.importOpen.set(false);
    this.toast.success(this.translate.t('adminQuiz.import.done', { n: imported.length }));
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
    this.questions.markAsDirty();
  }

  drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const question = this.questions.at(event.previousIndex);
    this.questions.removeAt(event.previousIndex, { emitEvent: false });
    this.questions.insert(event.currentIndex, question);
    this.questions.markAsDirty();
  }

  /** Lưu với trạng thái chỉ định: DRAFT (lưu nháp / chuyển về nháp) hoặc PUBLISHED (xuất bản / lưu đề đang xuất bản). */
  save(status: QuizStatus): void {
    this.form.markAllAsTouched();
    this.emptyError.set(status === 'PUBLISHED' && this.questions.length === 0);
    if (this.form.invalid || this.emptyError() || this.saving()) return;

    this.saving.set(true);
    const request = this.toRequest(status);
    const save$ = this.editingId
      ? this.adminQuizzes.update(this.editingId, request)
      : this.adminQuizzes.create(request);
    save$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((quiz) => {
        // Đánh dấu đã lưu trước khi chuyển trang để guard không hỏi "rời trang khi chưa lưu".
        this.form.markAsPristine();
        this.toast.success(this.translate.t(`adminQuiz.saved.${quiz.status}`));
        if (this.editingId) {
          // Nạp lại để câu / đáp án mới có id (lần lưu sau BE giữ đúng câu).
          this.fill(quiz);
        } else {
          this.router.navigateByUrl(adminQuizEditUrl(quiz.id), { replaceUrl: true });
        }
      });
  }

  async delete(): Promise<void> {
    if (!this.editingId || this.saving()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.t('adminQuiz.deleteTitle'),
      message: this.translate.t('adminQuiz.deleteConfirm', {
        title: this.form.controls.title.value,
      }),
      confirmText: this.translate.t('common.delete'),
      danger: true,
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.adminQuizzes
      .delete(this.editingId)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.form.markAsPristine();
        this.toast.success(this.translate.t('adminQuiz.deleted'));
        this.router.navigateByUrl(ROUTES.adminQuizzes);
      });
  }

  private load(id: number): void {
    this.quizzes
      .get(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((quiz) => this.fill(quiz));
  }

  private fill(quiz: Quiz): void {
    this.form.patchValue({
      topicId: String(quiz.topic.id),
      title: quiz.title,
      description: quiz.description ?? '',
      timeLimitMinutes: quiz.timeLimitMinutes,
    });
    this.questions.clear();
    for (const question of quiz.questions ?? []) this.questions.push(createQuestion(question));
    this.savedStatus.set(quiz.status);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private toRequest(status: QuizStatus): QuizRequest {
    const { topicId, title, description, timeLimitMinutes } = this.form.getRawValue();
    return {
      topicId: Number(topicId),
      title: title.trim(),
      description: description.trim() || null,
      timeLimitMinutes: timeLimitMinutes || null,
      status,
      questions: this.questions.controls.map(toQuestionRequest),
    };
  }
}
