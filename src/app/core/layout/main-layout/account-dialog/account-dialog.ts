import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { APP_SETTINGS, ERROR_CODES, Locale } from '../../../config';
import { handleErrorCode } from '../../../error/error-handling';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { TranslateService } from '../../../i18n/translate.service';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog';
import { InputTextComponent } from '../../../../shared/ui/input-text/input-text';
import { RadioGroupComponent, RadioOption } from '../../../../shared/ui/radio-group/radio-group';
import { TabItem, TabsComponent } from '../../../../shared/ui/tabs/tabs';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { formatDate } from '../../../../shared/utils/common.utils';
import { AppValidators, controlErrorMessage } from '../../../../shared/utils/validation.utils';

type AccountTab = 'info' | 'password' | 'settings';
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

/** Dialog tài khoản mở từ header: xem thông tin, sửa họ tên, đổi mật khẩu, cài đặt (ngôn ngữ). */
@Component({
  selector: 'app-account-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DialogComponent,
    InputTextComponent,
    RadioGroupComponent,
    TabsComponent,
    TranslatePipe,
  ],
  templateUrl: './account-dialog.html',
})
export class AccountDialogComponent {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  open = input(false);
  closed = output<void>();

  activeTab = signal<AccountTab>('info');
  savingProfile = signal(false);
  changingPassword = signal(false);

  tabs = computed<TabItem[]>(() => {
    this.translate.locale();
    return [
      { id: 'info', label: this.translate.t('account.infoTab') },
      { id: 'password', label: this.translate.t('account.passwordTab') },
      { id: 'settings', label: this.translate.t('account.settingsTab') },
    ];
  });

  readonly localeOptions: RadioOption[] = this.translate
    .supportedLocales()
    .map((locale) => ({ value: locale, label: APP_SETTINGS.i18n.localeNames[locale] }));

  memberSince = computed(() =>
    formatDate(
      this.auth.currentUser()?.createdAt,
      APP_SETTINGS.i18n.formatLocale[this.translate.locale()],
    ),
  );

  profileForm = this.fb.nonNullable.group({
    fullName: ['', AppValidators.fullName],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', AppValidators.currentPassword],
      newPassword: ['', AppValidators.newPassword],
      confirmPassword: ['', AppValidators.required],
    },
    { validators: AppValidators.passwordMatch('newPassword', 'confirmPassword') },
  );

  constructor() {
    // Mỗi lần mở: về tab đầu, form lấy lại dữ liệu mới nhất, xoá mật khẩu nhập dở lần trước.
    effect(() => {
      if (!this.open()) return;
      this.activeTab.set('info');
      this.profileForm.reset({ fullName: this.auth.currentUser()?.fullName ?? '' });
      this.passwordForm.reset();
    });
  }

  selectTab(id: string): void {
    this.activeTab.set(id as AccountTab);
  }

  /** Đổi ngay khi chọn (không cần bấm Lưu); TranslateService tự nhớ lựa chọn trên trình duyệt này. */
  changeLocale(locale: string): void {
    this.translate.setLocale(locale as Locale);
  }

  fullNameError(): string | null {
    return controlErrorMessage(this.profileForm.controls.fullName, this.translate);
  }

  passwordError(controlName: PasswordField): string | null {
    return controlErrorMessage(this.passwordForm.controls[controlName], this.translate);
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid || this.savingProfile()) return;

    this.savingProfile.set(true);
    this.auth
      .updateProfile({ fullName: this.profileForm.getRawValue().fullName.trim() })
      .pipe(
        finalize(() => this.savingProfile.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => {
        this.profileForm.reset({ fullName: user.fullName });
        this.toast.success(this.translate.t('account.profileSaved'));
      });
  }

  changePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.changingPassword()) return;

    this.changingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.auth
      .changePassword({ currentPassword, newPassword })
      .pipe(
        finalize(() => this.changingPassword.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.translate.t('account.passwordChanged'));
          this.closed.emit();
        },
        error: (err: unknown) => {
          // Sai mật khẩu hiện tại -> báo dưới ô; mã lỗi khác vẫn hiện dialog lỗi chung.
          handleErrorCode(err, ERROR_CODES.AUTH_CURRENT_PASSWORD_INCORRECT, () =>
            this.passwordForm.controls.currentPassword.setErrors({
              currentPasswordIncorrect: true,
            }),
          );
        },
      });
  }
}
