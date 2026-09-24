import { Component, effect, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextErrorComponent } from '../text-error/text-error';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let nextGroupId = 0;

/**
 * Radio group chuẩn a11y: mỗi input cùng `name` (roving trong 1 group),
 * điều hướng bằng phím ←/→/↑/↓ tự chuyển lựa chọn giữa các option còn lại (không disabled),
 * giống hành vi radio group gốc của trình duyệt.
 */
@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [TextErrorComponent],
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [class.field__label-required]="required()">{{ label() }}</label>
      }
      <div
        class="radio-group"
        [class.radio-group--horizontal]="horizontal()"
        role="radiogroup"
        (keydown)="onKeydown($event)"
      >
        @for (opt of options(); track opt.value) {
          <label class="radio" [class.is-disabled]="opt.disabled || disabled()">
            <input
              type="radio"
              class="radio__input"
              [name]="groupName"
              [value]="opt.value"
              [checked]="opt.value === value()"
              [disabled]="!!opt.disabled || disabled()"
              (change)="onSelect(opt.value)"
              (blur)="onTouched()"
            />
            <span class="radio__label">{{ opt.label }}</span>
          </label>
        }
      </div>
      <app-text-error [message]="errorMessage()" />
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly groupName = `radio-group-${nextGroupId++}`;

  label = input<string | null>(null);
  required = input(false);
  options = input<RadioOption[]>([]);
  horizontal = input(false);
  errorMessage = input<string | null>(null);

  /** Dùng khi đặt trực tiếp giá trị ban đầu ngoài Reactive Forms (vd. [value]="x" (valueChange)="..."). */
  valueInput = input<string | null>(null, { alias: 'value' });
  valueChange = output<string>();

  value = signal<string | null>(null);
  disabled = signal(false);

  private onChangeFn: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    effect(() => this.value.set(this.valueInput()));
  }

  onSelect(value: string): void {
    this.value.set(value);
    this.onChangeFn(value);
    this.valueChange.emit(value);
  }

  onKeydown(event: KeyboardEvent): void {
    const navKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!navKeys.includes(event.key)) return;

    event.preventDefault();
    const enabled = this.options().filter((opt) => !opt.disabled && !this.disabled());
    if (enabled.length === 0) return;

    const currentIndex = enabled.findIndex((opt) => opt.value === this.value());
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const delta = forward ? 1 : -1;
    const nextIndex = (currentIndex + delta + enabled.length) % enabled.length;

    this.onSelect(enabled[nextIndex].value);
  }

  writeValue(value: string): void {
    this.value.set(value ?? null);
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
