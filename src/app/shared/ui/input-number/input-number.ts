import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextErrorComponent } from '../text-error/text-error';

@Component({
  selector: 'app-input-number',
  standalone: true,
  imports: [TextErrorComponent],
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [class.field__label-required]="required()">{{ label() }}</label>
      }
      <input
        class="input"
        type="number"
        [class.is-invalid]="!!errorMessage()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [min]="min()"
        [max]="max()"
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
      useExisting: forwardRef(() => InputNumberComponent),
      multi: true,
    },
  ],
})
export class InputNumberComponent implements ControlValueAccessor {
  label = input<string | null>(null);
  placeholder = input('');
  required = input(false);
  min = input<number | null>(null);
  max = input<number | null>(null);
  errorMessage = input<string | null>(null);

  value = signal<number | null>(null);
  disabled = signal(false);

  private onChange: (value: number | null) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? null : Number(raw);
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
