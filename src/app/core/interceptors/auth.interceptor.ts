import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

const excludedEndpoints = ['/api/auth/login'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const isExcluded = excludedEndpoints.some(endpoint =>
    req.url.endsWith(endpoint)
  );

  // attach access token to request if it exists and endpoint is not excluded
  const accessToken = tokenService.getAccessToken();
  let request = req;
  if (accessToken && !isExcluded) {
    request = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // no refresh endpoint on this API: an expired or invalid token ends the session
      if (error.status === 401 && !isExcluded) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );

};