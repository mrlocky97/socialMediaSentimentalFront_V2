import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    // Check if token is expired
    if (authService.isTokenExpired()) {
      authService.logout();
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url, reason: 'expired' } 
      });
      return false;
    }
    return true;
  }

  // User is not authenticated, redirect to login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};