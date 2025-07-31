import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // List of URLs that don't require authentication
  const publicUrls = [
    '/api/v1/auth/login', 
    '/api/v1/auth/register', 
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password'
  ];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  let authReq = req;

  // Add authorization header if user is authenticated and it's not a public URL
  if (!isPublicUrl && authService.isAuthenticated()) {
    const token = authService.getToken();
    
    if (token) {
      // Check if token is expired before adding it
      if (authService.isTokenExpired()) {
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('Token expired'));
      }

      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // Handle the request and catch HTTP errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      // Handle different types of HTTP errors
      switch (error.status) {
        case 401:
          // Unauthorized - token might be invalid or expired
          errorMessage = 'Authentication failed. Please login again.';
          authService.logout();
          router.navigate(['/login']);
          break;
        
        case 403:
          // Forbidden - user doesn't have permission
          errorMessage = 'Access denied. You don\'t have permission to perform this action.';
          break;
        
        case 404:
          // Not Found
          errorMessage = 'The requested resource was not found.';
          break;
        
        case 422:
          // Validation error
          errorMessage = error.error?.message || 'Validation error occurred.';
          break;
        
        case 500:
          // Server error
          errorMessage = 'Server error. Please try again later.';
          break;
        
        case 0:
          // Network error
          errorMessage = 'Network error. Please check your connection.';
          break;
        
        default:
          // Generic error handling
          errorMessage = error.error?.message || error.message || errorMessage;
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url,
        method: req.method,
        error: error.error
      });

      return throwError(() => error);
    })
  );
};
