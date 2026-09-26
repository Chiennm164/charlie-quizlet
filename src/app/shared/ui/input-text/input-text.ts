import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { IconComponent } from '../icon/icon';
import { TextErrorComponent } from '../text-error/text-error';

@Component({
  selector: 'app-input-text',
  standalone: true,
  imports: [IconComponent, TextErrorComponent, TranslatePipe],
  templateUrl: './input-text.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTextComponent),
      multi: true,
    },
  ],
})
export class InputTextComponent implements ControlValueAccessor {
  label = input<string | null>(null);
  type = input<'text' | 'email' | 'password'>('text');
  placeholder = input('');
  required = input(false);
  /** Chỉ cho phép nhập chữ số (dùng cho mã học sinh, số điện thoại... khi cần giữ định dạng text, ví dụ số 0 đứng đầu). */
  numericOnly = input(false);
  errorMessage = input<string | null>(null);
  autocomplete = input<string | null>(null);
  /** Thuộc tính name của thẻ input — giúp trình duyệt nhận diện ô email/mật khẩu để đề nghị lưu & tự điền. */
  name = input<string | null>(null);

  value = signal('');
  disabled = signal(false);
  /** Với type="password": bấm icon con mắt để ẩn/hiện mật khẩu. */
  passwordVisible = signal(false);

  isPassword = computed(() => this.type() === 'password');
  inputType = computed(() => (this.isPassword() && this.passwordVisible() ? 'text' : this.type()));

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value;

    if (this.numericOnly()) {
      value = value.replace(/\D/g, '');
      target.value = value;
    }

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
