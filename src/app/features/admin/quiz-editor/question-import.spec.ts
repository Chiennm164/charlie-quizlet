import { APP_SETTINGS } from '../../../core/config';
import { IMPORT_SAMPLE, parseQuestions } from './question-import';

describe('parseQuestions', () => {
  it('dòng mẫu: bỏ dòng tiêu đề, đọc đúng câu hỏi / đáp án / đáp án đúng', () => {
    const rows = parseQuestions(IMPORT_SAMPLE);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      line: 2,
      content: 'Thủ đô của Việt Nam là?',
      explanation: 'Hà Nội là thủ đô từ năm 1976.',
      options: ['Huế', 'Hà Nội', 'Đà Nẵng', 'TP.HCM'],
      correctIndex: 1,
      error: null,
    });
    expect(rows[1]).toMatchObject({ options: ['4', '5'], correctIndex: 0, explanation: '' });
  });

  it('đáp án đúng nhận chữ thường và số; ô trống cuối dòng không tính là đáp án', () => {
    const [byLetter, byNumber] = parseQuestions('Q1\tc\t\ta\tb\tc\t\t\nQ2\t2\t\tx\ty');
    expect(byLetter.options).toEqual(['a', 'b', 'c']);
    expect(byLetter.correctIndex).toBe(2);
    expect(byNumber.correctIndex).toBe(1);
  });

  it('ô Excel có xuống dòng (bọc ngoặc kép) vẫn là 1 câu', () => {
    const [row] = parseQuestions('"Dòng 1\nDòng 2"\tA\t\tx\ty');
    expect(row.content).toBe('Dòng 1\nDòng 2');
    expect(row.error).toBeNull();
  });

  it('đánh dấu dòng lỗi', () => {
    const long = 'x'.repeat(APP_SETTINGS.validation.questionContentMaxLength + 1);
    const text = [
      '\tA\t\tx\ty', // thiếu câu hỏi
      'Q\tA\t\tchỉ 1', // ít hơn 2 đáp án
      'Q\tA\t\ta\tb\tc\td\te\tf\tg', // hơn 6 đáp án
      'Q\tA\t\tHà Nội\thà nội', // trùng đáp án
      'Q\tE\t\tx\ty', // đáp án đúng ngoài số đáp án
      'Q\tA\t\tx\t\ty', // đáp án trống ở giữa
      `${long}\tA\t\tx\ty`,
    ].join('\n');
    expect(parseQuestions(text).map((r) => r.error)).toEqual([
      'missingQuestion',
      'tooFewOptions',
      'tooManyOptions',
      'duplicateOption',
      'invalidCorrect',
      'tooFewOptions',
      'questionTooLong',
    ]);
  });
});
