import { Injectable, inject, signal } from '@angular/core';
import { ERROR_CODES, ErrorCode, FE_ERROR_DISPLAY_CODES } from '../config';
import { TranslateService } from '../i18n/translate.service';
import { toApiError } from '../../shared/utils/common.utils';

/** Nội dung đang hiển thị trên dialog lỗi. */
export interface ErrorDialogData {
  title: string;
  description: string | null;
  /** Mã lỗi hiện cho người dùng (MCN-GG-NN). */
  displayCode: string | null;
  /** Lỗi theo từng field (COMMON_VALIDATION_FAILED). */
  fieldErrors: { field: string; message: string }[];
}

/**
 * Dialog lỗi dùng chung toàn app. errorInterceptor tự gọi show() cho mọi lỗi API chưa được nơi gọi xử lý;
 * code khác cũng có thể gọi show(err) trực tiếp.
 */
@Injectable({ providedIn: 'root' })
export class ErrorDialogService {
  private translate = inject(TranslateService);

  readonly isOpen = signal(false);
  /** Nội dung lỗi mới nhất (nhiều lỗi liên tiếp chỉ giữ lỗi cuối). Giữ lại sau khi đóng để animation đóng không bị trống nội dung. */
  readonly data = signal<ErrorDialogData | null>(null);

  show(err: unknown): void {
    this.data.set(this.toDialogData(err));
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  private toDialogData(err: unknown): ErrorDialogData {
    const apiError = toApiError(err);
    const isNetworkError = apiError.errorCode === ERROR_CODES.COMMON_NETWORK_ERROR;
    // Lỗi từ BE có sẵn message đã dịch; lỗi FE tự gán mã thì dùng câu dịch của FE.
    const fallback = isNetworkError
      ? { title: 'common.serverUnavailable', description: 'common.serverUnavailableDescription' }
      : { title: 'common.errorTitle', description: 'common.errorDescription' };

    return {
      title: apiError.errorMessage || this.translate.t(fallback.title),
      description: apiError.errorMessage
        ? (apiError.errorDescription ?? null)
        : this.translate.t(fallback.description),
      displayCode:
        apiError.errorDisplayCode ??
        FE_ERROR_DISPLAY_CODES[apiError.errorCode as ErrorCode] ??
        null,
      fieldErrors: Object.entries(apiError.errors ?? {}).map(([field, message]) => ({
        field,
        message,
      })),
    };
  }
}
