import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { APP_SETTINGS } from '../config';
import { TranslateService } from '../i18n/translate.service';

/** Gửi ngôn ngữ đang chọn qua header Accept-Language để BE trả thông báo lỗi đúng ngôn ngữ. */
export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const lang = APP_SETTINGS.i18n.htmlLang[inject(TranslateService).locale()];
  return next(req.clone({ setHeaders: { 'Accept-Language': lang } }));
};
