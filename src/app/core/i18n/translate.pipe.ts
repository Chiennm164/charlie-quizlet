import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from './translate.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(key: string): string {
    this.translate.locale();
    this.translate.ready();
    return this.translate.t(key);
  }
}
