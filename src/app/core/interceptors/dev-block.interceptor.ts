import { HttpHandlerFn, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { of, Observable } from 'rxjs';

/**
 * Development-only interceptor to short-circuit requests that contain 'dashboard'
 * and return a harmless mocked response to avoid 404 errors during demos.
 */
export const devBlockInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  try {
    const url = req.url || '';
    if (url.toLowerCase().includes('dashboard')) {
      const body = { ok: true, mocked: true };
      // Debug log
      // eslint-disable-next-line no-console
      console.debug('[devBlockInterceptor] short-circuiting request to', url);
      const httpResp = new HttpResponse({ status: 200, body });
      return of(httpResp) as Observable<HttpEvent<any>>;
    }
  } catch {
    // fallthrough
  }

  return next(req);
};
