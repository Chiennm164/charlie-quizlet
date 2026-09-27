import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('favicon.svg', () => {
  it('là XML hợp lệ (hỏng thì trình duyệt bỏ qua và hiện icon quả địa cầu mặc định)', () => {
    const svg = readFileSync(join(__dirname, '../../../../public/favicon.svg'), 'utf8');
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.documentElement.nodeName).toBe('svg');
  });
});
