import { HttpInterceptorFn } from '@angular/common/http';

export const securityHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  // Agregar headers de seguridad a todas las peticiones
  const secureReq = req.clone({
    setHeaders: {
      // Prevenir ataques MIME sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevenir ataques de clickjacking
      'X-Frame-Options': 'DENY',
      
      // Activar protección XSS del navegador
      'X-XSS-Protection': '1; mode=block',
      
      // Forzar HTTPS (solo en producción)
      ...(window.location.protocol === 'https:' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }),
      
      // Política de referrer
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });

  return next(secureReq);
};
