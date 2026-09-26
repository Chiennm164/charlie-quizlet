import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { TableColumn, TableComponent } from '../../../../shared/ui/table/table';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { IMPORT_SAMPLE, ImportedQuestion, parseQuestions } from '../question-import';

const LETTERS = 'ABCDEF';

/** Dán câu hỏi từ Excel / Google Sheets -> xem trước, báo lỗi từng dòng -> thêm vào trình soạn đề. */
@Component({
  selector: 'app-question-import-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DialogComponent,
    IconComponent,
    TableComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './question-import-dialog.html',
})
export class QuestionImportDialogComponent {
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  open = input(false);
  /** Số câu còn thêm được (giới hạn số câu của đề trừ câu đã có). */
  capacity = input.required<number>();
  closed = output<void>();
  imported = output<ImportedQuestion[]>();

  text = new FormControl('', { nonNullable: true });
  /** Xem trước cập nhật theo từng lần gõ / dán. */
  private value = toSignal(this.text.valueChanges, { initialValue: '' });

  rows = computed(() => parseQuestions(this.value()));
  validRows = computed(() => this.rows().filter((row) => !row.error));
  errorCount = computed(() => this.rows().length - this.validRows().length);
  overCapacity = computed(() => this.validRows().length > this.capacity());

  columns = computed<TableColumn[]>(() => {
    this.translate.locale();
    const row = (value: unknown) => value as ImportedQuestion;
    return [
      { key: 'line', header: this.translate.t('adminQuiz.import.line') },
      { key: 'content', header: this.translate.t('adminQuiz.import.question') },
      {
        key: 'options',
        header: this.translate.t('adminQuiz.import.options'),
        render: (value) => String(row(value).options.length),
      },
      {
        key: 'correctIndex',
        header: this.translate.t('adminQuiz.import.correct'),
        render: (value) => {
          const index = row(value).correctIndex;
          return index === null ? '—' : LETTERS[index];
        },
      },
      {
        key: 'error',
        header: this.translate.t('adminQuiz.import.status'),
        render: (value) => {
          const error = row(value).error;
          return error ? this.translate.t(`adminQuiz.import.errors.${error}`) : '✓';
        },
      },
    ];
  });

  trackByLine = (row: unknown) => (row as ImportedQuestion).line;

  constructor() {
    // Mỗi lần mở là 1 lần nhập mới.
    effect(() => {
      if (this.open()) this.text.reset();
    });
  }

  async copySample(): Promise<void> {
    try {
      await navigator.clipboard.writeText(IMPORT_SAMPLE);
      this.toast.success(this.translate.t('adminQuiz.import.sampleCopied'));
    } catch {
      // Trình duyệt chặn clipboard (vd. không phải HTTPS): điền mẫu vào ô để người dùng tự chép.
      this.text.setValue(IMPORT_SAMPLE);
    }
  }

  submit(): void {
    if (!this.validRows().length || this.overCapacity()) return;
    this.imported.emit(this.validRows());
  }
}
