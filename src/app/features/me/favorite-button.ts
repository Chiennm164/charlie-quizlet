import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { IconComponent } from '../../shared/ui/icon/icon';
import { QuizMarksStore } from './quiz-marks.store';

/** Nút ngôi sao yêu thích 1 bộ đề (thẻ đề, trang bộ đề). Trạng thái lấy từ QuizMarksStore. */
@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-bg-muted"
      [class.text-warning]="favorite()"
      [class.text-text-muted]="!favorite()"
      [attr.aria-pressed]="favorite()"
      [attr.aria-label]="(favorite() ? 'quiz.unfavorite' : 'quiz.favorite') | translate"
      [attr.title]="(favorite() ? 'quiz.unfavorite' : 'quiz.favorite') | translate"
      (click)="marks.toggleFavorite(quizId())"
    >
      <app-icon [name]="favorite() ? 'star-filled' : 'star'" [size]="20" />
    </button>
  `,
})
export class FavoriteButtonComponent {
  marks = inject(QuizMarksStore);
  quizId = input.required<number>();

  favorite = computed(() => this.marks.isFavorite(this.quizId()));
}
