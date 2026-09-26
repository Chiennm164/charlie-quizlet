import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { ROUTE_SEGMENTS } from './core/config';

export const routes: Routes = [
  // ---- Trang cho khách (đã đăng nhập thì tự chuyển vào /home) ----
  {
    path: ROUTE_SEGMENTS.login,
    title: 'auth.loginTitle',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: ROUTE_SEGMENTS.register,
    title: 'auth.registerTitle',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: ROUTE_SEGMENTS.forgotPassword,
    title: 'auth.forgotPasswordTitle',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: ROUTE_SEGMENTS.resetPassword,
    title: 'auth.resetPasswordTitle',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  // Dev only: bỏ comment khi cần xem/sửa UI kit
  // {
  //   path: 'ui-showcase',
  //   loadComponent: () =>
  //     import('./features/ui-showcase/ui-showcase').then((m) => m.UiShowcaseComponent),
  // },

  // ---- Trang cần đăng nhập, dùng chung header của MainLayout ----
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: ROUTE_SEGMENTS.home, pathMatch: 'full' },
      {
        path: ROUTE_SEGMENTS.home,
        title: 'home.pageTitle',
        loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
      },
    ],
  },
  { path: '**', redirectTo: ROUTE_SEGMENTS.home },
];
