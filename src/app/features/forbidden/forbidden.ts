import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_AUTHENTICATED_ROUTE } from '../../core/config';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { IconComponent } from '../../shared/ui/icon/icon';

/** Trang 403: đã đăng nhập nhưng không đủ quyền vào trang vừa mở (roleGuard chuyển tới đây). */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, IconComponent, TranslatePipe],
  template: `
    <section
      class="max-w-md mx-auto py-12 flex flex-col items-center text-center gap-3 anim-slide-up-in"
    >
      <span
        class="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center"
        aria-hidden="true"
      >
        <app-icon name="lock" [size]="28" />
      </span>
      <h1 class="typo-page-title">{{ 'forbidden.title' | translate }}</h1>
      <p class="typo-muted">{{ 'forbidden.description' | translate }}</p>
      <a class="btn btn--primary btn--md mt-3" [routerLink]="homeRoute">
        {{ 'forbidden.backHome' | translate }}
      </a>
    </section>
  `,
})
export class ForbiddenComponent {
  readonly homeRoute = DEFAULT_AUTHENTICATED_ROUTE;
}
