import { sheetToRows } from './question-import-file';
import { parseQuestionRows } from './question-import';
import { questionsToRows } from './question-export';

describe('questionsToRows', () => {
  it('xuất đúng mẫu nhập: nhập lại file vừa xuất ra được đúng các câu cũ', () => {
    const questions = [
      {
        id: 1,
        content: 'Thủ đô?',
        explanation: 'Từ 1976',
        options: [
          { id: 11, content: 'Huế', correct: false },
          { id: 12, content: 'Hà Nội', correct: true },
        ],
      },
      {
        id: 2,
        content: '2 + 2',
        explanation: null,
        options: [
          { id: 21, content: '4', correct: true },
          { id: 22, content: '5', correct: false },
          { id: 23, content: '6', correct: false },
        ],
      },
    ];
    const rows = questionsToRows(questions);
    expect(rows[0][0]).toBe('Câu hỏi');
    expect(rows[1]).toEqual(['Thủ đô?', 'B', 'Từ 1976', 'Huế', 'Hà Nội']);

    const reimported = parseQuestionRows(sheetToRows(rows));
    expect(
      reimported.map(({ content, explanation, options, correctIndex, error }) => ({
        content,
        explanation,
        options,
        correctIndex,
        error,
      })),
    ).toEqual([
      {
        content: 'Thủ đô?',
        explanation: 'Từ 1976',
        options: ['Huế', 'Hà Nội'],
        correctIndex: 1,
        error: null,
      },
      { content: '2 + 2', explanation: '', options: ['4', '5', '6'], correctIndex: 0, error: null },
    ]);
  });

  it('câu chưa chọn đáp án đúng -> để trống cột đáp án đúng (nhập lại sẽ báo lỗi, không đoán)', () => {
    const rows = questionsToRows([
      {
        id: null,
        content: 'Q',
        explanation: null,
        options: [
          { id: null, content: 'a', correct: false },
          { id: null, content: 'b', correct: false },
        ],
      },
    ]);
    expect(rows[1][1]).toBe('');
  });
});
