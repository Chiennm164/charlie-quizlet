import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ERROR_CODES } from '../../core/config';
import { handleErrorCode } from '../../core/error/error-handling';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslateService } from '../../core/i18n/translate.service';
import { ButtonComponent } from '../../shared/ui/button/button';
import { InputTextComponent } from '../../shared/ui/input-text/input-text';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppValidators, controlErrorMessage } from '../../shared/utils/validation.utils';

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

/** Hồ sơ của user đang đăng nhập: sửa họ tên, đổi mật khẩu. */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputTextComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly email = this.auth.currentUser()?.email ?? '';

  savingProfile = signal(false);
  changingPassword = signal(false);

  profileForm = this.fb.nonNullable.group({
    fullName: [this.auth.currentUser()?.fullName ?? '', AppValidators.fullName],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', AppValidators.currentPassword],
      newPassword: ['', AppValidators.newPassword],
      confirmPassword: ['', AppValidators.required],
    },
    { validators: AppValidators.passwordMatch('newPassword', 'confirmPassword') },
  );

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
        this.toast.success(this.translate.t('profile.profileSaved'));
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
          this.passwordForm.reset();
          this.toast.success(this.translate.t('profile.passwordChanged'));
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
