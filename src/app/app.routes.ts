import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';
import { ROUTE_SEGMENTS } from './core/config';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

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
      {
        path: ROUTE_SEGMENTS.quizzes,
        title: 'quiz.browseTitle',
        loadComponent: () =>
          import('./features/quizzes/quiz-browse/quiz-browse').then((m) => m.QuizBrowseComponent),
      },
      {
        path: `${ROUTE_SEGMENTS.quizzes}/:id`,
        title: 'quiz.pageTitle',
        loadComponent: () =>
          import('./features/quizzes/quiz-detail/quiz-detail').then((m) => m.QuizDetailComponent),
      },
      // ---- Admin ----
      {
        path: ROUTE_SEGMENTS.adminQuizzes,
        title: 'adminQuiz.listTitle',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/quiz-list/quiz-list').then((m) => m.AdminQuizListComponent),
      },
      {
        path: ROUTE_SEGMENTS.adminQuizNew,
        title: 'adminQuiz.createTitle',
        canActivate: [roleGuard('ADMIN')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/admin/quiz-editor/quiz-editor').then((m) => m.QuizEditorComponent),
      },
      {
        path: `${ROUTE_SEGMENTS.adminQuizzes}/:id/edit`,
        title: 'adminQuiz.editTitle',
        canActivate: [roleGuard('ADMIN')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/admin/quiz-editor/quiz-editor').then((m) => m.QuizEditorComponent),
      },
      {
        path: ROUTE_SEGMENTS.adminTopics,
        title: 'adminTopic.title',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/topics/topics').then((m) => m.AdminTopicsComponent),
      },
      // Trang cho 1 số role: thêm canActivate: [roleGuard('ADMIN')] — không đủ quyền về trang 403.
      {
        path: ROUTE_SEGMENTS.forbidden,
        title: 'forbidden.pageTitle',
        loadComponent: () =>
          import('./features/forbidden/forbidden').then((m) => m.ForbiddenComponent),
      },
      // URL không khớp route nào (đặt cuối cùng). Chưa đăng nhập thì authGuard của layout đưa về /login trước.
      {
        path: '**',
        title: 'notFound.pageTitle',
        loadComponent: () =>
          import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
