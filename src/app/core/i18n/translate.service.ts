import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_SETTINGS, Locale, STORAGE_KEYS, SUPPORTED_LOCALES } from '../config';

export type { Locale } from '../config';

const STORAGE_KEY = STORAGE_KEYS.locale;

type Translations = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private http = inject(HttpClient);

  private translations = signal<Translations>({});
  locale = signal<Locale>(this.readStoredLocale());
  ready = signal(false);

  supportedLocales = computed<readonly Locale[]>(() => SUPPORTED_LOCALES);

  async init(): Promise<void> {
    await this.loadLocale(this.locale());
    // Người dùng đã chọn EN từ lần trước -> <html lang> phải là "en" ngay khi mở app.
    document.documentElement.lang = APP_SETTINGS.i18n.htmlLang[this.locale()];
  }

  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.locale() && this.ready()) return;
    await this.loadLocale(locale);
    this.locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = APP_SETTINGS.i18n.htmlLang[locale];
  }

  /**
   * Lấy chuỗi dịch theo key dạng "common.save"; trả về key gốc nếu thiếu bản dịch.
   * `params` thay các placeholder `{ten}` trong chuỗi: t('auth.loginSuccess', { name: 'An' }).
   */
  t(key: string, params?: Record<string, string | number>): string {
    const value = key
      .split('.')
      .reduce<unknown>((acc, part) => (acc as Translations)?.[part], this.translations());
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  }

  private async loadLocale(locale: Locale): Promise<void> {
    this.ready.set(false);
    const data = await firstValueFrom(
      this.http.get<Translations>(`${APP_SETTINGS.i18n.translationsPath}/${locale}.json`),
    );
    this.translations.set(data);
    this.ready.set(true);
  }

  private readStoredLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return stored && SUPPORTED_LOCALES.includes(stored) ? stored : APP_SETTINGS.i18n.defaultLocale;
  }
}
