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
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { finalize, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { APP_SETTINGS, ROUTES, studySetUrl } from '../../../core/config';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { Card, StudySet, StudySetRequest, StudySetVisibility } from '../../../core/models';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { RadioGroupComponent, RadioOption } from '../../../shared/ui/radio-group/radio-group';
import { TextErrorComponent } from '../../../shared/ui/text-error/text-error';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppValidators, controlErrorMessage } from '../../../shared/utils/validation.utils';
import { StudySetsService } from '../study-sets.service';
import { CardImportDialogComponent, ImportedCard } from '../card-import-dialog/card-import-dialog';

type CardForm = FormGroup<{
  /** null = thẻ mới chưa lưu. */
  id: FormControl<number | null>;
  term: FormControl<string>;
  definition: FormControl<string>;
}>;

const { studySetMinCards, studySetMaxCards } = APP_SETTINGS.validation;
const VISIBILITIES: StudySetVisibility[] = ['PRIVATE', 'PUBLIC'];

/** Tạo (`/study-sets/new`) và sửa (`/study-sets/:id/edit`) học phần. */
@Component({
  selector: 'app-study-set-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    ButtonComponent,
    CardImportDialogComponent,
    IconComponent,
    InputTextComponent,
    LoadingComponent,
    PageHeaderComponent,
    RadioGroupComponent,
    TextErrorComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './study-set-editor.html',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class StudySetEditorComponent implements HasUnsavedChanges {
  private fb = inject(FormBuilder).nonNullable;
  private studySets = inject(StudySetsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  /** Có id = đang sửa học phần đã có. */
  readonly editingId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  readonly minCards = studySetMinCards;
  readonly maxCards = studySetMaxCards;

  loading = signal(this.editingId !== null);
  saving = signal(false);
  importOpen = signal(false);
  /** Link "Huỷ": sửa thì về trang học phần, tạo mới thì về danh sách học phần. */
  readonly cancelUrl = this.editingId ? studySetUrl(this.editingId) : ROUTES.studySets;

  private cardRows = viewChildren<ElementRef<HTMLElement>>('cardRow');

  form = this.fb.group({
    title: ['', AppValidators.studySetTitle],
    description: ['', AppValidators.studySetDescription],
    visibility: ['PRIVATE' as StudySetVisibility],
    cards: this.fb.array<CardForm>([], AppValidators.studySetCards),
  });

  get cards() {
    return this.form.controls.cards;
  }

  /** FormArray không phải signal: đếm lại mỗi khi danh sách đổi để template (zoneless) cập nhật. */
  cardCount = toSignal(
    this.cards.valueChanges.pipe(
      startWith(null),
      map(() => this.cards.length),
    ),
    { initialValue: 0 },
  );

  visibilityOptions = computed<RadioOption[]>(() => {
    this.translate.locale();
    return VISIBILITIES.map((value) => ({
      value,
      label: this.translate.t(`studySet.visibility.${value}`),
    }));
  });

  constructor() {
    if (this.editingId) {
      this.load(this.editingId);
    } else {
      for (let i = 0; i < studySetMinCards; i++) this.cards.push(this.createCard());
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    // Trình duyệt tự hiện hộp thoại "Rời trang?" của nó (không tuỳ biến được nội dung).
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  errorFor(control: FormControl<string>): string | null {
    return controlErrorMessage(control, this.translate);
  }

  /** Lỗi thiếu thẻ gắn trên cả danh sách, không gắn với ô nào. */
  cardsError(): string | null {
    const minItems = this.cards.errors?.['minItems'];
    return this.cards.touched && minItems
      ? this.translate.t('studySet.minCards', { n: minItems.min })
      : null;
  }

  addCard(focus = false): void {
    if (this.cards.length >= studySetMaxCards) return;
    this.cards.push(this.createCard());
    this.cards.markAsDirty();
    if (focus) {
      // Dòng mới chỉ có trên DOM sau lần render kế tiếp.
      afterNextRender(
        () => this.cardRows().at(-1)?.nativeElement.querySelector('textarea')?.focus(),
        { injector: this.injector },
      );
    }
  }

  /** Số thẻ còn nhập thêm được — dòng trống sẽ bị thay bằng thẻ nhập vào nên không tính. */
  importCapacity(): number {
    return studySetMaxCards - this.cards.controls.filter((card) => !this.isBlank(card)).length;
  }

  /** Thẻ nhập nhanh thay cho các dòng trống (vd. 2 dòng trống sẵn của học phần mới), rồi thêm vào cuối. */
  importCards(imported: ImportedCard[]): void {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      if (this.isBlank(this.cards.at(i))) this.cards.removeAt(i);
    }
    for (const card of imported) {
      this.cards.push(this.createCard({ id: null, ...card }));
    }
    this.cards.markAsDirty();
    this.importOpen.set(false);
    this.toast.success(this.translate.t('studySet.import.done', { n: imported.length }));
  }

  removeCard(index: number): void {
    this.cards.removeAt(index);
    this.cards.markAsDirty();
  }

  /** Tab ở ô định nghĩa của dòng cuối -> thêm dòng mới và nhảy vào ô thuật ngữ của dòng đó (giống Quizlet). */
  onDefinitionKeydown(event: KeyboardEvent, index: number): void {
    const isLastRow = index === this.cards.length - 1;
    if (event.key !== 'Tab' || event.shiftKey || !isLastRow) return;
    if (this.cards.length >= studySetMaxCards) return;
    event.preventDefault();
    this.addCard(true);
  }

  drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const card = this.cards.at(event.previousIndex);
    this.cards.removeAt(event.previousIndex, { emitEvent: false });
    this.cards.insert(event.currentIndex, card);
    this.cards.markAsDirty();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    const request = this.toRequest();
    const save$ = this.editingId
      ? this.studySets.update(this.editingId, request)
      : this.studySets.create(request);
    save$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((set) => {
        // Đánh dấu đã lưu trước khi chuyển trang để guard không hỏi "rời trang khi chưa lưu".
        this.form.markAsPristine();
        this.toast.success(this.translate.t('studySet.saved'));
        this.router.navigateByUrl(studySetUrl(set.id));
      });
  }

  private load(id: number): void {
    this.studySets
      .get(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((set) => {
        if (set.owner.id !== this.auth.currentUser()?.id) {
          this.router.navigateByUrl(ROUTES.forbidden);
          return;
        }
        this.fillForm(set);
      });
  }

  private fillForm(set: StudySet): void {
    this.form.patchValue({
      title: set.title,
      description: set.description ?? '',
      visibility: set.visibility,
    });
    this.cards.clear();
    for (const card of set.cards) this.cards.push(this.createCard(card));
    this.form.markAsPristine();
  }

  private isBlank(card: CardForm): boolean {
    const { term, definition } = card.getRawValue();
    return !term.trim() && !definition.trim();
  }

  private createCard(card?: Omit<Card, 'id'> & { id: number | null }): CardForm {
    return this.fb.group({
      id: new FormControl<number | null>(card?.id ?? null),
      term: [card?.term ?? '', AppValidators.cardTerm],
      definition: [card?.definition ?? '', AppValidators.cardDefinition],
    });
  }

  private toRequest(): StudySetRequest {
    const { title, description, visibility, cards } = this.form.getRawValue();
    return {
      title: title.trim(),
      description: description.trim() || null,
      visibility,
      cards: cards.map((card) => ({
        id: card.id,
        term: card.term.trim(),
        definition: card.definition.trim(),
      })),
    };
  }
}
