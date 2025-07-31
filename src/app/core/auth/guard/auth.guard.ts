import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ Auth Guard activated for:', state.url);
  console.log('🔍 Is authenticated:', authService.isAuthenticated());
  console.log('🎫 Current token:', authService.getToken());

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    console.log('✅ User is authenticated, checking token expiration...');
    
    // Check if token is expired
    if (authService.isTokenExpired()) {
      console.log('❌ Token is expired, logging out...');
      authService.logout();
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url, reason: 'expired' } 
      });
      return false;
    }
    
    console.log('✅ Token is valid, allowing access');
    return true;
  }

  // User is not authenticated, redirect to login
  console.log('❌ User not authenticated, redirecting to login...');
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};