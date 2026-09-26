import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_SETTINGS, ROUTES } from '../../config';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { BrandComponent } from '../../../shared/ui/brand/brand';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LanguageSwitcherComponent } from '../../../shared/ui/language-switcher/language-switcher';
import { AuthIllustrationComponent } from './auth-illustration';

/** Màn auth đang hiển thị — quyết định nội dung panel giới thiệu (key i18n authLayout.<page>.*). */
export type AuthPage = 'login' | 'register' | 'forgotPassword' | 'resetPassword';

/** Số ý chính hiển thị trên panel (authLayout.<page>.feature1..N). */
const FEATURE_COUNT = 3;

/**
 * Khung chung cho các trang đăng nhập / đăng ký / quên & đặt lại mật khẩu:
 * header (logo, ngôn ngữ) + panel giới thiệu (màn lớn) + form + footer.
 * Nội dung form truyền qua ng-content; dòng link phía dưới form dùng slot [authFooter].
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    RouterLink,
    AuthIllustrationComponent,
    BrandComponent,
    IconComponent,
    LanguageSwitcherComponent,
    TranslatePipe,
  ],
  templateUrl: './auth-layout.html',
})
export class AuthLayoutComponent {
  page = input.required<AuthPage>();
  title = input.required<string>();
  subtitle = input('');

  readonly routes = ROUTES;
  readonly appName = APP_SETTINGS.appName;
  readonly year = new Date().getFullYear();
  /** Tham số cho câu dịch trên panel, vd "ít nhất {minLength} ký tự". */
  readonly heroParams = { minLength: APP_SETTINGS.validation.passwordMinLength };
  /** Prefix key i18n của panel giới thiệu theo từng màn. */
  heroKey = computed(() => `authLayout.${this.page()}`);
  features = computed(() =>
    Array.from({ length: FEATURE_COUNT }, (_, i) => `${this.heroKey()}.feature${i + 1}`),
  );
}
