import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, retry, tap } from 'rxjs/operators';
import { loadCurrentUser } from '../../state/auth.actions';

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
const AUTH_CONFIG = {
  BASE_URL: 'http://localhost:3001/api/v1',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout'
  },
  STORAGE_KEYS: {
    TOKEN: 'sentimental_token',
    REFRESH_TOKEN: 'sentimental_refresh_token',
    USER: 'sentimental_user'
  },
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000 // 5 minutos antes de expirar
};

// ===== INTERFACES =====
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string | null;
  role: 'admin' | 'manager' | 'analyst' | 'onlyView' | 'client';
  permissions: string[];
  organizationId?: string;
  organizationName?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
  organizationId?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
}

export interface RefreshResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: number;
  };
  message?: string;
}

// ===== SISTEMA DE PERMISOS =====
export const PERMISSIONS = {
  // Campañas
  CAMPAIGNS_CREATE: 'campaigns:create',
  CAMPAIGNS_EDIT: 'campaigns:edit',
  CAMPAIGNS_VIEW: 'campaigns:view',
  CAMPAIGNS_DELETE: 'campaigns:delete',
  CAMPAIGNS_CONTROL: 'campaigns:control',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ADVANCED: 'analytics:advanced',

  // Usuarios
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_VIEW: 'users:view',
  USERS_DELETE: 'users:delete',

  // Sistema
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_SETTINGS: 'system:settings',

  // Organizaciones
  ORG_MANAGE: 'organization:manage',
  ORG_VIEW: 'organization:view'
} as const;

// ===== SERVICIO DE AUTENTICACIÓN =====
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http: HttpClient;
  private readonly httpBackend = inject(HttpBackend);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);

  private tokenRefreshTimer?: ReturnType<typeof setTimeout>;
  private isRefreshingToken = false; // Flag para evitar múltiples refreshes simultáneos

  // ===== SIGNALS PÚBLICOS =====
  public readonly isAuthenticated = signal<boolean>(false);
  public readonly currentUser = signal<User | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly token = signal<string | null>(null);
  public readonly tokenExpiry = signal<Date | null>(null);

  constructor() {
    // Crear HttpClient sin interceptores para evitar dependencia circular
    this.http = new HttpClient(this.httpBackend);

    // Inicializar estado desde localStorage
    this.initializeFromStorage();

    // Configurar refresh automático del token
    this.setupTokenRefresh();

    // Limpiar recursos al destruir
    this.destroyRef.onDestroy(() => {
      this.clearTokenRefreshTimer();
    });
  }

  // Computed values
  public readonly userRole = computed(() => this.currentUser()?.role);
  public readonly userPermissions = computed(() => this.currentUser()?.permissions || []);
  public readonly isAdmin = computed(() => this.userRole() === 'admin');
  public readonly isManager = computed(() => ['admin', 'manager'].includes(this.userRole() || ''));
  public readonly organizationId = computed(() => this.currentUser()?.organizationId);
  public readonly hasOrganization = computed(() => !!this.organizationId());

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Iniciar sesión
   */
  public login(credentials: LoginRequest): Observable<User> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<LoginResponse>(`${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.LOGIN}`, credentials)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Error en el login');
          }
          return response.data;
        }),
        tap(authData => {
          this.handleSuccessfulAuthentication(authData);
        }),
        map(authData => authData.user),
        retry(1),
        catchError(error => {
          console.error('Authentication error details:', error);
          return this.handleAuthError(error);
        }),
        finalize(() => this.isLoading.set(false))
      );
  }

  /**
   * Registrar nuevo usuario
   */
  public register(credentials: RegisterRequest): Observable<User> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<LoginResponse>(`${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.REGISTER}`, credentials)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Error en el registro');
          }
          return response.data;
        }),
        tap(authData => {
          this.handleSuccessfulAuthentication(authData);
        }),
        map(authData => authData.user),
        catchError(this.handleAuthError.bind(this)),
        finalize(() => this.isLoading.set(false))
      );
  }

  /**
   * Cerrar sesión
   */
  public logout(): void {
    // Limpiar storage
    this.clearStorage();

    // Limpiar estado
    this.clearAuthState();

    // Limpiar timer de refresh
    this.clearTokenRefreshTimer();

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Renovar token
   */
  public refreshToken(): Observable<boolean> {
    // Evitar múltiples refreshes simultáneos
    if (this.isRefreshingToken) {
      console.log('🔄 Token refresh ya en progreso, saltando...');
      return of(false);
    }

    const refreshToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      this.logout();
      return of(false);
    }

    this.isRefreshingToken = true;
    console.log('🔄 Iniciando refresh de token...');

    return this.http.post<RefreshResponse>(`${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.REFRESH}`, {
      refreshToken
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error renovando token');
        }
        return response.data;
      }),
      tap(tokenData => {
        // Actualizar token
        this.token.set(tokenData.token);
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, tokenData.token);

        // Actualizar expiración
        const expiry = new Date(Date.now() + tokenData.expiresIn * 1000);
        this.tokenExpiry.set(expiry);

        // Reprogramar refresh
        this.scheduleTokenRefresh(expiry);

        console.log('✅ Token refreshed exitosamente. Nueva expiración:', expiry.toLocaleTimeString());
      }),
      map(() => true),
      catchError(error => {
        console.error('Error renovando token:', error);
        this.logout();
        return of(false);
      }),
      finalize(() => {
        this.isRefreshingToken = false; // Liberar flag
      })
    );
  }

  // ===== MÉTODOS DE PERMISOS =====

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  public hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Admin tiene todos los permisos
    if (user.permissions.includes('*')) return true;

    // Verificar permiso específico
    return user.permissions.includes(permission);
  }

  /**
   * Verificar si el usuario tiene alguno de los permisos
   */
  public hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verificar si el usuario tiene todos los permisos
   */
  public hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Verificar si el usuario tiene el rol especificado o superior
   */
  public hasRole(role: User['role']): boolean {
    const currentRole = this.userRole();
    if (!currentRole) return false;

    const roleHierarchy: User['role'][] = ['client', 'onlyView', 'analyst', 'manager', 'admin'];
    const currentIndex = roleHierarchy.indexOf(currentRole);
    const requiredIndex = roleHierarchy.indexOf(role);

    return currentIndex >= requiredIndex;
  }

  // ===== MÉTODOS PRIVADOS =====

  private initializeFromStorage(): void {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      const userJson = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER);

      if (token && refreshToken && userJson) {
        const user: User = JSON.parse(userJson);

        // Verificar si el token no ha expirado
        const tokenPayload = this.parseJWT(token);
        if (tokenPayload && tokenPayload.exp * 1000 > Date.now()) {
          this.currentUser.set(user);
          this.token.set(token);
          this.isAuthenticated.set(true);

          const expiry = new Date(tokenPayload.exp * 1000);
          this.tokenExpiry.set(expiry);
          this.scheduleTokenRefresh(expiry);
        } else {
          // Token expirado, intentar renovar
          this.refreshToken().subscribe();
        }
      }
    } catch (error) {
      console.error('Error inicializando desde storage:', error);
      this.clearStorage();
    }
  }

  private handleSuccessfulAuthentication(authData: LoginResponse['data']): void {
    // Actualizar signals
    this.currentUser.set(authData.user);
    this.token.set(authData.token);
    this.isAuthenticated.set(true);

    // Calcular expiración
    const expiry = new Date(Date.now() + authData.expiresIn * 1000);
    this.tokenExpiry.set(expiry);

    // Guardar en localStorage
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, authData.token);
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(authData.user));

    // Programar refresh del token
    this.scheduleTokenRefresh(expiry);

    // Disparar carga del perfil desde el backend y guardarlo en el store
    try {
      this.store.dispatch(loadCurrentUser());
    } catch (e) {
      // Si Store no está disponible (dependencias no instaladas), ignorar silenciosamente
      console.warn('Store dispatch skipped:', e);
    }
  }

  private setupTokenRefresh(): void {
    // DESACTIVADO: Token refresh automático para evitar saturación del backend
    // Solo haremos refresh cuando sea absolutamente necesario (manual o al hacer peticiones)
    console.log('  Token refresh automático DESACTIVADO para evitar saturación del backend');

    // Comentado temporalmente:
    // timer(0, 120000) // Cambiado de 60000 a 120000 (2 minutos)
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(() => {
    //     const expiry = this.tokenExpiry();
    //     if (expiry && this.isAuthenticated()) {
    //       const timeUntilExpiry = expiry.getTime() - Date.now();
    //       if (timeUntilExpiry < AUTH_CONFIG.TOKEN_REFRESH_BUFFER) {
    //         console.log('🔄 Token refresh necesario. Tiempo restante:', Math.round(timeUntilExpiry / 60000), 'minutos');
    //         this.refreshToken().subscribe();
    //       }
    //     }
    //   });
  }

  private scheduleTokenRefresh(expiry: Date): void {
    this.clearTokenRefreshTimer();

    const timeUntilRefresh = expiry.getTime() - Date.now() - AUTH_CONFIG.TOKEN_REFRESH_BUFFER;

    if (timeUntilRefresh > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, timeUntilRefresh);
    }
  }

  private clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = undefined;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER);
  }

  private clearAuthState(): void {
    this.currentUser.set(null);
    this.token.set(null);
    this.tokenExpiry.set(null);
    this.isAuthenticated.set(false);
    this.error.set(null);
  }

  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error de autenticación';
    switch (error.status) {
      case 400:
        errorMessage = 'Solicitud incorrecta. Verifique sus datos.';
        break;
      case 401:
        errorMessage = 'Credenciales inválidas';
        break;
      case 403:
        errorMessage = 'Acceso denegado';
        break;
      case 404:
        errorMessage = 'Usuario no encontrado';
        break;
      case 422:
        errorMessage = 'Datos inválidos';
        break;
      case 429:
        errorMessage = 'Demasiadas peticiones. Intente nuevamente en unos momentos';
        console.warn('Rate limit alcanzado. Considere implementar throttling.');
        break;
      case 500:
        errorMessage = 'Error interno del servidor';
        break;
      default:
        errorMessage = error.error?.message || 'Error desconocido';
    }

    this.error.set(errorMessage);
    console.error('Error de autenticación:', error);
    return throwError(() => new Error(errorMessage));
  }
}
