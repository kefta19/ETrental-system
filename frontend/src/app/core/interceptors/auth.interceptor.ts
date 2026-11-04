import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TimeoutError, catchError, retry, throwError, timer, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const nextWithRequestTimeout: typeof next = request => {
    const response = next(request);
    if (request.method !== 'GET' || !request.url.startsWith(API_BASE_URL)) {
      return response;
    }

    return response.pipe(
      timeout({ first: 15000 }),
      retry({
        count: 1,
        delay: error => error instanceof TimeoutError ? timer(500) : throwError(() => error)
      }),
      catchError(error => {
        if (!(error instanceof TimeoutError)) return throwError(() => error);

        return throwError(() => new HttpErrorResponse({
          error: { errors: ['The server did not respond in time. Please retry.'] },
          status: 0,
          statusText: 'Request Timeout',
          url: request.url
        }));
      })
    );
  };

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return nextWithRequestTimeout(cloned);
  }

  return nextWithRequestTimeout(req);
};
