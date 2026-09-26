import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ERROR_CODES, ROUTES } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { TextErrorComponent } from '../../../shared/ui/text-error/text-error';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthLayoutComponent } from '../../../core/layout/auth-layout/auth-layout';
import { handleErrorCode } from '../../../core/error/error-handling';
import { AppValidators, controlErrorMessage } from '../../../shared/utils/validation.utils';

/** Trang mở từ link trong email: /reset-password?token=... */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    InputTextComponent,
    TextErrorComponent,
    TranslatePipe,
  ],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly routes = ROUTES;
  token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  submitting = signal(false);
  /** BE báo token sai / hết hạn / đã dùng → ẩn form, gợi ý xin link mới. */
  tokenInvalid = signal(false);

  form = this.fb.nonNullable.group(
    {
      newPassword: ['', AppValidators.newPassword],
      confirmPassword: ['', AppValidators.required],
    },
    { validators: AppValidators.passwordMatch('newPassword', 'confirmPassword') },
  );

  errorFor(controlName: 'newPassword' | 'confirmPassword'): string | null {
    return controlErrorMessage(this.form.controls[controlName], this.translate);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.token || this.form.invalid || this.submitting()) return;

    this.submitting.set(true);

    this.auth
      .resetPassword({ token: this.token, newPassword: this.form.getRawValue().newPassword })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.translate.t('auth.resetPasswordSuccess'));
          this.router.navigateByUrl(ROUTES.login);
        },
        error: (err: unknown) => {
          // Link hết hạn / đã dùng -> ẩn form, gợi ý xin link mới; mã lỗi khác vẫn hiện dialog lỗi chung.
          handleErrorCode(err, ERROR_CODES.AUTH_RESET_TOKEN_INVALID, () =>
            this.tokenInvalid.set(true),
          );
        },
      });
  }
}
