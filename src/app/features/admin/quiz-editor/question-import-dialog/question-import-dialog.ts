import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { APP_SETTINGS } from '../../../../core/config';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { TabItem, TabsComponent } from '../../../../shared/ui/tabs/tabs';
import { TableColumn, TableComponent } from '../../../../shared/ui/table/table';
import { TextErrorComponent } from '../../../../shared/ui/text-error/text-error';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { TsvRow } from '../../../../shared/utils/tsv.utils';
import {
  IMPORT_SAMPLE,
  IMPORT_TEMPLATE_URL,
  ImportedQuestion,
  parseQuestionRows,
  parseQuestions,
} from '../question-import';
import { ImportFileError, ImportFileException, readQuestionFile } from '../question-import-file';
import { OPTION_LETTERS } from '../../../../shared/utils/common.utils';

type ImportMode = 'file' | 'paste';

/**
 * Nhập câu hỏi từ file .xlsx hoặc dán từ Excel / Google Sheets -> xem trước, báo lỗi từng dòng -> thêm vào
 * trình soạn đề. 2 cách nhập dùng chung phần kiểm tra (`parseQuestionRows`) và bảng xem trước.
 */
@Component({
  selector: 'app-question-import-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DialogComponent,
    IconComponent,
    TableComponent,
    TabsComponent,
    TextareaComponent,
    TextErrorComponent,
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

  readonly templateUrl = IMPORT_TEMPLATE_URL;
  readonly maxFileSizeMb = APP_SETTINGS.questionImport.maxFileSizeMb;

  mode = signal<ImportMode>('file');
  tabs = computed<TabItem[]>(() => {
    this.translate.locale();
    return [
      { id: 'file', label: this.translate.t('adminQuiz.import.tabFile') },
      { id: 'paste', label: this.translate.t('adminQuiz.import.tabPaste') },
    ];
  });

  text = new FormControl('', { nonNullable: true });
  /** Xem trước cập nhật theo từng lần gõ / dán. */
  private value = toSignal(this.text.valueChanges, { initialValue: '' });

  fileName = signal<string | null>(null);
  fileRows = signal<TsvRow[]>([]);
  fileError = signal<ImportFileError | null>(null);
  reading = signal(false);
  dragging = signal(false);
  /** Chọn file mới khi file cũ đang đọc dở -> bỏ kết quả của file cũ. */
  private readSeq = 0;

  rows = computed(() =>
    this.mode() === 'file' ? parseQuestionRows(this.fileRows()) : parseQuestions(this.value()),
  );
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
          return index === null ? '—' : OPTION_LETTERS[index];
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
      if (this.open()) {
        this.text.reset();
        this.mode.set('file');
        this.clearFile();
      }
    });
  }

  selectMode(id: string): void {
    this.mode.set(id as ImportMode);
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Cho chọn lại đúng file vừa chọn (sau khi sửa trong Excel) vẫn phát sự kiện change.
    input.value = '';
    if (file) this.readFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.readFile(file);
  }

  async readFile(file: File): Promise<void> {
    this.clearFile();
    const seq = this.readSeq;
    this.fileName.set(file.name);
    this.reading.set(true);
    try {
      const rows = await readQuestionFile(file);
      if (seq === this.readSeq) this.fileRows.set(rows);
    } catch (err) {
      if (seq !== this.readSeq) return;
      if (!(err instanceof ImportFileException)) throw err;
      this.fileError.set(err.code);
    } finally {
      if (seq === this.readSeq) this.reading.set(false);
    }
  }

  private clearFile(): void {
    this.readSeq++;
    this.fileName.set(null);
    this.fileRows.set([]);
    this.fileError.set(null);
    this.reading.set(false);
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
