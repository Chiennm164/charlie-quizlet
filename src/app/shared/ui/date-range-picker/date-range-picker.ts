import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '../../../core/i18n/translate.service';
import { TextErrorComponent } from '../text-error/text-error';

export interface DateRange {
  from: string | null;
  to: string | null;
}

/** 2 <input type="date"> (từ ngày / đến ngày), tự validate "đến ngày" phải >= "từ ngày". */
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [TextErrorComponent],
  templateUrl: './date-range-picker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true,
    },
  ],
})
export class DateRangePickerComponent implements ControlValueAccessor {
  private translate = inject(TranslateService);

  label = input<string | null>(null);
  required = input(false);
  min = input<string | null>(null);
  max = input<string | null>(null);
  errorMessage = input<string | null>(null);

  value = signal<DateRange>({ from: null, to: null });
  disabled = signal(false);

  rangeInvalid = computed(() => {
    const { from, to } = this.value();
    return !!from && !!to && to < from;
  });

  rangeErrorText = computed(() => {
    this.translate.locale();
    return this.translate.t('common.invalidDateRange');
  });

  private onChange: (value: DateRange) => void = () => {};
  onTouched: () => void = () => {};

  onFromInput(event: Event): void {
    const from = (event.target as HTMLInputElement).value || null;
    const next = { ...this.value(), from };
    this.value.set(next);
    this.onChange(next);
  }

  onToInput(event: Event): void {
    const to = (event.target as HTMLInputElement).value || null;
    const next = { ...this.value(), to };
    this.value.set(next);
    this.onChange(next);
  }

  writeValue(value: DateRange): void {
    this.value.set(value ?? { from: null, to: null });
  }

  registerOnChange(fn: (value: DateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
