import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { APP_SETTINGS, ROUTES } from '../../core/config';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslateService } from '../../core/i18n/translate.service';
import { TopicQuizzes } from '../../core/models';
import { IconComponent } from '../../shared/ui/icon/icon';
import { LoadingComponent } from '../../shared/ui/loading/loading';
import { MascotComponent } from '../../shared/ui/mascot/mascot';
import { MyActivityComponent } from '../me/my-activity/my-activity';
import { QuizMarksStore } from '../me/quiz-marks.store';
import { QuizGroupComponent } from '../quizzes/quiz-group/quiz-group';
import { QuizzesService } from '../quizzes/quizzes.service';

/** Home: lời chào + bộ đề đã xuất bản (= đã duyệt) nhóm theo chủ đề. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    LoadingComponent,
    MascotComponent,
    MyActivityComponent,
    QuizGroupComponent,
    TranslatePipe,
  ],
  templateUrl: './home.html',
})
export class HomeComponent {
  auth = inject(AuthService);
  private translate = inject(TranslateService);

  readonly newQuizUrl = ROUTES.adminQuizNew;
  readonly adminTopicsUrl = ROUTES.adminTopics;

  /** null = đang tải. Lỗi đã hiện ở dialog chung -> coi như chưa có đề. */
  topics = toSignal<TopicQuizzes[] | null>(
    inject(QuizzesService)
      .listByTopic(APP_SETTINGS.quizzes.perTopic)
      .pipe(catchError(() => of([]))),
    { initialValue: null },
  );

  constructor() {
    // Dấu trên thẻ đề (điểm cao nhất, đang làm dở, yêu thích) mới nhất mỗi lần mở trang.
    inject(QuizMarksStore).refresh();
  }

  greeting = computed(() => {
    this.translate.ready();
    const hour = new Date().getHours();
    const { afternoonFromHour, eveningFromHour } = APP_SETTINGS.home;
    const key =
      hour < afternoonFromHour
        ? 'home.goodMorning'
        : hour < eveningFromHour
          ? 'home.goodAfternoon'
          : 'home.goodEvening';
    return this.translate.t(key, { name: this.auth.currentUser()?.fullName ?? '' });
  });
}
