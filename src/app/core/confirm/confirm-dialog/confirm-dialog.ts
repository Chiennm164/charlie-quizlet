import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogComponent } from '../../../shared/ui/dialog/dialog';
import { ConfirmDialogService } from '../confirm-dialog.service';

/** Đặt 1 lần trong app.html, hiển thị hộp thoại do ConfirmDialogService mở. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonComponent, DialogComponent, TranslatePipe],
  template: `
    @let options = confirmDialog.options();
    <app-dialog
      size="sm"
      [open]="confirmDialog.isOpen()"
      [title]="options?.title ?? ''"
      (closed)="confirmDialog.close(false)"
    >
      <p class="typo-body-sm">{{ options?.message }}</p>
      <div dialog-footer class="flex justify-end gap-2">
        <app-button variant="secondary" (clicked)="confirmDialog.close(false)">
          {{ options?.cancelText ?? ('common.cancel' | translate) }}
        </app-button>
        <app-button
          [variant]="options?.danger ? 'danger' : 'primary'"
          (clicked)="confirmDialog.close(true)"
        >
          {{ options?.confirmText ?? ('common.confirm' | translate) }}
        </app-button>
      </div>
    </app-dialog>
  `,
})
export class ConfirmDialogComponent {
  confirmDialog = inject(ConfirmDialogService);
}
