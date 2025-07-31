import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorHandlingInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error de forma segura (sin exponer datos sensibles)
      const safeError = {
        status: error.status,
        statusText: error.statusText,
        url: error.url?.replace(/\/api\/.*/, '/api/[HIDDEN]'), // Ocultar rutas de API
        timestamp: new Date().toISOString()
      };
      
      console.error('HTTP Error (Safe):', safeError);

      // Manejo específico de errores de seguridad
      switch (error.status) {
        case 401:
          // Token inválido o expirado
          localStorage.clear();
          sessionStorage.clear();
          router.navigate(['/login'], { 
            queryParams: { reason: 'unauthorized' } 
          });
          break;
          
        case 403:
          // Acceso denegado
          router.navigate(['/access-denied']);
          break;
          
        case 429:
          // Rate limiting
          console.warn('Rate limit exceeded. Please try again later.');
          break;
          
        case 0:
          // Error de red o CORS
          console.error('Network error. Check your connection.');
          break;
          
        default:
          // Error genérico sin exponer detalles
          console.error('An error occurred. Please try again.');
      }

      // Retornar error sanitizado
      const sanitizedError = new HttpErrorResponse({
        error: 'An error occurred',
        status: error.status,
        statusText: error.statusText,
        url: req.url
      });

      return throwError(() => sanitizedError);
    })
  );
};
