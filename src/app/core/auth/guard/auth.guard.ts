import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, PERMISSIONS } from '../services/auth.service';

/**
 * Guard funcional para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    // Guardar la URL intentada para redirigir después del login
    localStorage.setItem('redirectUrl', state.url);
    router.navigate(['/login']);
    return false;
  }

  return true;
};

/**
 * Guard para verificar roles específicos
 */
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      localStorage.setItem('redirectUrl', state.url);
      router.navigate(['/login']);
      return false;
    }

    if (!authService.hasRole(requiredRole as any)) {
      router.navigate(['/dashboard']); // Redirigir a dashboard si no tiene el rol
      return false;
    }

    return true;
  };
};

/**
 * Guard para verificar permisos específicos
 */
export const permissionGuard = (requiredPermissions: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      localStorage.setItem('redirectUrl', state.url);
      router.navigate(['/login']);
      return false;
    }

    if (!authService.hasAllPermissions(requiredPermissions)) {
      router.navigate(['/dashboard']); // Redirigir a dashboard si no tiene permisos
      return false;
    }

    return true;
  };
};

// ===== GUARDS ESPECÍFICOS PARA LA APLICACIÓN =====

/**
 * Guard para rutas de administración (solo admin)
 */
export const adminGuard: CanActivateFn = roleGuard('admin');

/**
 * Guard para rutas de gestión (admin o manager)
 */
export const managerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    localStorage.setItem('redirectUrl', state.url);
    router.navigate(['/login']);
    return false;
  }

  if (!authService.hasRole('manager')) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

/**
 * Guard para gestión de campañas
 */
export const campaignManagementGuard: CanActivateFn = permissionGuard([
  PERMISSIONS.CAMPAIGNS_CREATE,
  PERMISSIONS.CAMPAIGNS_EDIT
]);

/**
 * Guard para analytics avanzados
 */
export const advancedAnalyticsGuard: CanActivateFn = permissionGuard([
  PERMISSIONS.ANALYTICS_ADVANCED
]);

/**
 * Guard para gestión de usuarios
 */
export const userManagementGuard: CanActivateFn = permissionGuard([
  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_EDIT
]);
