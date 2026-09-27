import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { quizUrl } from '../../../core/config';
import { ConfirmDialogService } from '../../../core/confirm/confirm-dialog.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AttemptQuestion } from '../../../core/models';
import { ShortcutDirective } from '../../../shared/directives/shortcut.directive';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CountdownComponent } from '../../../shared/ui/countdown/countdown';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AttemptStore, isRevealed, optionState } from '../attempt.store';
import { OPTION_LETTERS, percent } from '../../../shared/utils/common.utils';

/**
 * Màn làm bài: 1 câu / lần, bảng số câu để nhảy nhanh, đánh dấu câu (thi thử), đếm ngược (thi thử có giờ — hết giờ
 * tự nộp). Phím tắt: A–F chọn đáp án, ← / → đổi câu, M đánh dấu.
 */
@Component({
  selector: 'app-attempt-player',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    CountdownComponent,
    IconComponent,
    ShortcutDirective,
    TranslatePipe,
  ],
  templateUrl: './attempt-player.html',
})
export class AttemptPlayerComponent {
  store = inject(AttemptStore);
  private confirmDialog = inject(ConfirmDialogService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  readonly letters = OPTION_LETTERS;
  readonly quizUrl = quizUrl;

  isLast = computed(() => this.store.index() === this.store.questions().length - 1);
  progress = computed(
    () => percent(this.store.answeredCount(), this.store.questions().length) ?? 0,
  );
  /** Luyện tập: "Kết thúc"; thi thử: "Nộp bài". */
  submitKey = computed(() => (this.store.isPractice() ? 'attempt.finish' : 'attempt.submit'));

  readonly isRevealed = isRevealed;
  readonly optionState = optionState;

  navState(question: AttemptQuestion): string {
    if (question.correct === true) return 'is-correct';
    if (question.correct === false) return 'is-wrong';
    return question.selectedOptionId !== null ? 'is-answered' : '';
  }

  next(): void {
    this.store.go(this.store.index() + 1);
  }

  prev(): void {
    this.store.go(this.store.index() - 1);
  }

  async confirmSubmit(): Promise<void> {
    const total = this.store.questions().length;
    const answered = this.store.answeredCount();
    const flagged = this.store.flaggedCount();
    const lines = [this.translate.t('attempt.submitAnswered', { n: answered, total })];
    if (answered < total) {
      lines.push(this.translate.t('attempt.submitUnanswered', { n: total - answered }));
    }
    if (flagged) lines.push(this.translate.t('attempt.submitFlagged', { n: flagged }));
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.t(
        this.store.isPractice() ? 'attempt.finishTitle' : 'attempt.submitTitle',
      ),
      message: lines.join(' '),
      confirmText: this.translate.t(this.submitKey()),
      cancelText: this.translate.t('attempt.keepGoing'),
    });
    if (confirmed) this.store.submit();
  }

  /** Đồng hồ về 0: nộp luôn (BE vẫn nhận trong thời gian ân hạn), không hỏi. */
  onTimeUp(): void {
    this.toast.show(this.translate.t('attempt.timeUp'));
    this.store.submit();
  }
}
