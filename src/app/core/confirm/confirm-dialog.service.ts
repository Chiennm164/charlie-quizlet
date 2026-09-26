import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Mặc định: common.confirm / common.cancel. */
  confirmText?: string;
  cancelText?: string;
  /** Nút xác nhận màu đỏ (xoá, bỏ thay đổi...). */
  danger?: boolean;
}

/**
 * Hộp thoại xác nhận dùng chung (thay cho `confirm()` của trình duyệt), trả về Promise<boolean> nên dùng được cả
 * trong guard. `<app-confirm-dialog>` đặt 1 lần trong app.html.
 *
 *   if (await this.confirmDialog.confirm({ title, message, danger: true })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  /** Giữ lại sau khi đóng để animation đóng không bị trống nội dung. */
  readonly options = signal<ConfirmOptions | null>(null);
  readonly isOpen = signal(false);

  private resolve: ((confirmed: boolean) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean> {
    // Đang mở hộp thoại khác: coi như huỷ hộp thoại cũ.
    this.resolve?.(false);
    this.options.set(options);
    this.isOpen.set(true);
    return new Promise((resolve) => (this.resolve = resolve));
  }

  close(confirmed: boolean): void {
    this.isOpen.set(false);
    this.resolve?.(confirmed);
    this.resolve = null;
  }
}
