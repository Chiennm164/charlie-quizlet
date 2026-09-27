import { APP_SETTINGS } from '../../../core/config';
import { formatDate } from '../../../shared/utils/common.utils';
import { TsvRow } from '../../../shared/utils/tsv.utils';

export type ImportFileError = 'notXlsx' | 'fileTooLarge' | 'unreadable' | 'emptyFile';

/** Lỗi đọc file, `code` là key dịch `adminQuiz.import.fileErrors.<code>`. */
export class ImportFileException extends Error {
  constructor(readonly code: ImportFileError) {
    super(code);
  }
}

type Cell = string | number | boolean | Date | null;

/**
 * Đọc sheet đầu tiên của file .xlsx thành các dòng giống văn bản dán (`parseQuestionRows` dùng chung).
 * Thư viện đọc Excel chỉ tải khi cần (dynamic import) để không làm nặng bundle chính.
 */
export async function readQuestionFile(file: File): Promise<TsvRow[]> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new ImportFileException('notXlsx');
  if (file.size > APP_SETTINGS.questionImport.maxFileSizeMb * 1024 * 1024) {
    throw new ImportFileException('fileTooLarge');
  }

  let data: Cell[][];
  try {
    const { readSheet } = await import('read-excel-file/browser');
    // Giữ số nguyên văn như trong file ("0.1", "007"), không đổi qua number của JS.
    data = (await readSheet(file, { parseNumber: (value) => value })) as Cell[][];
  } catch {
    // .xls cũ đổi đuôi, file hỏng, file có mật khẩu...
    throw new ImportFileException('unreadable');
  }

  const rows = sheetToRows(data);
  if (!rows.length) throw new ImportFileException('emptyFile');
  return rows;
}

/** Ô -> chuỗi; bỏ dòng trống; `line` là số dòng trong Excel (sheet bắt đầu từ ô A1). */
export function sheetToRows(data: Cell[][]): TsvRow[] {
  return data
    .map((cells, i) => ({ fields: cells.map(cellText), line: i + 1 }))
    .filter((row) => row.fields.some((field) => field.trim() !== ''));
}

function cellText(cell: Cell): string {
  if (cell === null) return '';
  // Excel lưu ngày dạng UTC 0h -> hiển thị theo UTC để không lệch 1 ngày.
  if (cell instanceof Date)
    return formatDate(cell, APP_SETTINGS.i18n.formatLocale.vn, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return String(cell);
}
