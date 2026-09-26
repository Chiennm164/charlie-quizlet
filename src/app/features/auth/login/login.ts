import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import {
  APP_SETTINGS,
  DEFAULT_AUTHENTICATED_ROUTE,
  RETURN_URL_PARAM,
  ROUTES,
} from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CheckboxComponent } from '../../../shared/ui/checkbox/checkbox';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppValidators, controlErrorMessage } from '../../../shared/utils/validation.utils';
import { AuthLayoutComponent } from '../../../core/layout/auth-layout/auth-layout';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    CheckboxComponent,
    InputTextComponent,
    TranslatePipe,
  ],
  templateUrl: './login.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly routes = ROUTES;
  submitting = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', AppValidators.email],
    password: ['', AppValidators.currentPassword],
    /** Ghi nhớ đăng nhập: bỏ tick thì đóng trình duyệt sẽ phải đăng nhập lại. */
    rememberMe: [APP_SETTINGS.auth.rememberMeDefault as boolean],
  });

  errorFor(controlName: 'email' | 'password'): string | null {
    return controlErrorMessage(this.form.controls[controlName], this.translate);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);

    const { email, password, rememberMe } = this.form.getRawValue();
    this.auth
      .login({ email, password }, rememberMe)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.toast.success(this.translate.t('auth.loginSuccess', { name: res.user.fullName }));
          const returnUrl =
            this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM) || DEFAULT_AUTHENTICATED_ROUTE;
          this.router.navigateByUrl(returnUrl);
        },
        // Lỗi (sai mật khẩu, tài khoản bị khoá...) -> dialog lỗi chung, không cần xử lý riêng.
      });
  }
}
