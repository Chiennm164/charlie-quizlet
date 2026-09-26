import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import type { TranslateService } from '../../core/i18n/translate.service';
import {
  AppValidators,
  controlErrorMessage,
  minItemsValidator,
  notBlankValidator,
  passwordMatchValidator,
  uniqueValuesValidator,
} from './validation.utils';

describe('passwordMatchValidator', () => {
  const build = () =>
    new FormGroup(
      { password: new FormControl('secret123'), confirm: new FormControl('', Validators.required) },
      { validators: passwordMatchValidator('password', 'confirm') },
    );

  it('báo passwordMismatch khi 2 mật khẩu khác nhau', () => {
    const form = build();
    form.controls.confirm.setValue('other');
    expect(form.controls.confirm.hasError('passwordMismatch')).toBe(true);
  });

  it('hết lỗi khi khớp, và giữ nguyên lỗi khác của control', () => {
    const form = build();
    form.controls.confirm.setValue('secret123');
    expect(form.controls.confirm.errors).toBeNull();

    form.controls.confirm.setValue('');
    expect(form.controls.confirm.hasError('required')).toBe(true);
    expect(form.controls.confirm.hasError('passwordMismatch')).toBe(false);
  });

  it('đổi mật khẩu gốc cũng cập nhật lỗi ở ô xác nhận', () => {
    const form = build();
    form.controls.confirm.setValue('secret123');
    form.controls.password.setValue('changed');
    expect(form.controls.confirm.hasError('passwordMismatch')).toBe(true);
  });
});

describe('controlErrorMessage', () => {
  const messages: Record<string, string> = {
    'common.required': 'Bắt buộc',
    'common.minLength': 'Tối thiểu {n} ký tự',
    'common.emailInvalid': 'Email sai',
  };
  const translate = {
    t: (key: string, params?: Record<string, string | number>) =>
      (messages[key] ?? key).replace(/\{(\w+)\}/g, (m, name: string) =>
        String(params?.[name] ?? m),
      ),
  } as TranslateService;

  it('chưa touched thì không hiện lỗi', () => {
    expect(controlErrorMessage(new FormControl('', Validators.required), translate)).toBeNull();
  });

  it('dịch lỗi theo thứ tự ưu tiên và điền {n}', () => {
    const control = new FormControl('abc', [Validators.required, Validators.minLength(8)]);
    control.markAsTouched();
    expect(controlErrorMessage(control, translate)).toBe('Tối thiểu 8 ký tự');
  });

  it('lỗi không khai báo -> thông báo chung', () => {
    const control = new FormControl('x');
    control.setErrors({ somethingElse: true });
    control.markAsTouched();
    expect(controlErrorMessage(control, translate)).toBe('common.invalid');
  });
});

describe('AppValidators', () => {
  it('notBlank: chuỗi toàn khoảng trắng coi như bỏ trống', () => {
    expect(notBlankValidator(new FormControl('   '))).toEqual({ required: true });
    expect(notBlankValidator(new FormControl(' An '))).toBeNull();
  });

  it('newPassword: áp giới hạn độ dài từ APP_SETTINGS', () => {
    const control = new FormControl('short', AppValidators.newPassword);
    expect(control.hasError('minlength')).toBe(true);
    control.setValue('x'.repeat(73));
    expect(control.hasError('maxlength')).toBe(true);
    control.setValue('longenough');
    expect(control.valid).toBe(true);
  });

  it('email: bắt buộc và đúng định dạng', () => {
    const control = new FormControl('', AppValidators.email);
    expect(control.hasError('required')).toBe(true);
    control.setValue('abc');
    expect(control.hasError('email')).toBe(true);
    control.setValue('an@example.com');
    expect(control.valid).toBe(true);
  });
});

describe('minItemsValidator', () => {
  it('báo minItems trên FormArray khi thiếu phần tử', () => {
    const array = new FormArray([new FormControl('a')], minItemsValidator(2));
    expect(array.errors).toEqual({ minItems: { min: 2, actual: 1 } });

    array.push(new FormControl('b'));
    expect(array.errors).toBeNull();
  });
});

describe('uniqueValuesValidator', () => {
  const row = (term: string) => new FormGroup({ term: new FormControl(term, Validators.required) });
  const build = (...terms: string[]) =>
    new FormArray(terms.map(row), uniqueValuesValidator('term'));

  it('gắn lỗi duplicate vào mọi dòng trùng (bỏ khoảng trắng, không phân biệt hoa thường)', () => {
    const array = build('Apple', ' apple ', 'cat');
    expect(array.at(0).controls.term.hasError('duplicate')).toBe(true);
    expect(array.at(1).controls.term.hasError('duplicate')).toBe(true);
    expect(array.at(2).controls.term.hasError('duplicate')).toBe(false);
    expect(array.hasError('duplicate')).toBe(true);
  });

  it('hết trùng thì gỡ lỗi, giữ lỗi khác; ô trống không tính là trùng', () => {
    const array = build('apple', 'apple');
    array.at(1).controls.term.setValue('');
    expect(array.at(0).controls.term.errors).toBeNull();
    expect(array.at(1).controls.term.hasError('required')).toBe(true);
    expect(array.at(1).controls.term.hasError('duplicate')).toBe(false);

    array.push(row(''));
    expect(array.valid).toBe(false);
    expect(array.hasError('duplicate')).toBe(false);
  });
});
