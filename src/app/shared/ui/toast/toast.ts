import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { IconComponent } from '../icon/icon';
import { IconName } from '../icon/icon-registry';
import { ToastService, ToastVariant } from './toast.service';

const VARIANT_ICON: Record<ToastVariant, IconName> = {
  success: 'check-circle',
  danger: 'alert-circle',
  warning: 'warning',
  info: 'info-circle',
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          animate.enter="anim-toast-in"
          animate.leave="anim-toast-out"
          role="status"
          [class.toast--success]="toast.variant === 'success'"
          [class.toast--danger]="toast.variant === 'danger'"
          [class.toast--warning]="toast.variant === 'warning'"
          [class.toast--info]="toast.variant === 'info'"
        >
          <span class="toast__icon"><app-icon [name]="variantIcon(toast.variant)" /></span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            [attr.aria-label]="'common.close' | translate"
            (click)="toastService.dismiss(toast.id)"
          >
            <app-icon name="close" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  variantIcon(variant: ToastVariant): IconName {
    return VARIANT_ICON[variant];
  }
}
