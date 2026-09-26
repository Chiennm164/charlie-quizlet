import { APP_SETTINGS } from '../../core/config';

/** Ký tự ngăn cách thuật ngữ và định nghĩa. Tab: dán thẳng từ Excel / Google Sheets (2 cột). */
export type TermSeparator = 'tab' | 'comma';
/** Ký tự ngăn cách các thẻ. */
export type CardSeparator = 'newline' | 'semicolon';

export type ImportRowError =
  'missingTerm' | 'missingDefinition' | 'termTooLong' | 'definitionTooLong';

export interface ImportRow {
  /** Số thứ tự dòng trong văn bản dán vào (bắt đầu từ 1), để người dùng tìm lại dòng lỗi. */
  line: number;
  term: string;
  definition: string;
  error: ImportRowError | null;
}

const TERM_SEPARATORS: Record<TermSeparator, string> = { tab: '\t', comma: ',' };
const CARD_SEPARATORS: Record<CardSeparator, string> = { newline: '\n', semicolon: ';' };

const { cardTermMaxLength, cardDefinitionMaxLength } = APP_SETTINGS.validation;

/**
 * Tách văn bản dán vào thành các thẻ. Mỗi bản ghi: phần trước ký tự ngăn cách đầu tiên là thuật ngữ, phần còn lại là
 * định nghĩa (vd. "apple, quả táo, trái táo" -> định nghĩa "quả táo, trái táo"). Bỏ qua dòng trống.
 */
export function parseCards(
  text: string,
  termSeparator: TermSeparator,
  cardSeparator: CardSeparator,
): ImportRow[] {
  const fieldSep = TERM_SEPARATORS[termSeparator];
  // Từ cột thứ 3 trở đi (Excel) nối bằng khoảng trắng; dấu phẩy thì giữ lại dấu phẩy.
  const joiner = fieldSep === '\t' ? ' ' : `${fieldSep} `;
  const records = splitRecords(
    text.replace(/\r\n?/g, '\n'),
    fieldSep,
    CARD_SEPARATORS[cardSeparator],
  );

  return records
    .map(({ fields, line }) => {
      const [term = '', ...rest] = fields.map((field) => field.trim());
      const definition = rest.join(joiner).trim();
      return { line, term, definition, error: rowError(term, definition) };
    })
    .filter((row) => row.term || row.definition);
}

function rowError(term: string, definition: string): ImportRowError | null {
  if (!term) return 'missingTerm';
  if (!definition) return 'missingDefinition';
  if (term.length > cardTermMaxLength) return 'termTooLong';
  if (definition.length > cardDefinitionMaxLength) return 'definitionTooLong';
  return null;
}

/**
 * Tách bản ghi / trường, hiểu dấu ngoặc kép kiểu CSV: Excel copy ô có xuống dòng (hoặc có ký tự ngăn cách) thành
 * `"dòng 1\ndòng 2"`, `""` bên trong là 1 dấu `"`. Ngoặc kép chỉ có nghĩa khi đứng đầu trường.
 */
function splitRecords(
  text: string,
  fieldSep: string,
  recordSep: string,
): { fields: string[]; line: number }[] {
  const records: { fields: string[]; line: number }[] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  /** Dòng của ký tự có nghĩa đầu tiên trong bản ghi — không tính khoảng trắng / xuống dòng đứng trước. */
  let recordLine: number | null = null;

  const endField = () => {
    fields.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    records.push({ fields, line: recordLine ?? line });
    fields = [];
    recordLine = null;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (recordLine === null && char.trim() !== '' && char !== recordSep) recordLine = line;
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.trim() === '') {
      inQuotes = true;
      field = '';
    } else if (char === fieldSep) {
      endField();
    } else if (char === recordSep) {
      endRecord();
    } else if (char !== '\n' || recordSep === '\n') {
      field += char;
    } else {
      // Tách thẻ bằng ";" thì xuống dòng giữa các thẻ chỉ để dễ đọc.
      field += ' ';
    }
    if (char === '\n') line++;
  }
  endRecord();
  return records;
}
