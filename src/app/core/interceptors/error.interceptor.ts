import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ERROR_CODES } from '../config';
import { ErrorDialogService } from '../error/error-dialog.service';
import { isErrorHandled } from '../error/error-handling';
import { hasErrorCode } from '../../shared/utils/common.utils';

/**
 * Mặc định: mọi API lỗi đều hiện dialog lỗi chung.
 * Nơi gọi muốn tự xử lý 1 mã lỗi thì dùng handleErrorCode()/markErrorHandled() trong callback error
 * (xem core/error/error-handling.ts) — dialog được hoãn tới lượt chạy kế tiếp để kịp nhận biết điều đó.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorDialog = inject(ErrorDialogService);

  return next(req).pipe(
    catchError((err: unknown) => {
      // Phiên hết hạn: authInterceptor đã đăng xuất và đưa về trang login, không cần dialog.
      // (401 khác như sai mật khẩu - AUTH_INVALID_CREDENTIALS - vẫn hiện dialog.)
      if (!hasErrorCode(err, ERROR_CODES.COMMON_UNAUTHORIZED)) {
        setTimeout(() => {
          if (!isErrorHandled(err)) errorDialog.show(err);
        });
      }
      return throwError(() => err);
    }),
  );
};
