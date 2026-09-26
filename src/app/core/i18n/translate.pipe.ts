import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from './translate.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private translate = inject(TranslateService);

  /** {{ 'auth.hello' | translate: { name: user.fullName } }} — params thay placeholder {name}. */
  transform(key: string, params?: Record<string, string | number>): string {
    this.translate.locale();
    this.translate.ready();
    return this.translate.t(key, params);
  }
}
