import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DEFAULT_AUTHENTICATED_ROUTE, ERROR_CODES, ROUTES } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { RadioGroupComponent, RadioOption } from '../../../shared/ui/radio-group/radio-group';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthLayoutComponent } from '../../../core/layout/auth-layout/auth-layout';
import { handleErrorCode } from '../../../core/error/error-handling';
import { AppValidators, controlErrorMessage } from '../../../shared/utils/validation.utils';
import { RegistrationRole } from '../../../core/models';

type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword' | 'role';

const REGISTRATION_ROLES: RegistrationRole[] = ['STUDENT', 'TEACHER'];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    InputTextComponent,
    RadioGroupComponent,
    TranslatePipe,
  ],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly routes = ROUTES;
  submitting = signal(false);
  /** Email tài khoản Teacher vừa tạo, đang chờ Admin duyệt — có giá trị thì hiện thông báo thay cho form. */
  pendingEmail = signal<string | null>(null);

  roleOptions = computed<RadioOption[]>(() => {
    this.translate.locale();
    return REGISTRATION_ROLES.map((role) => ({
      value: role,
      label: this.translate.t(`home.roles.${role}`),
    }));
  });

  form = this.fb.nonNullable.group(
    {
      fullName: ['', AppValidators.fullName],
      email: ['', AppValidators.email],
      password: ['', AppValidators.newPassword],
      confirmPassword: ['', AppValidators.required],
      role: ['STUDENT' as RegistrationRole, AppValidators.required],
    },
    { validators: AppValidators.passwordMatch('password', 'confirmPassword') },
  );

  errorFor(controlName: RegisterField): string | null {
    return controlErrorMessage(this.form.controls[controlName], this.translate);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);

    const { fullName, email, password, role } = this.form.getRawValue();
    this.auth
      .register({ fullName: fullName.trim(), email, password, role })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          if (!res.session) {
            this.pendingEmail.set(res.user.email);
            return;
          }
          this.toast.success(this.translate.t('auth.registerSuccess', { name: res.user.fullName }));
          this.router.navigateByUrl(DEFAULT_AUTHENTICATED_ROUTE);
        },
        error: (err: unknown) => {
          // Email trùng -> báo ngay dưới ô email thay vì dialog; mã lỗi khác vẫn hiện dialog lỗi chung.
          handleErrorCode(err, ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, () =>
            this.form.controls.email.setErrors({ emailTaken: true }),
          );
        },
      });
  }
}
