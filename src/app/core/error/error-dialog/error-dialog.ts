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
        <div class="flex flex-col items-center gap-2 text-center" role="alert">
          <span
            class="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger"
            aria-hidden="true"
          >
            <app-icon name="alert-circle" [size]="28" />
          </span>
          <p class="typo-card-title">{{ error.title }}</p>
          @if (error.description) {
            <p class="typo-muted">{{ error.description }}</p>
          }
          @if (error.fieldErrors.length) {
            <ul class="w-full list-disc pl-5 text-left typo-muted">
              @for (item of error.fieldErrors; track item.field) {
                <li>
                  <span class="font-medium text-text">{{ item.field }}</span
                  >: {{ item.message }}
                </li>
              }
            </ul>
          }
          @if (error.displayCode) {
            <p class="mt-1 rounded-full bg-bg-muted px-3 py-0.5 typo-error-code">
              {{ 'common.errorCode' | translate }}: {{ error.displayCode }}
            </p>
          }
        </div>
      }
      <div dialog-footer class="flex w-full justify-center">
        <app-button
          class="w-full sm:w-auto sm:min-w-32"
          [block]="true"
          (clicked)="errorDialog.close()"
        >
          {{ 'common.close' | translate }}
        </app-button>
      </div>
    </app-dialog>
  `,
})
export class ErrorDialogComponent {
  errorDialog = inject(ErrorDialogService);
}
