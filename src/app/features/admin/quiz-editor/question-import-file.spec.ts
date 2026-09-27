import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readSheet } from 'read-excel-file/node';
import { APP_SETTINGS } from '../../../core/config';
import {
  IMPORT_TEMPLATE_URL,
  parseQuestionRows,
  parseQuestions,
  IMPORT_SAMPLE,
} from './question-import';
import { ImportFileException, readQuestionFile, sheetToRows } from './question-import-file';

describe('sheetToRows', () => {
  it('ô -> chuỗi, bỏ dòng trống nhưng giữ đúng số dòng Excel', () => {
    const rows = sheetToRows([
      [null, null],
      ['Q1', 'A', null, 'x', 'y'],
      [null, '  '],
      ['Q2', '1', true, new Date(Date.UTC(2024, 0, 5)), '0.1'],
    ]);
    expect(rows).toEqual([
      { line: 2, fields: ['Q1', 'A', '', 'x', 'y'] },
      { line: 4, fields: ['Q2', '1', 'true', '05/01/2024', '0.1'] },
    ]);
  });
});

describe('readQuestionFile', () => {
  const code = (promise: Promise<unknown>) => promise.catch((err: ImportFileException) => err.code);

  it('từ chối file không phải .xlsx và file quá lớn trước khi đọc', async () => {
    expect(await code(readQuestionFile(new File(['a'], 'cau-hoi.xls')))).toBe('notXlsx');
    const big = new File(['a'], 'cau-hoi.xlsx');
    Object.defineProperty(big, 'size', {
      value: APP_SETTINGS.questionImport.maxFileSizeMb * 1024 * 1024 + 1,
    });
    expect(await code(readQuestionFile(big))).toBe('fileTooLarge');
  });
});

describe('file mẫu', () => {
  it('đọc ra đúng như dòng mẫu để dán', async () => {
    const file = readFileSync(join(__dirname, '../../../../../public', IMPORT_TEMPLATE_URL));
    const data = await readSheet(file, { parseNumber: (value) => value });
    const fromFile = parseQuestionRows(sheetToRows(data as never));
    const fromSample = parseQuestions(IMPORT_SAMPLE);
    expect(fromFile.map(({ line, ...q }) => q)).toEqual(fromSample.map(({ line, ...q }) => q));
    expect(fromFile.every((q) => q.error === null)).toBe(true);
  });
});
