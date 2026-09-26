import { APP_SETTINGS } from '../../core/config';
import { parseCards } from './card-import';

describe('parseCards', () => {
  it('Tab + xuống dòng (copy từ Excel / Sheets), bỏ dòng trống, trim', () => {
    const rows = parseCards(' cat \tcon mèo\r\n\r\ndog\t con chó \n', 'tab', 'newline');
    expect(rows).toEqual([
      { line: 1, term: 'cat', definition: 'con mèo', error: null },
      { line: 3, term: 'dog', definition: 'con chó', error: null },
    ]);
  });

  it('ô Excel có xuống dòng / ngoặc kép được bọc trong "..."', () => {
    const rows = parseCards('"multi\nline"\t"say ""hi"""\nnext\tok', 'tab', 'newline');
    expect(rows.map((r) => [r.term, r.definition, r.line])).toEqual([
      ['multi\nline', 'say "hi"', 1],
      ['next', 'ok', 3],
    ]);
  });

  it('dấu phẩy: chỉ tách ở dấu phẩy đầu tiên, phần sau giữ nguyên là định nghĩa', () => {
    const [row] = parseCards('apple, quả táo, trái táo', 'comma', 'newline');
    expect(row.term).toBe('apple');
    expect(row.definition).toBe('quả táo, trái táo');
  });

  it('dấu chấm phẩy giữa các thẻ, xuống dòng chỉ để dễ đọc', () => {
    const rows = parseCards('cat,con mèo;\ndog,con chó;', 'comma', 'semicolon');
    expect(rows.map((r) => [r.term, r.definition, r.line])).toEqual([
      ['cat', 'con mèo', 1],
      ['dog', 'con chó', 2],
    ]);
  });

  it('Excel nhiều hơn 2 cột: các cột sau nối vào định nghĩa', () => {
    const [row] = parseCards('cat	con mèo	noun', 'tab', 'newline');
    expect(row.definition).toBe('con mèo noun');
  });

  it('đánh dấu dòng lỗi', () => {
    const long = 'x'.repeat(APP_SETTINGS.validation.cardTermMaxLength + 1);
    const rows = parseCards(`only term\n\tno term\n${long}\tdef`, 'tab', 'newline');
    expect(rows.map((r) => r.error)).toEqual(['missingDefinition', 'missingTerm', 'termTooLong']);
  });
});
