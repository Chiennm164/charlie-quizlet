import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Nhãn truyền bằng nội dung bên trong: <app-checkbox formControlName="x">Nhãn</app-checkbox>. */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  template: `
    <label class="checkbox" [class.is-disabled]="disabled()">
      <input
        type="checkbox"
        class="checkbox__box"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onChange($any($event.target).checked)"
        (blur)="onTouched()"
      />
      <span class="checkbox__label"><ng-content /></span>
    </label>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  checked = signal(false);
  disabled = signal(false);

  private onChangeFn: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  onChange(value: boolean): void {
    this.checked.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
