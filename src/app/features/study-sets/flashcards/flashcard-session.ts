import { computed, signal } from '@angular/core';
import { Card } from '../../../core/models';

/** studying: đang học · roundEnd: hết vòng, còn thẻ chưa nhớ · done: đã nhớ hết. */
export type FlashcardPhase = 'studying' | 'roundEnd' | 'done';

export interface FlashcardOptions {
  shuffle: boolean;
}

/**
 * Trạng thái 1 phiên học thẻ ghi nhớ, toàn bộ bằng signal (không phụ thuộc Angular DI nên test như class thường).
 *
 * Mỗi vòng: người học đánh dấu từng thẻ "đã nhớ" / "chưa nhớ". Đánh dấu xong mọi thẻ thì hết vòng; vòng sau chỉ
 * còn các thẻ chưa nhớ, tới khi nhớ hết. Chuyển thẻ bằng ←/→ không tính là đánh dấu.
 */
export class FlashcardSession {
  private allCards: Card[] = [];
  private options: FlashcardOptions = { shuffle: false };

  /** Thẻ của vòng hiện tại, theo thứ tự học. */
  readonly deck = signal<Card[]>([]);
  readonly index = signal(0);
  readonly flipped = signal(false);
  readonly round = signal(1);
  readonly phase = signal<FlashcardPhase>('studying');
  /** id thẻ -> đã nhớ? (chỉ trong vòng hiện tại). */
  private readonly marks = signal<ReadonlyMap<number, boolean>>(new Map());

  readonly current = computed<Card | null>(() => this.deck()[this.index()] ?? null);
  readonly total = computed(() => this.deck().length);
  readonly knownCount = computed(() => [...this.marks().values()].filter(Boolean).length);
  readonly unknownCount = computed(() => this.marks().size - this.knownCount());
  /** Tỉ lệ thẻ đã đánh dấu trong vòng (0–1), cho thanh tiến độ. */
  readonly progress = computed(() => (this.total() ? this.marks().size / this.total() : 0));
  readonly currentMark = computed(() => {
    const card = this.current();
    return card ? this.marks().get(card.id) : undefined;
  });
  readonly isFirst = computed(() => this.index() === 0);
  readonly isLast = computed(() => this.index() >= this.total() - 1);

  /** @param random nguồn ngẫu nhiên cho trộn thẻ — truyền vào để test cố định được thứ tự. */
  constructor(private readonly random: () => number = Math.random) {}

  start(cards: Card[], options: FlashcardOptions): void {
    this.allCards = cards;
    this.options = options;
    this.round.set(1);
    this.beginRound(cards);
  }

  /** Học lại toàn bộ thẻ từ vòng 1 (giữ tuỳ chọn trộn). */
  restart(): void {
    this.start(this.allCards, this.options);
  }

  /** Đổi tuỳ chọn trộn thẻ -> bắt đầu lại để thứ tự mới có hiệu lực. */
  setShuffle(shuffle: boolean): void {
    this.start(this.allCards, { ...this.options, shuffle });
  }

  flip(): void {
    if (this.phase() === 'studying') this.flipped.update((flipped) => !flipped);
  }

  next(): void {
    if (!this.isLast()) this.goTo(this.index() + 1);
  }

  prev(): void {
    if (!this.isFirst()) this.goTo(this.index() - 1);
  }

  /** Đánh dấu thẻ đang xem rồi sang thẻ chưa đánh dấu kế tiếp; đánh dấu hết thì kết thúc vòng. */
  mark(known: boolean): void {
    const card = this.current();
    if (!card || this.phase() !== 'studying') return;

    const marks = new Map(this.marks()).set(card.id, known);
    this.marks.set(marks);

    const deck = this.deck();
    const nextIndex = [...deck.keys()]
      .map((offset) => (this.index() + 1 + offset) % deck.length)
      .find((i) => !marks.has(deck[i].id));

    if (nextIndex === undefined) {
      this.phase.set(this.unknownCount() === 0 ? 'done' : 'roundEnd');
    } else {
      this.goTo(nextIndex);
    }
  }

  /** Vòng mới chỉ gồm thẻ chưa nhớ của vòng vừa xong. */
  continueWithUnknown(): void {
    const marks = this.marks();
    const unknown = this.deck().filter((card) => marks.get(card.id) === false);
    if (!unknown.length) return;
    this.round.update((round) => round + 1);
    this.beginRound(unknown);
  }

  private beginRound(cards: Card[]): void {
    this.deck.set(this.options.shuffle ? this.shuffled(cards) : [...cards]);
    this.marks.set(new Map());
    this.phase.set(cards.length ? 'studying' : 'done');
    this.goTo(0);
  }

  private goTo(index: number): void {
    this.index.set(index);
    this.flipped.set(false);
  }

  /** Fisher–Yates. */
  private shuffled(cards: Card[]): Card[] {
    const result = [...cards];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
