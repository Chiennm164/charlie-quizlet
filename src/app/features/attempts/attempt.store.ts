import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, concatMap, finalize, tap } from 'rxjs';
import { APP_SETTINGS } from '../../core/config';
import { Attempt, AttemptQuestion } from '../../core/models';
import { AttemptsService } from './attempts.service';

/**
 * Điểm trên thang APP_SETTINGS.attempt.scoreScale (vd. 100): đúng 25/30 câu -> 83,3. Làm tròn 1 chữ số thập phân.
 * Không có câu nào -> 0.
 */
export function toScore(correct: number, total: number): number {
  const { scoreScale } = APP_SETTINGS.attempt;
  return total ? Math.round((correct / total) * scoreScale * 10) / 10 : 0;
}

export type ScoreLevel = 'great' | 'good' | 'keepTrying';

/** Xếp loại kết quả theo tỉ lệ đúng (ngưỡng trong APP_SETTINGS.attempt) — lời khen, màu huy hiệu điểm. */
export function scoreLevel(percent: number): ScoreLevel {
  const { greatFromPercent, goodFromPercent } = APP_SETTINGS.attempt;
  return percent >= greatFromPercent ? 'great' : percent >= goodFromPercent ? 'good' : 'keepTrying';
}

export type OptionState = 'selected' | 'correct' | 'wrong' | null;

/** Đáp án đúng của câu đã được xem (đã nộp, hoặc luyện tập với câu đã trả lời). */
export const isRevealed = (question: AttemptQuestion) => question.correctOptionId !== null;

/** Cách hiện 1 đáp án: chưa xem đáp án đúng -> chỉ đánh dấu đang chọn; đã xem -> đáp án đúng / chọn sai. */
export function optionState(question: AttemptQuestion, optionId: number): OptionState {
  const selected = question.selectedOptionId === optionId;
  if (!isRevealed(question)) return selected ? 'selected' : null;
  if (optionId === question.correctOptionId) return 'correct';
  return selected ? 'wrong' : null;
}

/** Việc gửi lên BE, chạy lần lượt theo đúng thứ tự người dùng thao tác. */
type SaveTask =
  | { kind: 'answer'; questionId: number; optionId: number | null; flagged: boolean }
  | { kind: 'submit' };

/**
 * State của 1 lượt làm bài (provide ở trang làm bài). Thi thử: cập nhật giao diện ngay rồi mới lưu (BE không trả gì
 * mới). Luyện tập: chờ BE chấm rồi hiện đúng / sai + giải thích. Mọi lần lưu / nộp đi qua 1 hàng đợi (`concatMap`):
 * đổi đáp án liên tục thì BE nhận đúng lựa chọn cuối, nộp bài chỉ chạy sau khi các câu trước đã lưu xong.
 * Lưu lỗi (mất mạng, hết giờ...) -> dừng hàng đợi, tải lại bài từ BE cho khớp (dialog lỗi chung đã báo).
 */
@Injectable()
export class AttemptStore {
  private api = inject(AttemptsService);

  readonly attempt = signal<Attempt | null>(null);
  readonly index = signal(0);
  /** Số việc (lưu câu / nộp) chưa xong — còn > 0 thì rời trang sẽ mất thao tác. */
  readonly pending = signal(0);
  /** Luyện tập: câu đang chờ BE chấm. */
  readonly checkingId = signal<number | null>(null);
  readonly submitting = signal(false);
  /** Giờ server − giờ máy (ms): đếm ngược theo giờ server dù đồng hồ máy lệch. */
  private clockOffset = signal(0);
  /** Đang tải lại sau lỗi: bỏ các việc còn trong hàng đợi (chúng dựa trên state cũ). */
  private halted = false;

  readonly questions = computed(() => this.attempt()?.questions ?? []);
  readonly current = computed<AttemptQuestion | null>(() => this.questions()[this.index()] ?? null);
  readonly isPractice = computed(() => this.attempt()?.mode === 'PRACTICE');
  readonly isSubmitted = computed(() => this.attempt()?.status === 'SUBMITTED');
  readonly answeredCount = computed(
    () => this.questions().filter((q) => q.selectedOptionId !== null).length,
  );
  readonly flaggedCount = computed(() => this.questions().filter((q) => q.flagged).length);
  /** Luyện tập: số câu đúng đến giờ. */
  readonly correctSoFar = computed(() => this.questions().filter((q) => q.correct).length);
  /** Hết giờ lúc nào theo đồng hồ máy (epoch ms); null = không giới hạn. */
  readonly deadlineMs = computed(() => {
    const deadline = this.attempt()?.deadline;
    return deadline ? Date.parse(deadline) - this.clockOffset() : null;
  });

  private tasks = new Subject<SaveTask>();

  constructor() {
    this.tasks
      .pipe(
        concatMap((task) =>
          (this.halted ? EMPTY : this.run(task)).pipe(finalize(() => this.done(task))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  load(attempt: Attempt): void {
    this.clockOffset.set(Date.parse(attempt.serverTime) - Date.now());
    this.attempt.set(attempt);
    // Làm tiếp: mở câu đầu tiên chưa trả lời.
    const firstOpen = attempt.questions.findIndex((q) => q.selectedOptionId === null);
    this.index.set(attempt.status === 'IN_PROGRESS' && firstOpen > 0 ? firstOpen : 0);
  }

  go(index: number): void {
    const last = this.questions().length - 1;
    this.index.set(Math.min(Math.max(index, 0), last));
  }

  /** Thi thử: bấm lại đáp án đang chọn là bỏ chọn. Luyện tập: mỗi câu chọn 1 lần. */
  select(optionId: number): void {
    const question = this.current();
    if (!question || this.isSubmitted()) return;
    if (this.isPractice()) {
      if (question.selectedOptionId !== null || this.checkingId() !== null) return;
      this.checkingId.set(question.questionId);
      this.enqueue({ kind: 'answer', questionId: question.questionId, optionId, flagged: false });
      return;
    }
    const next = question.selectedOptionId === optionId ? null : optionId;
    this.patch(question.questionId, { selectedOptionId: next });
    this.enqueue({
      kind: 'answer',
      questionId: question.questionId,
      optionId: next,
      flagged: question.flagged,
    });
  }

  toggleFlag(): void {
    const question = this.current();
    if (!question || this.isSubmitted() || this.isPractice()) return;
    this.patch(question.questionId, { flagged: !question.flagged });
    this.enqueue({
      kind: 'answer',
      questionId: question.questionId,
      optionId: question.selectedOptionId,
      flagged: !question.flagged,
    });
  }

  /** Nộp sau khi các câu đang lưu đã xong. */
  submit(): void {
    if (this.submitting() || this.isSubmitted()) return;
    this.submitting.set(true);
    this.enqueue({ kind: 'submit' });
  }

  private enqueue(task: SaveTask): void {
    this.pending.update((n) => n + 1);
    this.tasks.next(task);
  }

  private run(task: SaveTask): Observable<unknown> {
    const id = this.attempt()!.id;
    const request$: Observable<unknown> =
      task.kind === 'submit'
        ? this.api.submit(id).pipe(tap((result) => this.load(result)))
        : this.api
            .answer(id, task.questionId, { optionId: task.optionId, flagged: task.flagged })
            // Thi thử giữ state trên máy (có thể đã đổi tiếp khi request này đang chạy); luyện tập lấy kết quả chấm.
            .pipe(tap((saved) => this.isPractice() && this.patch(saved.questionId, saved)));
    return request$.pipe(
      catchError(() => {
        this.resync(id);
        return EMPTY;
      }),
    );
  }

  private done(task: SaveTask): void {
    this.pending.update((n) => n - 1);
    if (task.kind === 'submit') this.submitting.set(false);
    else if (task.questionId === this.checkingId()) this.checkingId.set(null);
  }

  /** Sau lỗi: lấy lại bài từ BE (hết giờ thì BE đã tự nộp -> thành trang kết quả). Giữ câu đang xem. */
  private resync(id: number): void {
    this.halted = true;
    const index = this.index();
    this.api
      .get(id)
      .pipe(finalize(() => (this.halted = false)))
      .subscribe((attempt) => {
        this.load(attempt);
        if (attempt.status === 'IN_PROGRESS') this.go(index);
      });
  }

  private patch(questionId: number, changes: Partial<AttemptQuestion>): void {
    this.attempt.update(
      (attempt) =>
        attempt && {
          ...attempt,
          questions: attempt.questions.map((q) =>
            q.questionId === questionId ? { ...q, ...changes } : q,
          ),
        },
    );
  }
}
