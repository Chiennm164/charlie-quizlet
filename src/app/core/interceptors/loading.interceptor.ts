import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { GlobalLoadingService } from '../../shared/ui/global-loading/global-loading.service';

/** Gắn vào HttpContext của 1 request để request đó không hiện loading global. */
export const SKIP_GLOBAL_LOADING = new HttpContextToken(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_GLOBAL_LOADING)) {
    return next(req);
  }

  const loading = inject(GlobalLoadingService);
  loading.show();

  return next(req).pipe(finalize(() => loading.hide()));
};
