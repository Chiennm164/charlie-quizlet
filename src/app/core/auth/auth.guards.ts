import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEFAULT_AUTHENTICATED_ROUTE, RETURN_URL_PARAM, ROUTES } from '../config';
import { Role } from '../models';
import { AuthService } from './auth.service';

/** Chỉ cho vào khi đã đăng nhập; chưa đăng nhập thì về /login, kèm returnUrl để quay lại sau. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree([ROUTES.login], {
    queryParams: { [RETURN_URL_PARAM]: state.url },
  });
};

/** Dùng cho trang login/register/quên mật khẩu: đã đăng nhập rồi thì chuyển thẳng vào trang mặc định (/home). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated()
    ? inject(Router).createUrlTree([DEFAULT_AUTHENTICATED_ROUTE])
    : true;
};

/**
 * Chỉ cho vào khi user có 1 trong các role; không đủ quyền thì về trang 403. Dùng cho route con của
 * MainLayout (authGuard ở route cha chạy trước, tới đây user đã đăng nhập):
 *
 *   { path: ..., canActivate: [roleGuard('ADMIN')], loadComponent: ... }
 */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () =>
    inject(AuthService).hasRole(...roles) || inject(Router).createUrlTree([ROUTES.forbidden]);
