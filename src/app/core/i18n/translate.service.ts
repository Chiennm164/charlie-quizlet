import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Locale = 'vn' | 'en';

const STORAGE_KEY = 'cq_locale';
const DEFAULT_LOCALE: Locale = 'vn';
const SUPPORTED_LOCALES: Locale[] = ['vn', 'en'];

type Translations = Record<string, unknown>;

/** locale key dùng nội bộ (khớp tên file public/i18n/*.json) -> mã ngôn ngữ chuẩn BCP-47 cho thẻ <html lang> */
const HTML_LANG_MAP: Record<Locale, string> = {
  vn: 'vi',
  en: 'en',
};

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private http = inject(HttpClient);

  private translations = signal<Translations>({});
  locale = signal<Locale>(this.readStoredLocale());
  ready = signal(false);

  supportedLocales = computed(() => SUPPORTED_LOCALES);

  async init(): Promise<void> {
    await this.loadLocale(this.locale());
  }

  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.locale() && this.ready()) return;
    await this.loadLocale(locale);
    this.locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = HTML_LANG_MAP[locale];
  }

  /** Lấy chuỗi dịch theo key dạng "common.save"; trả về key gốc nếu thiếu bản dịch. */
  t(key: string): string {
    const value = key
      .split('.')
      .reduce<unknown>((acc, part) => (acc as Translations)?.[part], this.translations());
    return typeof value === 'string' ? value : key;
  }

  private async loadLocale(locale: Locale): Promise<void> {
    this.ready.set(false);
    const data = await firstValueFrom(this.http.get<Translations>(`/i18n/${locale}.json`));
    this.translations.set(data);
    this.ready.set(true);
  }

  private readStoredLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return stored && SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
  }
}
