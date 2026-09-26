import { QuizQuestion } from '../../../core/models';
import { createQuestion, removeOption, toQuestionRequest } from './quiz-form';

const EXISTING: QuizQuestion = {
  id: 100,
  content: '2 + 2 = ?',
  explanation: null,
  options: [
    { id: 1, content: '3', correct: false },
    { id: 2, content: '4', correct: true },
    { id: 3, content: '5', correct: false },
  ],
};

describe('quiz-form', () => {
  it('câu mới: 4 đáp án trống, chưa chọn đáp án đúng -> không hợp lệ', () => {
    const question = createQuestion();
    expect(question.controls.options.length).toBe(4);
    expect(question.controls.correctIndex.value).toBeNull();
    expect(question.valid).toBe(false);
  });

  it('nạp câu đã có: đáp án đúng thành vị trí, giữ id', () => {
    const question = createQuestion(EXISTING);
    expect(question.controls.correctIndex.value).toBe(1);
    expect(question.valid).toBe(true);
    expect(toQuestionRequest(question)).toEqual({
      id: 100,
      content: '2 + 2 = ?',
      explanation: null,
      options: [
        { id: 1, content: '3', correct: false },
        { id: 2, content: '4', correct: true },
        { id: 3, content: '5', correct: false },
      ],
    });
  });

  it('xoá đáp án: giữ đúng đáp án đúng đang chọn', () => {
    const question = createQuestion(EXISTING);
    removeOption(question, 0); // xoá "3" đứng trước đáp án đúng -> vị trí dồn lên
    expect(question.controls.correctIndex.value).toBe(0);
    expect(toQuestionRequest(question).options.find((o) => o.correct)?.content).toBe('4');

    removeOption(question, 0); // xoá chính đáp án đúng -> phải chọn lại
    expect(question.controls.correctIndex.value).toBeNull();
  });

  it('đáp án trùng trong cùng câu -> lỗi dưới đáp án', () => {
    const question = createQuestion(EXISTING);
    question.controls.options.at(2).controls.content.setValue(' 4 ');
    expect(question.controls.options.at(2).controls.content.hasError('duplicate')).toBe(true);
  });

  it('trim nội dung, giải thích rỗng -> null', () => {
    const question = createQuestion(EXISTING);
    question.patchValue({ content: '  Hỏi  ', explanation: '   ' });
    const request = toQuestionRequest(question);
    expect(request.content).toBe('Hỏi');
    expect(request.explanation).toBeNull();
  });
});
