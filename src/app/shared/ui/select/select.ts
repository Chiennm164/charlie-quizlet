import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextErrorComponent } from '../text-error/text-error';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [TextErrorComponent],
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [class.field__label-required]="required()">{{ label() }}</label>
      }
      <select
        class="select"
        [class.is-invalid]="!!errorMessage()"
        [disabled]="disabled()"
        (change)="onSelect($any($event.target).value)"
        (blur)="onTouched()"
      >
        <!-- Đánh dấu [selected] trên từng option thay vì [value] trên <select>: [value] được gán trước khi
             các option render nên trình duyệt bỏ qua và luôn chọn option đầu. -->
        @if (placeholder()) {
          <option value="" disabled [selected]="!value()">{{ placeholder() }}</option>
        }
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value" [selected]="opt.value === value()">{{ opt.label }}</option>
        }
      </select>
      <app-text-error [message]="errorMessage()" />
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  label = input<string | null>(null);
  placeholder = input<string | null>(null);
  required = input(false);
  options = input<SelectOption[]>([]);
  errorMessage = input<string | null>(null);

  value = signal('');
  disabled = signal(false);

  private onChangeFn: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onSelect(value: string): void {
    this.value.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
