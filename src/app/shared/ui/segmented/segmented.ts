import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { IconName } from '../icon/icon-registry';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: IconName;
}

/**
 * Chọn 1 trong vài lựa chọn nằm liền nhau (vd. cách xem trang Bộ đề, thứ tự câu ở trang thống kê).
 * Mỗi lựa chọn là 1 nút `aria-pressed`; style `.segmented` trong form.css.
 */
@Component({
  selector: 'app-segmented',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="segmented" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="segmented__item"
          [class.is-active]="option.value === value()"
          [attr.aria-pressed]="option.value === value()"
          (click)="valueChange.emit(option.value)"
        >
          @if (option.icon) {
            <app-icon [name]="option.icon" />
          }
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedComponent {
  options = input.required<SegmentedOption[]>();
  value = input.required<string>();
  /** Nhãn cho trình đọc màn hình (nhóm nút không có label hiển thị riêng). */
  label = input<string | null>(null);
  valueChange = output<string>();
}
