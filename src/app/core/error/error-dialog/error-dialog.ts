import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogComponent } from '../../../shared/ui/dialog/dialog';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ErrorDialogService } from '../error-dialog.service';

/** Đặt 1 lần trong app.html, hiển thị lỗi do ErrorDialogService phát ra. */
@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [ButtonComponent, DialogComponent, IconComponent, TranslatePipe],
  template: `
    @let error = errorDialog.data();
    <app-dialog
      [open]="errorDialog.isOpen()"
      [title]="'common.errorDialogTitle' | translate"
      size="sm"
      (closed)="errorDialog.close()"
    >
      @if (error) {
        <div class="flex gap-3" role="alert">
          <app-icon name="alert-circle" class="text-danger text-2xl shrink-0" />
          <div class="min-w-0 flex flex-col gap-2">
            <p class="typo-card-title">{{ error.title }}</p>
            @if (error.description) {
              <p class="typo-muted">{{ error.description }}</p>
            }
            @if (error.fieldErrors.length) {
              <ul class="list-disc pl-5 typo-muted">
                @for (item of error.fieldErrors; track item.field) {
                  <li>
                    <span class="font-medium text-text">{{ item.field }}</span
                    >: {{ item.message }}
                  </li>
                }
              </ul>
            }
            @if (error.errorCode) {
              <p class="typo-error-code">
                {{ 'common.errorCode' | translate }}: {{ error.errorCode }}
              </p>
            }
          </div>
        </div>
      }
      <div dialog-footer>
        <app-button (clicked)="errorDialog.close()">{{ 'common.close' | translate }}</app-button>
      </div>
    </app-dialog>
  `,
})
export class ErrorDialogComponent {
  errorDialog = inject(ErrorDialogService);
}
