import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { QuizMarks, QuizProgress } from '../../core/models';
import { MeService } from './me.service';

/**
 * Dấu của người đăng nhập trên các bộ đề (điểm cao nhất, lượt dở, yêu thích) — dùng chung cho mọi thẻ đề.
 * Trang hiện thẻ đề gọi `refresh()` khi mở để số liệu mới sau mỗi lần làm bài. Đổi tài khoản thì xoá dấu cũ.
 */
@Injectable({ providedIn: 'root' })
export class QuizMarksStore {
  private me = inject(MeService);

  private marks = signal<QuizMarks | null>(null);

  private progressByQuiz = computed(
    () => new Map((this.marks()?.progress ?? []).map((p) => [p.quizId, p])),
  );
  private favorites = computed(() => new Set(this.marks()?.favoriteQuizIds ?? []));

  constructor() {
    const auth = inject(AuthService);
    const userId = computed(() => auth.currentUser()?.id);
    effect(() => {
      userId();
      untracked(() => this.marks.set(null));
    });
  }

  /** Lỗi đã hiện ở dialog chung; giữ dấu cũ. */
  refresh(): void {
    this.me.quizMarks().subscribe((marks) => this.marks.set(marks));
  }

  progress(quizId: number): QuizProgress | null {
    return this.progressByQuiz().get(quizId) ?? null;
  }

  isFavorite(quizId: number): boolean {
    return this.favorites().has(quizId);
  }

  /** Đổi ngay trên giao diện; BE lỗi thì trả lại như cũ. */
  toggleFavorite(quizId: number): void {
    const favorite = !this.isFavorite(quizId);
    this.setFavoriteLocally(quizId, favorite);
    this.me.setFavorite(quizId, favorite).subscribe({
      error: () => this.setFavoriteLocally(quizId, !favorite),
    });
  }

  private setFavoriteLocally(quizId: number, favorite: boolean): void {
    this.marks.update((marks) => {
      const current = marks ?? { progress: [], favoriteQuizIds: [] };
      const ids = current.favoriteQuizIds.filter((id) => id !== quizId);
      return { ...current, favoriteQuizIds: favorite ? [...ids, quizId] : ids };
    });
  }
}
