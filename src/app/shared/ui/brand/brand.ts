import { Component, input } from '@angular/core';
import { APP_SETTINGS } from '../../../core/config';

/** Logo + tên app, dùng ở header các layout. */
@Component({
  selector: 'app-brand',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-2 font-semibold text-text">
      <span
        class="w-8 h-8 rounded-md bg-primary text-text-inverse flex items-center justify-center text-body-sm"
      >
        {{ shortName }}
      </span>
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
  readonly shortName = APP_SETTINGS.appShortName;
}
