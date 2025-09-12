import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

/**
 * Development-only interceptor to short-circuit requests that contain 'dashboard'
 * and return a harmless mocked response to avoid 404 errors during demos.
 */
export const devBlockInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  try {
    const url = req.url || '';
    if (url.toLowerCase().includes('dashboard')) {
      const body = { ok: true, mocked: true };
      const httpResp = new HttpResponse({ status: 200, body });
      return of(httpResp) as Observable<HttpEvent<any>>;
    }
  } catch {
    // fallthrough
  }

  return next(req);
};
