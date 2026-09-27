import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { quizUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { QuizSummary } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { FavoriteButtonComponent } from '../../me/favorite-button';
import { QuizMarksStore } from '../../me/quiz-marks.store';
import { ScorePipe } from '../../attempts/score.pipe';

/**
 * Thẻ 1 bộ đề (Home, danh sách bộ đề): tiêu đề, mô tả, số câu, thời gian, dấu của người xem (đang làm dở / điểm
 * cao nhất) — bấm để mở bộ đề. Ngôi sao yêu thích nằm đè góc thẻ (không lồng nút trong link).
 */
@Component({
  selector: 'app-quiz-card',
  standalone: true,
  imports: [ScorePipe, RouterLink, FavoriteButtonComponent, IconComponent, TranslatePipe],
  host: { class: 'block relative' },
  template: `
    @let q = quiz();
    <a
      [routerLink]="url()"
      class="card-surface p-4 h-full flex flex-col gap-2 transition-all hover:border-primary hover:-translate-y-0.5"
    >
      <h3 class="typo-card-title line-clamp-2 break-words pr-8">{{ q.title }}</h3>
      @if (q.description) {
        <p class="typo-muted line-clamp-2 break-words">{{ q.description }}</p>
      }
      <div class="mt-auto pt-2 flex flex-wrap items-center gap-2 typo-caption">
        <span class="quiz-chip quiz-chip--primary">
          <app-icon name="clipboard-check" />
          {{ 'quiz.questionCount' | translate: { n: q.questionCount } }}
        </span>
        <span class="quiz-chip">
          {{
            q.timeLimitMinutes
              ? ('quiz.minutes' | translate: { n: q.timeLimitMinutes })
              : ('quiz.noTimeLimit' | translate)
          }}
        </span>
        @if (progress(); as p) {
          @if (p.inProgressAttemptId) {
            <span class="quiz-chip border-primary/40 text-primary font-semibold">
              {{ 'quiz.mark.inProgress' | translate }}
            </span>
          } @else if (p.bestPercent !== null) {
            <span class="quiz-chip border-success/40 text-success font-semibold">
              <app-icon name="check-circle" />
              {{ 'quiz.mark.best' | translate: { n: p.bestPercent | score } }}
            </span>
          }
        }
      </div>
    </a>
    <app-favorite-button class="absolute right-2 top-2" [quizId]="q.id" />
  `,
})
export class QuizCardComponent {
  private marks = inject(QuizMarksStore);
  quiz = input.required<QuizSummary>();

  progress = computed(() => this.marks.progress(this.quiz().id));

  url(): string {
    return quizUrl(this.quiz().id);
  }
}
