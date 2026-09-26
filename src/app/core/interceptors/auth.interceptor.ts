import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { hasErrorCode } from '../../shared/utils/common.utils';
import { ERROR_CODES, PUBLIC_API_ENDPOINTS, RETURN_URL_PARAM, ROUTES } from '../config';

/**
 * Gắn access token vào request gọi BE (trừ API công khai) và giữ phiên đăng nhập:
 * - access token đã hết hạn → làm mới bằng refresh token rồi mới gửi request;
 * - BE vẫn trả 401 COMMON_UNAUTHORIZED → làm mới rồi gửi lại request 1 lần;
 * - phiên đã kết thúc (không còn refresh token dùng được) → đăng xuất, về trang login kèm returnUrl.
 * Làm mới bị lỗi mạng thì giữ phiên, lỗi trả về nơi gọi như bình thường.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || PUBLIC_API_ENDPOINTS.includes(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  const send = (token: string | null) =>
    next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);

  const endSessionIfExpired = (err: unknown) => {
    if (!auth.hasRefreshToken()) {
      auth.logout();
      router.navigate([ROUTES.login], { queryParams: { [RETURN_URL_PARAM]: router.url } });
    }
    return throwError(() => err);
  };

  const refreshThenSend = () =>
    auth.refresh().pipe(catchError(endSessionIfExpired), switchMap(send));

  const token = auth.getToken();
  if (!token && auth.hasRefreshToken()) {
    return refreshThenSend();
  }

  return send(token).pipe(
    catchError((err: unknown) => {
      if (!hasErrorCode(err, ERROR_CODES.COMMON_UNAUTHORIZED)) return throwError(() => err);
      return auth.hasRefreshToken() ? refreshThenSend() : endSessionIfExpired(err);
    }),
  );
};
