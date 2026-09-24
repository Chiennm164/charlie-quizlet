import { Component, inject } from '@angular/core';
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
  imports: [IconComponent],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast--success]="toast.variant === 'success'"
          [class.toast--danger]="toast.variant === 'danger'"
          [class.toast--warning]="toast.variant === 'warning'"
          [class.toast--info]="toast.variant === 'info'"
        >
          <app-icon [name]="variantIcon(toast.variant)" />
          <span>{{ toast.message }}</span>
          <span class="toast__close" (click)="toastService.dismiss(toast.id)">
            <app-icon name="close" />
          </span>
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
