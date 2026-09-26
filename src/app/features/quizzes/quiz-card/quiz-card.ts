import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { quizUrl } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { QuizSummary } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon/icon';

/** Thẻ 1 bộ đề (Home, danh sách bộ đề): tiêu đề, mô tả, số câu, thời gian — bấm để mở bộ đề. */
@Component({
  selector: 'app-quiz-card',
  standalone: true,
  imports: [RouterLink, IconComponent, TranslatePipe],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="url()"
      class="card-surface p-4 h-full flex flex-col gap-2 transition-all hover:border-primary hover:-translate-y-0.5"
    >
      <h3 class="typo-card-title line-clamp-2 break-words">{{ quiz().title }}</h3>
      @if (quiz().description) {
        <p class="typo-muted line-clamp-2 break-words">{{ quiz().description }}</p>
      }
      <div class="mt-auto pt-2 flex flex-wrap items-center gap-2 typo-caption">
        <span class="quiz-chip quiz-chip--primary">
          <app-icon name="clipboard-check" />
          {{ 'quiz.questionCount' | translate: { n: quiz().questionCount } }}
        </span>
        <span class="quiz-chip">
          {{
            quiz().timeLimitMinutes
              ? ('quiz.minutes' | translate: { n: quiz().timeLimitMinutes! })
              : ('quiz.noTimeLimit' | translate)
          }}
        </span>
      </div>
    </a>
  `,
})
export class QuizCardComponent {
  quiz = input.required<QuizSummary>();

  url(): string {
    return quizUrl(this.quiz().id);
  }
}
