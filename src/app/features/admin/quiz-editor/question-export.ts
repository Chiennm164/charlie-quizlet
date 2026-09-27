import { QuizQuestionRequest } from '../../../core/models';
import { OPTION_LETTERS, toFileName } from '../../../shared/utils/common.utils';
import { IMPORT_HEADER } from './question-import';

/** Độ rộng cột (ký tự) giống file mẫu: câu hỏi, đáp án đúng, giải thích, 6 đáp án. */
const COLUMN_WIDTHS = [40, 13, 32, 16, 16, 16, 16, 16, 16].map((width) => ({ width }));

/**
 * Câu hỏi -> các dòng đúng định dạng nhập (tiêu đề + mỗi câu 1 dòng): sửa trong Excel rồi nhập lại được.
 * Câu chưa chọn đáp án đúng để trống cột đó (nhập lại sẽ báo lỗi dòng, không đoán).
 */
export function questionsToRows(questions: QuizQuestionRequest[]): string[][] {
  return [
    IMPORT_HEADER,
    ...questions.map((question) => {
      const correct = question.options.findIndex((option) => option.correct);
      return [
        question.content,
        correct >= 0 ? OPTION_LETTERS[correct] : '',
        question.explanation ?? '',
        ...question.options.map((option) => option.content),
      ];
    }),
  ];
}

/** Tải file .xlsx (sheet "Câu hỏi"). Thư viện ghi Excel chỉ tải khi bấm xuất. */
export async function exportQuestionsXlsx(
  title: string,
  questions: QuizQuestionRequest[],
): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const [header, ...rows] = questionsToRows(questions);
  await writeXlsxFile([header.map((value) => ({ value, fontWeight: 'bold' as const })), ...rows], {
    columns: COLUMN_WIDTHS,
    sheet: 'Câu hỏi',
  }).toFile(`${toFileName(title)}.xlsx`);
}
