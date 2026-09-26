import { Card } from '../../../core/models';
import { FlashcardSession } from './flashcard-session';

const cards: Card[] = ['cat', 'dog', 'bird'].map((term, i) => ({
  id: i + 1,
  term,
  definition: `def ${term}`,
}));
const terms = (session: FlashcardSession) => session.deck().map((c) => c.term);

describe('FlashcardSession', () => {
  it('bắt đầu ở thẻ đầu, mặt trước; lật / chuyển thẻ thì về mặt trước', () => {
    const session = new FlashcardSession();
    session.start(cards, { shuffle: false });
    expect(session.current()?.term).toBe('cat');
    expect(session.flipped()).toBe(false);

    session.flip();
    expect(session.flipped()).toBe(true);
    session.next();
    expect(session.current()?.term).toBe('dog');
    expect(session.flipped()).toBe(false);

    session.prev();
    session.prev(); // đã ở thẻ đầu: không lùi nữa
    expect(session.index()).toBe(0);
  });

  it('đánh dấu hết -> hết vòng; vòng sau chỉ còn thẻ chưa nhớ', () => {
    const session = new FlashcardSession();
    session.start(cards, { shuffle: false });

    session.mark(true); // cat
    session.mark(false); // dog
    expect(session.phase()).toBe('studying');
    session.mark(true); // bird
    expect(session.phase()).toBe('roundEnd');
    expect(session.knownCount()).toBe(2);
    expect(session.unknownCount()).toBe(1);

    session.continueWithUnknown();
    expect(session.round()).toBe(2);
    expect(terms(session)).toEqual(['dog']);
    expect(session.progress()).toBe(0);

    session.mark(true);
    expect(session.phase()).toBe('done');
  });

  it('đánh dấu xong nhảy tới thẻ chưa đánh dấu kế tiếp (quay vòng về đầu)', () => {
    const session = new FlashcardSession();
    session.start(cards, { shuffle: false });
    session.next();
    session.next(); // bird
    session.mark(false);
    expect(session.current()?.term).toBe('cat');
    session.mark(true);
    expect(session.current()?.term).toBe('dog');
  });

  it('trộn thẻ theo nguồn ngẫu nhiên; đổi tuỳ chọn trộn thì học lại từ vòng 1', () => {
    const session = new FlashcardSession(() => 0);
    session.start(cards, { shuffle: true });
    // random() = 0 luôn đổi phần tử i với phần tử 0 (Fisher–Yates).
    expect(terms(session)).toEqual(['dog', 'bird', 'cat']);

    session.mark(false);
    session.setShuffle(false);
    expect(terms(session)).toEqual(['cat', 'dog', 'bird']);
    expect(session.unknownCount()).toBe(0);
    expect(session.round()).toBe(1);
  });

  it('restart học lại toàn bộ thẻ', () => {
    const session = new FlashcardSession();
    session.start(cards, { shuffle: false });
    cards.forEach(() => session.mark(false));
    session.continueWithUnknown();
    session.restart();
    expect(session.round()).toBe(1);
    expect(session.total()).toBe(3);
    expect(session.phase()).toBe('studying');
  });

  it('không có thẻ -> xong luôn, thao tác không lỗi', () => {
    const session = new FlashcardSession();
    session.start([], { shuffle: false });
    expect(session.phase()).toBe('done');
    session.mark(true);
    session.flip();
    expect(session.flipped()).toBe(false);
  });
});
