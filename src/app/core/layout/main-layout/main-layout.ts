import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslateService } from '../../i18n/translate.service';
import { BrandComponent } from '../../../shared/ui/brand/brand';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LanguageSwitcherComponent } from '../../../shared/ui/language-switcher/language-switcher';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AccountDialogComponent } from './account-dialog/account-dialog';
import { getInitials } from '../../../shared/utils/common.utils';
import { APP_SETTINGS, DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from '../../config';

/** Khung chung cho các trang sau khi đăng nhập: header (logo, ngôn ngữ, user → dialog tài khoản, đăng xuất) + nội dung. */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterLink,
    BrandComponent,
    RouterOutlet,
    IconComponent,
    LanguageSwitcherComponent,
    AccountDialogComponent,
    TranslatePipe,
  ],
  templateUrl: './main-layout.html',
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  readonly homeRoute = DEFAULT_AUTHENTICATED_ROUTE;
  accountOpen = signal(false);
  readonly appName = APP_SETTINGS.appName;

  initials = computed(() => getInitials(this.auth.currentUser()?.fullName));

  logout(): void {
    this.auth.logout();
    this.toast.show(this.translate.t('home.logoutSuccess'));
    this.router.navigateByUrl(ROUTES.login);
  }
}
