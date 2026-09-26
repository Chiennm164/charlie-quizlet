import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_SETTINGS, ROUTES } from '../../core/config';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslateService } from '../../core/i18n/translate.service';
import { Role } from '../../core/models';
import { IconComponent } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-registry';
import { formatDate } from '../../shared/utils/common.utils';

interface QuickAction {
  icon: IconName;
  titleKey: string;
  descriptionKey: string;
  /** Không khai báo = mọi role đều thấy. */
  roles?: Role[];
  /** Chưa có trang thì bỏ trống — thẻ hiện nhãn "Sắp ra mắt". */
  route?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'check-circle',
    titleKey: 'home.actionApproveUsers',
    descriptionKey: 'home.actionApproveUsersDesc',
    roles: ['ADMIN'],
    route: ROUTES.adminPendingUsers,
  },
  { icon: 'plus', titleKey: 'home.actionCreateSet', descriptionKey: 'home.actionCreateSetDesc' },
  { icon: 'book-open', titleKey: 'home.actionMySets', descriptionKey: 'home.actionMySetsDesc' },
  {
    icon: 'layers',
    titleKey: 'home.actionFlashcards',
    descriptionKey: 'home.actionFlashcardsDesc',
  },
  { icon: 'clipboard-check', titleKey: 'home.actionQuiz', descriptionKey: 'home.actionQuizDesc' },
  {
    icon: 'users',
    titleKey: 'home.actionClasses',
    descriptionKey: 'home.actionClassesDesc',
    roles: ['TEACHER', 'ADMIN'],
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, IconComponent, TranslatePipe],
  templateUrl: './home.html',
})
export class HomeComponent {
  auth = inject(AuthService);
  private translate = inject(TranslateService);

  actions = computed(() => QUICK_ACTIONS.filter((a) => !a.roles || this.auth.hasRole(...a.roles)));

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

  memberSince = computed(() =>
    formatDate(
      this.auth.currentUser()?.createdAt,
      APP_SETTINGS.i18n.formatLocale[this.translate.locale()],
    ),
  );
}
