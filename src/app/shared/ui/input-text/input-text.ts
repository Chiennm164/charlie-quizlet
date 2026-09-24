import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextErrorComponent } from '../text-error/text-error';

@Component({
  selector: 'app-input-text',
  standalone: true,
  imports: [TextErrorComponent],
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [class.field__label-required]="required()">{{ label() }}</label>
      }
      <input
        class="input"
        type="text"
        [attr.inputmode]="numericOnly() ? 'numeric' : null"
        [class.is-invalid]="!!errorMessage()"
        [placeholder]="placeholder()"
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
      useExisting: forwardRef(() => InputTextComponent),
      multi: true,
    },
  ],
})
export class InputTextComponent implements ControlValueAccessor {
  label = input<string | null>(null);
  placeholder = input('');
  required = input(false);
  /** Chỉ cho phép nhập chữ số (dùng cho mã học sinh, số điện thoại... khi cần giữ định dạng text, ví dụ số 0 đứng đầu). */
  numericOnly = input(false);
  errorMessage = input<string | null>(null);

  value = signal('');
  disabled = signal(false);

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
