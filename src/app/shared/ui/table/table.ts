import {
  Component,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateService } from '../../../core/i18n/translate.service';

export interface TableColumn {
  key: string;
  header: string;
  render?: (row: unknown) => string;
  /** Ghim cột khi bảng cuộn ngang. Chỉ hỗ trợ tối đa 1 cột ghim mỗi bên (left/right). */
  pinned?: 'left' | 'right';
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './table.html',
})
export class TableComponent {
  private translate = inject(TranslateService);

  columns = input<TableColumn[]>([]);
  rows = input<unknown[]>([]);
  /** Để trống sẽ dùng bản dịch mặc định (common.noData) theo ngôn ngữ hiện tại. */
  emptyText = input<string | null>(null);
  trackBy = input<(row: unknown) => unknown>((row) => row);

  /** Bật cột checkbox chọn dòng (+ checkbox "chọn tất cả" ở header). */
  selectable = input(false);
  selectedRows = input<unknown[]>([]);
  selectedRowsChange = output<unknown[]>();

  rowActions = contentChild<TemplateRef<{ $implicit: unknown }>>('rowActions');

  trackByFn = (row: unknown) => this.trackBy()(row);

  defaultEmptyText = computed(() => {
    this.translate.locale();
    return this.translate.t('common.noData');
  });

  totalColspan = computed(
    () => this.columns().length + (this.rowActions() ? 1 : 0) + (this.selectable() ? 1 : 0),
  );

  private selectedKeys = computed(
    () => new Set(this.selectedRows().map((row) => this.trackBy()(row))),
  );

  allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((row) => this.isSelected(row)),
  );

  partiallySelected = computed(
    () => !this.allSelected() && this.rows().some((row) => this.isSelected(row)),
  );

  isSelected(row: unknown): boolean {
    return this.selectedKeys().has(this.trackBy()(row));
  }

  toggleRow(row: unknown, checked: boolean): void {
    const key = this.trackBy()(row);
    const next = checked
      ? [...this.selectedRows(), row]
      : this.selectedRows().filter((r) => this.trackBy()(r) !== key);
    this.selectedRowsChange.emit(next);
  }

  toggleAll(checked: boolean): void {
    this.selectedRowsChange.emit(checked ? [...this.rows()] : []);
  }

  cellValue(row: unknown, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }
}
