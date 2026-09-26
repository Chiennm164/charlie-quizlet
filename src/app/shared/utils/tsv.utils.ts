/** 1 dòng dữ liệu dán từ bảng tính. `line`: số dòng (bắt đầu từ 1) trong văn bản gốc, để báo lỗi đúng dòng. */
export interface TsvRow {
  fields: string[];
  line: number;
}

/**
 * Tách văn bản copy từ Excel / Google Sheets (cột cách nhau bằng Tab, dòng bằng xuống dòng). Hiểu ngoặc kép kiểu
 * CSV: ô có xuống dòng / Tab được bảng tính bọc thành `"dòng 1\ndòng 2"`, `""` bên trong là 1 dấu `"`; ngoặc kép
 * chỉ có nghĩa khi đứng đầu ô. Bỏ dòng trống. Không trim nội dung ô (nơi dùng tự trim).
 */
export function parseTsv(text: string): TsvRow[] {
  const source = text.replace(/\r\n?/g, '\n');
  const rows: TsvRow[] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  /** Dòng của ký tự có nghĩa đầu tiên trong bản ghi (không tính dòng trống đứng trước). */
  let rowLine: number | null = null;

  const endField = () => {
    fields.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    if (fields.some((value) => value.trim() !== '')) rows.push({ fields, line: rowLine ?? line });
    fields = [];
    rowLine = null;
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (rowLine === null && char.trim() !== '') rowLine = line;
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
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
    } else if (char === '\t') {
      endField();
    } else if (char === '\n') {
      endRow();
    } else {
      field += char;
    }
    if (char === '\n') line++;
  }
  endRow();
  return rows;
}
