import { Component, input } from '@angular/core';

/**
 * Thông báo lỗi dưới ô nhập. Mặc định luôn giữ sẵn chỗ 1 dòng (reserveSpace) để khi lỗi
 * hiện ra / mất đi, layout phía dưới không bị đẩy lên xuống.
 * Dùng độc lập (không nằm dưới ô nhập) thì đặt [reserveSpace]="false".
 */
@Component({
  selector: 'app-text-error',
  standalone: true,
  template: `
    @if (reserveSpace() || message()) {
      <p class="field__error" [class.field__error--reserve]="reserveSpace()" aria-live="polite">
        @if (message(); as text) {
          <span class="block" animate.enter="anim-slide-down-in" animate.leave="anim-fade-out">{{
            text
          }}</span>
        }
      </p>
    }
  `,
})
export class TextErrorComponent {
  message = input<string | null>(null);
  reserveSpace = input(true);
}
