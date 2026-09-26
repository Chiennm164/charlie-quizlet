import { APP_SETTINGS } from '../../../core/config';
import { parseTsv } from '../../../shared/utils/tsv.utils';

/*
 * Nhập câu hỏi dán từ Excel / Google Sheets. Cột cố định đứng trước, đáp án (số lượng thay đổi 2–6) đứng cuối:
 *
 *   Câu hỏi | Đáp án đúng (A–F hoặc 1–6) | Giải thích (có thể trống) | Đáp án A | Đáp án B | ... (tối đa F)
 */

export type ImportError =
  | 'missingQuestion'
  | 'questionTooLong'
  | 'explanationTooLong'
  | 'tooFewOptions'
  | 'tooManyOptions'
  | 'optionTooLong'
  | 'duplicateOption'
  | 'invalidCorrect';

export interface ImportedQuestion {
  /** Số dòng trong văn bản dán vào (bắt đầu từ 1). */
  line: number;
  content: string;
  explanation: string;
  options: string[];
  /** Vị trí đáp án đúng trong `options`; null khi cột đáp án đúng sai / trống. */
  correctIndex: number | null;
  error: ImportError | null;
}

const v = APP_SETTINGS.validation;
const LETTERS = 'ABCDEF';

/** Dòng mẫu (có dòng tiêu đề) — dán vào Excel là tự tách ra đúng các cột. */
export const IMPORT_SAMPLE = [
  ['Câu hỏi', 'Đáp án đúng', 'Giải thích', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
  [
    'Thủ đô của Việt Nam là?',
    'B',
    'Hà Nội là thủ đô từ năm 1976.',
    'Huế',
    'Hà Nội',
    'Đà Nẵng',
    'TP.HCM',
  ],
  ['2 + 2 = ?', 'A', '', '4', '5'],
]
  .map((row) => row.join('\t'))
  .join('\n');

export function parseQuestions(text: string): ImportedQuestion[] {
  return parseTsv(text)
    .filter((row, i) => !(i === 0 && isHeader(row.fields)))
    .map(({ fields, line }) => {
      const [content = '', correct = '', explanation = '', ...rawOptions] = fields.map((f) =>
        f.trim(),
      );
      // Ô trống cuối dòng (Excel copy cả cột trống) không tính là đáp án.
      const options = trimTrailingEmpty(rawOptions);
      const correctIndex = toIndex(correct, options.length);
      return {
        line,
        content,
        explanation,
        options,
        correctIndex,
        error: rowError(content, explanation, options, correctIndex),
      };
    });
}

function rowError(
  content: string,
  explanation: string,
  options: string[],
  correctIndex: number | null,
): ImportError | null {
  if (!content) return 'missingQuestion';
  if (content.length > v.questionContentMaxLength) return 'questionTooLong';
  if (explanation.length > v.questionExplanationMaxLength) return 'explanationTooLong';
  if (options.length < v.questionMinOptions || options.some((option) => !option)) {
    return 'tooFewOptions';
  }
  if (options.length > v.questionMaxOptions) return 'tooManyOptions';
  if (options.some((option) => option.length > v.optionContentMaxLength)) return 'optionTooLong';
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    return 'duplicateOption';
  }
  if (correctIndex === null) return 'invalidCorrect';
  return null;
}

/** "B" / "b" / "2" -> 1. Ngoài số đáp án đang có -> null. */
function toIndex(value: string, optionCount: number): number | null {
  const letter = LETTERS.indexOf(value.toUpperCase());
  const index = letter >= 0 && value.length === 1 ? letter : Number(value) - 1;
  return Number.isInteger(index) && index >= 0 && index < optionCount ? index : null;
}

/** Dòng đầu là tiêu đề cột nếu cột "đáp án đúng" không phải A–F / 1–6 (vd. "Đáp án đúng", "Correct"). */
function isHeader(fields: string[]): boolean {
  const correct = (fields[1] ?? '').trim();
  return correct.length > 1 && !/^\d+$/.test(correct);
}

function trimTrailingEmpty(values: string[]): string[] {
  let end = values.length;
  while (end > 0 && !values[end - 1]) end--;
  return values.slice(0, end);
}
