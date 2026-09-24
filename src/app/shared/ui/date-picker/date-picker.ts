import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextErrorComponent } from '../text-error/text-error';

/**
 * Date picker dùng native <input type="date"> (đủ tốt cho phần lớn use case,
 * có UI theo hệ điều hành, hỗ trợ mobile tốt — không cần tự vẽ lịch).
 * Value dạng chuỗi "yyyy-MM-dd" (chuẩn HTML date input) hoặc null.
 *
 * Vô hiệu hoá ngày: dùng `min`/`max` cho khoảng liên tục. Với những ngày rời rạc
 * (vd. chỉ cho chọn thứ 2-6, nghỉ lễ...) — native input không hỗ trợ — validate
 * ở `disabledDates` và hiển thị lỗi qua `errorMessage` khi người dùng chọn phải ngày đó.
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [TextErrorComponent],
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [class.field__label-required]="required()">{{ label() }}</label>
      }
      <input
        type="date"
        class="input"
        [class.is-invalid]="!!errorMessage()"
        [min]="min()"
        [max]="max()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <app-text-error [message]="errorMessage()" />
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  label = input<string | null>(null);
  required = input(false);
  /** yyyy-MM-dd */
  min = input<string | null>(null);
  /** yyyy-MM-dd */
  max = input<string | null>(null);
  errorMessage = input<string | null>(null);

  value = signal('');
  disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
