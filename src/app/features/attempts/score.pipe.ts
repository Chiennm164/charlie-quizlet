import { Pipe, PipeTransform, inject } from '@angular/core';
import { APP_SETTINGS } from '../../core/config';
import { TranslateService } from '../../core/i18n/translate.service';
import { toScore } from './attempt.store';

/**
 * Điểm theo thang APP_SETTINGS.attempt.scoreScale, định dạng số theo ngôn ngữ đang chọn (83,3 / 83.3):
 *   {{ correctCount | score: questionCount }}   -> điểm của 1 lượt (số câu đúng / số câu)
 *   {{ bestPercent | score }}                   -> đổi tỉ lệ đúng 0–100 (BE trả) sang điểm
 * Impure vì đổi ngôn ngữ phải định dạng lại (như pipe translate).
 */
@Pipe({ name: 'score', standalone: true, pure: false })
export class ScorePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: number | null | undefined, total?: number): string {
    const points = total === undefined ? toScore(value ?? 0, 100) : toScore(value ?? 0, total);
    const locale = APP_SETTINGS.i18n.formatLocale[this.translate.locale()];
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(points);
  }
}
