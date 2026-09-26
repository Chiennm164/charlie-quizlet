import { Component, inject } from '@angular/core';
import { Locale, TranslateService } from '../../../core/i18n/translate.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div class="inline-flex rounded-md border border-border overflow-hidden">
      @for (locale of translate.supportedLocales(); track locale) {
        <button
          type="button"
          class="px-3 py-1 text-body-sm cursor-pointer transition-colors"
          [class.bg-primary]="translate.locale() === locale"
          [class.text-text-inverse]="translate.locale() === locale"
          [class.text-text]="translate.locale() !== locale"
          [class.hover:bg-bg-muted]="translate.locale() !== locale"
          [class.cursor-default]="translate.locale() === locale"
          (click)="change(locale)"
        >
          {{ locale.toUpperCase() }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  translate = inject(TranslateService);

  change(locale: Locale): void {
    this.translate.setLocale(locale);
  }
}
