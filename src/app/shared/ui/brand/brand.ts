import { Component, input } from '@angular/core';
import { APP_SETTINGS } from '../../../core/config';
import { MascotComponent } from '../mascot/mascot';

/** Logo (linh vật chibi) + tên app, dùng ở header các layout. */
@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [MascotComponent],
  template: `
    <span class="inline-flex items-center gap-2 font-extrabold text-text-strong">
      <app-mascot class="w-9 h-9 transition-transform hover:-rotate-6" />
      @if (showName()) {
        <span [class.hidden]="hideNameOnMobile()" [class.sm:inline]="hideNameOnMobile()">{{
          name
        }}</span>
      }
    </span>
  `,
})
export class BrandComponent {
  showName = input(true);
  /** Ẩn tên app trên màn hình nhỏ, chỉ giữ logo. */
  hideNameOnMobile = input(false);

  readonly name = APP_SETTINGS.appName;
}
