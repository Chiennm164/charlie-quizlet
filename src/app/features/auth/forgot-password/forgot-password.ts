import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ROUTES } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { AppValidators, controlErrorMessage } from '../../../shared/utils/validation.utils';
import { AuthLayoutComponent } from '../../../core/layout/auth-layout/auth-layout';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    InputTextComponent,
    TranslatePipe,
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly routes = ROUTES;
  submitting = signal(false);
  /** Email đã gửi yêu cầu; khác null thì hiện màn hình "đã gửi". */
  sentTo = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', AppValidators.email],
  });

  emailError(): string | null {
    return controlErrorMessage(this.form.controls.email, this.translate);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);

    const { email } = this.form.getRawValue();
    this.auth
      .forgotPassword({ email })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.sentTo.set(email);
        },
        // Lỗi -> dialog lỗi chung.
      });
  }
}
