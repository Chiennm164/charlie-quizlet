import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ConfirmDialogService } from '../confirm/confirm-dialog.service';
import { TranslateService } from '../i18n/translate.service';

/** Component có dữ liệu nhập dở (vd. form chưa lưu). */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Rời trang khi còn thay đổi chưa lưu -> hỏi xác nhận. Đóng tab / F5 thì component tự chặn bằng `beforeunload`
 * (guard không chạy trong trường hợp đó).
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  // Đăng xuất / hết phiên: vẫn phải rời trang, không hỏi.
  if (!inject(AuthService).isAuthenticated() || !component.hasUnsavedChanges()) return true;

  const translate = inject(TranslateService);
  return inject(ConfirmDialogService).confirm({
    title: translate.t('common.unsavedTitle'),
    message: translate.t('common.unsavedMessage'),
    confirmText: translate.t('common.unsavedLeave'),
    cancelText: translate.t('common.unsavedStay'),
    danger: true,
  });
};
