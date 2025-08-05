import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional para manejar autenticación JWT
 * Agrega automáticamente el token a las peticiones y maneja la renovación
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  // URLs que no requieren autenticación
  const publicUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  // Si es una URL pública, continuar sin token
  if (isPublicUrl) {
    return next(req);
  }

  // Obtener token actual
  const token = authService.token();

  // Si no hay token y no es URL pública, dejar pasar (el backend manejará el 401)
  if (!token) {
    return next(req);
  }

  // Clonar request y agregar token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Enviar request con token
  return next(authReq).pipe(
    catchError(error => {
      // Si es error 401 (token expirado), intentar renovar
      if (error.status === 401 && authService.isAuthenticated()) {
        return authService.refreshToken().pipe(
          switchMap(success => {
            if (success) {
              // Token renovado, reintentar request original con nuevo token
              const newToken = authService.token();
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                }
              });
              return next(retryReq);
            } else {
              // No se pudo renovar, logout automático
              authService.logout();
              return throwError(() => error);
            }
          }),
          catchError(() => {
            // Error renovando token, logout
            authService.logout();
            return throwError(() => error);
          })
        );
      }

      // Para otros errores, simplemente propagarlos
      return throwError(() => error);
    })
  );
};
