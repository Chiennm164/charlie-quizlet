import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { APP_SETTINGS } from '../config';
import { TranslateService } from './translate.service';

/**
 * Tiêu đề tab trình duyệt: `title` khai báo trong route là key i18n (vd 'auth.loginTitle'),
 * hiển thị "Đăng nhập | Charlie Quizlet" và tự dịch lại khi đổi ngôn ngữ.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  private translate = inject(TranslateService);
  private titleKey = signal<string | undefined>(undefined);

  constructor() {
    super();
    effect(() => {
      const key = this.titleKey();
      this.translate.locale();
      this.translate.ready();
      this.title.setTitle(
        key ? `${this.translate.t(key)} | ${APP_SETTINGS.appName}` : APP_SETTINGS.appName,
      );
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleKey.set(this.buildTitle(snapshot));
  }
}
