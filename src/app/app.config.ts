import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  TitleStrategy,
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { ScrollRestoreService } from './core/navigation/scroll-restore.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { localeInterceptor } from './core/interceptors/locale.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { TranslateService } from './core/i18n/translate.service';
import { TranslatedTitleStrategy } from './core/i18n/translated-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hiệu ứng chuyển trang bằng View Transitions API (style ở src/styles/animations.css).
    provideRouter(
      routes,
      withViewTransitions({ skipInitialTransition: true }),
      // Mở trang mới -> cuộn lên đầu; Back / Forward -> về đúng chỗ đang xem trước đó.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideHttpClient(
      withInterceptors([localeInterceptor, authInterceptor, errorInterceptor, loadingInterceptor]),
    ),
    provideAppInitializer(() => inject(TranslateService).init()),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    // Tạo sớm để nghe được sự kiện Scroll ngay từ lần chuyển trang đầu.
    provideAppInitializer(() => void inject(ScrollRestoreService)),
  ],
};
