import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogComponent } from '../../../shared/ui/dialog/dialog';
import { RadioGroupComponent, RadioOption } from '../../../shared/ui/radio-group/radio-group';
import { TableColumn, TableComponent } from '../../../shared/ui/table/table';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea';
import { CardSeparator, ImportRow, TermSeparator, parseCards } from '../card-import';

export interface ImportedCard {
  term: string;
  definition: string;
}

const TERM_SEPARATORS: TermSeparator[] = ['tab', 'comma'];
const CARD_SEPARATORS: CardSeparator[] = ['newline', 'semicolon'];

/** Dán văn bản (vd. copy 2 cột từ Excel) -> xem trước -> thêm vào trình soạn thẻ. */
@Component({
  selector: 'app-card-import-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DialogComponent,
    RadioGroupComponent,
    TableComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './card-import-dialog.html',
})
export class CardImportDialogComponent {
  private translate = inject(TranslateService);

  open = input(false);
  /** Số thẻ còn thêm được (giới hạn số thẻ của học phần trừ thẻ đã có). */
  capacity = input.required<number>();
  closed = output<void>();
  imported = output<ImportedCard[]>();

  form = inject(FormBuilder).nonNullable.group({
    text: [''],
    termSeparator: ['tab' as TermSeparator],
    cardSeparator: ['newline' as CardSeparator],
  });

  /** Xem trước cập nhật theo từng lần gõ / đổi ký tự ngăn cách. */
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  rows = computed<ImportRow[]>(() => {
    const { text = '', termSeparator = 'tab', cardSeparator = 'newline' } = this.formValue();
    return parseCards(text, termSeparator, cardSeparator);
  });
  validRows = computed(() => this.rows().filter((row) => !row.error));
  errorCount = computed(() => this.rows().length - this.validRows().length);
  overCapacity = computed(() => this.validRows().length > this.capacity());

  termSeparatorOptions = computed<RadioOption[]>(() =>
    this.options('studySet.import.termSeparator', TERM_SEPARATORS),
  );
  cardSeparatorOptions = computed<RadioOption[]>(() =>
    this.options('studySet.import.cardSeparator', CARD_SEPARATORS),
  );

  columns = computed<TableColumn[]>(() => {
    this.translate.locale();
    return [
      { key: 'line', header: this.translate.t('studySet.import.line') },
      { key: 'term', header: this.translate.t('studySet.term') },
      { key: 'definition', header: this.translate.t('studySet.definition') },
      {
        key: 'error',
        header: this.translate.t('studySet.import.status'),
        render: (row) => {
          const error = (row as ImportRow).error;
          return error ? this.translate.t(`studySet.import.errors.${error}`) : '✓';
        },
      },
    ];
  });

  trackByLine = (row: unknown) => (row as ImportRow).line;

  constructor() {
    // Mỗi lần mở là 1 lần nhập mới; giữ lựa chọn ký tự ngăn cách của lần trước.
    effect(() => {
      if (this.open()) this.form.controls.text.reset();
    });
  }

  submit(): void {
    const cards = this.validRows();
    if (!cards.length || this.overCapacity()) return;
    this.imported.emit(cards.map(({ term, definition }) => ({ term, definition })));
  }

  private options(prefix: string, values: string[]): RadioOption[] {
    this.translate.locale();
    return values.map((value) => ({ value, label: this.translate.t(`${prefix}.${value}`) }));
  }
}
