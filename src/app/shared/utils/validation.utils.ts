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

const { validation } = APP_SETTINGS;

/** Bộ validator theo loại field — giới hạn lấy từ APP_SETTINGS.validation (khớp BE). */
export const AppValidators: {
  readonly required: ValidatorFn[];
  readonly email: ValidatorFn[];
  readonly fullName: ValidatorFn[];
  readonly currentPassword: ValidatorFn[];
  readonly newPassword: ValidatorFn[];
  readonly passwordMatch: typeof passwordMatchValidator;
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
};

/**
 * Map mã lỗi validator → key i18n. Thứ tự khai báo = thứ tự ưu tiên khi control có nhiều lỗi cùng lúc.
 * Thêm validator mới (kể cả lỗi do BE trả về, vd. emailTaken) thì khai báo thêm ở đây.
 * Chuỗi dịch có thể chứa `{n}` — được thay bằng requiredLength của minlength/maxlength.
 */
export const FORM_ERROR_MESSAGE_KEYS: Record<string, string> = {
  required: 'common.required',
  email: 'common.emailInvalid',
  minlength: 'common.minLength',
  maxlength: 'common.maxLength',
  passwordMismatch: 'auth.passwordMismatch',
  emailTaken: 'auth.emailTaken',
  currentPasswordIncorrect: 'profile.currentPasswordIncorrect',
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

  const requiredLength = errors[code]?.requiredLength;
  return translate.t(FORM_ERROR_MESSAGE_KEYS[code], { n: requiredLength ?? '' });
}
