import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { isHttpStatus } from '../../shared/utils/common.utils';
import { API_ENDPOINTS, HTTP_STATUS, RETURN_URL_PARAM, ROUTES } from '../config';

/**
 * Gắn Bearer token vào mọi request gọi BE. Nếu BE trả 401 (token hết hạn / bị thu hồi)
 * ở API cần đăng nhập thì xoá phiên và đưa về trang login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      // 401 ở /auth/login, /auth/register... là lỗi nghiệp vụ, để component tự xử lý.
      const isAuthEndpoint =
        req.url.startsWith(`${API_ENDPOINTS.auth.base}/`) && req.url !== API_ENDPOINTS.auth.me;
      if (isHttpStatus(err, HTTP_STATUS.unauthorized) && token && !isAuthEndpoint) {
        auth.logout();
        router.navigate([ROUTES.login], { queryParams: { [RETURN_URL_PARAM]: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
