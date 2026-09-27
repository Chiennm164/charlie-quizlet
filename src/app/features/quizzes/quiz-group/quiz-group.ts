import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTES } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TopicQuizzes } from '../../../core/models';
import { QuizCardComponent } from '../quiz-card/quiz-card';

/**
 * 1 khối chủ đề: tên + số đề, lưới thẻ bộ đề, "Xem tất cả" khi chủ đề còn đề chưa hiện (mở trang Bộ đề lọc sẵn
 * chủ đề). Dùng ở Home và trang Bộ đề (xem theo nhóm).
 */
@Component({
  selector: 'app-quiz-group',
  standalone: true,
  imports: [RouterLink, QuizCardComponent, TranslatePipe],
  template: `
    @let g = group();
    <section [attr.aria-labelledby]="'topic-' + g.topic.id">
      <div class="flex items-baseline justify-between gap-3 mb-3">
        <h2 class="typo-section-title" [id]="'topic-' + g.topic.id">
          {{ g.topic.name }}
          <span class="typo-caption">({{ g.totalQuizzes }})</span>
        </h2>
        @if (g.totalQuizzes > g.quizzes.length) {
          <a
            class="link text-body-sm shrink-0"
            [routerLink]="browseUrl"
            [queryParams]="{ topicId: g.topic.id, page: null }"
            [queryParamsHandling]="keepFilters() ? 'merge' : ''"
          >
            {{ 'home.seeAll' | translate: { n: g.totalQuizzes } }}
          </a>
        }
      </div>
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        @for (quiz of g.quizzes; track quiz.id) {
          <li><app-quiz-card class="h-full" [quiz]="quiz" /></li>
        }
      </ul>
    </section>
  `,
})
export class QuizGroupComponent {
  group = input.required<TopicQuizzes>();
  /** Trang Bộ đề: "Xem tất cả" giữ từ khoá / cách sắp xếp đang chọn. */
  keepFilters = input(false);

  readonly browseUrl = ROUTES.quizzes;
}
