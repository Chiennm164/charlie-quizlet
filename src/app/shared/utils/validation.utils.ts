import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { APP_SETTINGS } from '../../core/config';
import type { TranslateService } from '../../core/i18n/translate.service';

/* =========================================================
   Validator và thông báo lỗi form dùng chung toàn app.
   Form mới: dùng bộ validator trong AppValidators thay vì tự ghép Validators.*,
   hiển thị lỗi bằng controlErrorMessage().
   ========================================================= */

/** Bắt buộc và không được chỉ toàn khoảng trắng (Validators.required coi "   " là hợp lệ). */
export const notBlankValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/** Validator cấp form: báo lỗi `passwordMismatch` trên control xác nhận khi 2 mật khẩu không khớp. */
export function passwordMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirm = group.get(confirmKey);
    if (!confirm) return null;

    const mismatch = !!confirm.value && group.get(passwordKey)?.value !== confirm.value;
    const { passwordMismatch: _, ...otherErrors } = confirm.errors ?? {};
    if (mismatch) {
      confirm.setErrors({ ...otherErrors, passwordMismatch: true });
    } else {
      confirm.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
    }
    return null;
  };
}

/**
 * Validator cho FormArray: số phần tử tối thiểu. Lỗi `minItems: { min, actual }` nằm trên chính FormArray
 * (không gắn với ô nào) — nơi dùng tự hiển thị.
 */
export function minItemsValidator(min: number): ValidatorFn {
  return (array: AbstractControl): ValidationErrors | null => {
    const actual = Array.isArray(array.value) ? array.value.length : 0;
    return actual < min ? { minItems: { min, actual } } : null;
  };
}

/**
 * Validator cho FormArray gồm các FormGroup: báo lỗi `duplicate` trên control `key` của mọi dòng có giá trị trùng
 * (bỏ khoảng trắng đầu/cuối, không phân biệt hoa thường; ô trống bỏ qua). Giống passwordMatch: gắn lỗi vào đúng ô
 * để hiện dưới ô đó.
 */
export function uniqueValuesValidator(key: string): ValidatorFn {
  return (array: AbstractControl): ValidationErrors | null => {
    const controls = (array as unknown as { controls: AbstractControl[] }).controls
      .map((group) => group.get(key))
      .filter((control): control is AbstractControl => control !== null);
    const normalize = (value: unknown) =>
      String(value ?? '')
        .trim()
        .toLowerCase();

    const counts = new Map<string, number>();
    for (const control of controls) {
      const value = normalize(control.value);
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    let hasDuplicate = false;
    for (const control of controls) {
      const duplicate = (counts.get(normalize(control.value)) ?? 0) > 1;
      hasDuplicate ||= duplicate;
      const { duplicate: _, ...otherErrors } = control.errors ?? {};
      if (duplicate) {
        control.setErrors({ ...otherErrors, duplicate: true });
      } else if (control.errors?.['duplicate']) {
        control.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
    }
    return hasDuplicate ? { duplicate: true } : null;
  };
}

const { validation } = APP_SETTINGS;

/** Bộ validator theo loại field — giới hạn lấy từ APP_SETTINGS.validation (khớp BE). */
export const AppValidators: {
  readonly required: ValidatorFn[];
  readonly email: ValidatorFn[];
  readonly fullName: ValidatorFn[];
  readonly currentPassword: ValidatorFn[];
  readonly newPassword: ValidatorFn[];
  readonly passwordMatch: typeof passwordMatchValidator;
  readonly topicName: ValidatorFn[];
} = {
  required: [Validators.required],
  email: [Validators.required, Validators.email, Validators.maxLength(validation.emailMaxLength)],
  fullName: [notBlankValidator, Validators.maxLength(validation.fullNameMaxLength)],
  /** Mật khẩu khi đăng nhập: chỉ bắt buộc, không kiểm độ dài (tài khoản cũ có thể theo quy tắc khác). */
  currentPassword: [Validators.required],
  /** Mật khẩu mới (đăng ký / đặt lại mật khẩu). */
  newPassword: [
    Validators.required,
    Validators.minLength(validation.passwordMinLength),
    Validators.maxLength(validation.passwordMaxLength),
  ],
  passwordMatch: passwordMatchValidator,
  topicName: [notBlankValidator, Validators.maxLength(validation.topicNameMaxLength)],
};

/**
 * Map mã lỗi validator → key i18n. Thứ tự khai báo = thứ tự ưu tiên khi control có nhiều lỗi cùng lúc.
 * Thêm validator mới (kể cả lỗi do BE trả về, vd. emailTaken) thì khai báo thêm ở đây.
 * Chuỗi dịch có thể chứa `{n}` — được thay bằng requiredLength của minlength/maxlength, giới hạn của min/max.
 */
export const FORM_ERROR_MESSAGE_KEYS: Record<string, string> = {
  required: 'common.required',
  email: 'common.emailInvalid',
  minlength: 'common.minLength',
  maxlength: 'common.maxLength',
  min: 'common.min',
  max: 'common.max',
  passwordMismatch: 'auth.passwordMismatch',
  emailTaken: 'auth.emailTaken',
  currentPasswordIncorrect: 'account.currentPasswordIncorrect',
  duplicate: 'common.duplicate',
  topicNameTaken: 'adminTopic.nameTaken',
};

/** Thông báo lỗi (đã dịch) cần hiển thị cho control, hoặc null nếu chưa touched / không có lỗi. */
export function controlErrorMessage(
  control: AbstractControl,
  translate: TranslateService,
): string | null {
  const errors = control.errors;
  if (!control.touched || !errors) return null;

  const code = Object.keys(FORM_ERROR_MESSAGE_KEYS).find((c) => errors[c]);
  if (!code) return translate.t('common.invalid');

  // {n}: độ dài của minlength / maxlength, giới hạn của min / max.
  const detail = errors[code];
  const n = detail?.requiredLength ?? detail?.min ?? detail?.max ?? '';
  return translate.t(FORM_ERROR_MESSAGE_KEYS[code], { n });
}
