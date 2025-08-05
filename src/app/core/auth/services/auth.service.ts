import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, map, retry, tap } from 'rxjs/operators';

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
  role: 'admin' | 'manager' | 'analyst' | 'onlyView' | 'client';
  permissions: string[];
  organizationId?: string;
  isActive: boolean;
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
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private tokenRefreshTimer?: ReturnType<typeof setTimeout>;

  // ===== SIGNALS PÚBLICOS =====
  public readonly isAuthenticated = signal<boolean>(false);
  public readonly currentUser = signal<User | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly token = signal<string | null>(null);
  public readonly tokenExpiry = signal<Date | null>(null);

  // Computed values
  public readonly userRole = computed(() => this.currentUser()?.role);
  public readonly userPermissions = computed(() => this.currentUser()?.permissions || []);
  public readonly isAdmin = computed(() => this.userRole() === 'admin');
  public readonly isManager = computed(() => ['admin', 'manager'].includes(this.userRole() || ''));
  public readonly organizationId = computed(() => this.currentUser()?.organizationId);
  public readonly hasOrganization = computed(() => !!this.organizationId());

  constructor() {
    // Inicializar estado desde localStorage
    this.initializeFromStorage();

    // Configurar refresh automático del token
    this.setupTokenRefresh();

    // Limpiar recursos al destruir
    this.destroyRef.onDestroy(() => {
      this.clearTokenRefreshTimer();
    });
  }

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
          console.log('Authentication error details:', error);

          // Detectar si el backend no está disponible o hay problemas de autenticación
          const isBackendUnavailable = (
            error.status === 0 ||           // Sin conexión
            error.status === 404 ||         // Endpoint no encontrado
            error.status === 500 ||         // Error interno del servidor
            error.status === 401 ||         // No autorizado (para pruebas mock)
            error.status === 502 ||         // Bad Gateway
            error.status === 503 ||         // Service Unavailable
            !error.status ||                // Sin status (error de red)
            error.name === 'HttpErrorResponse' && !error.url // Error de conectividad
          );

          if (isBackendUnavailable) {
            console.warn('🔄 Backend no disponible, usando autenticación mock para desarrollo');
            return this.mockLogin(credentials);
          }

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
    const refreshToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      this.logout();
      return of(false);
    }

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
      }),
      map(() => true),
      catchError(error => {
        console.error('Error renovando token:', error);
        this.logout();
        return of(false);
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
  }

  private setupTokenRefresh(): void {
    // Verificar cada minuto si necesitamos renovar el token
    timer(0, 60000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const expiry = this.tokenExpiry();
        if (expiry && this.isAuthenticated()) {
          const timeUntilExpiry = expiry.getTime() - Date.now();

          // Si faltan menos de 5 minutos para expirar, renovar
          if (timeUntilExpiry < AUTH_CONFIG.TOKEN_REFRESH_BUFFER) {
            this.refreshToken().subscribe();
          }
        }
      });
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

    if (error.status === 401) {
      errorMessage = 'Credenciales inválidas';
    } else if (error.status === 403) {
      errorMessage = 'Acceso denegado';
    } else if (error.status === 404) {
      errorMessage = 'Usuario no encontrado';
    } else if (error.status === 422) {
      errorMessage = 'Datos inválidos';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.error.set(errorMessage);
    console.error('Error de autenticación:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Mock login para desarrollo cuando el backend no está disponible
   */
  private mockLogin(credentials: LoginRequest): Observable<User> {
    console.log('🚀 Iniciando mock login con credenciales:', credentials);

    // Validar credenciales mock
    const validCredentials = [
      { email: 'admin@sentimentalsocial.com', password: 'admin123', role: 'admin' as const },
      { email: 'manager@sentimentalsocial.com', password: 'manager123', role: 'manager' as const },
      { email: 'analyst@sentimentalsocial.com', password: 'analyst123', role: 'analyst' as const },
      { email: 'demo@sentimentalsocial.com', password: 'demo123', role: 'client' as const }
    ];

    const validCred = validCredentials.find(
      cred => cred.email === credentials.email && cred.password === credentials.password
    );

    if (!validCred) {
      console.error('❌ Credenciales mock inválidas:', credentials);
      this.error.set('Credenciales inválidas para desarrollo');
      return throwError(() => new Error('Credenciales inválidas'));
    }

    console.log('✅ Credenciales mock válidas, creando usuario:', validCred.role);

    // Crear usuario mock
    const mockUser: User = {
      id: `mock-${validCred.role}-001`,
      email: validCred.email,
      username: validCred.role,
      displayName: `${validCred.role.charAt(0).toUpperCase() + validCred.role.slice(1)} User`,
      role: validCred.role,
      permissions: this.getMockPermissions(validCred.role),
      organizationId: 'mock-org-001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Crear token mock
    const mockToken = `mock-token-${Date.now()}`;
    const mockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Simular autenticación exitosa
    this.currentUser.set(mockUser);
    this.token.set(mockToken);
    this.tokenExpiry.set(mockExpiry);
    this.isAuthenticated.set(true);

    // Guardar en localStorage
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(mockUser));

    console.log('🚀 Mock authentication completada exitosamente:', mockUser);
    console.log('🔑 Token mock guardado:', mockToken);

    // Limpiar cualquier error previo
    this.error.set(null);

    return of(mockUser);
  }

  /**
   * Obtener permisos mock según el rol
   */
  private getMockPermissions(role: User['role']): string[] {
    switch (role) {
      case 'admin':
        return ['*']; // Todos los permisos
      case 'manager':
        return [
          PERMISSIONS.CAMPAIGNS_CREATE,
          PERMISSIONS.CAMPAIGNS_EDIT,
          PERMISSIONS.CAMPAIGNS_VIEW,
          PERMISSIONS.CAMPAIGNS_DELETE,
          PERMISSIONS.CAMPAIGNS_CONTROL,
          PERMISSIONS.ANALYTICS_VIEW,
          PERMISSIONS.ANALYTICS_EXPORT,
          PERMISSIONS.ANALYTICS_ADVANCED,
          PERMISSIONS.USERS_VIEW,
          PERMISSIONS.ORG_MANAGE
        ];
      case 'analyst':
        return [
          PERMISSIONS.CAMPAIGNS_VIEW,
          PERMISSIONS.CAMPAIGNS_CONTROL,
          PERMISSIONS.ANALYTICS_VIEW,
          PERMISSIONS.ANALYTICS_EXPORT,
          PERMISSIONS.ANALYTICS_ADVANCED
        ];
      case 'onlyView':
        return [
          PERMISSIONS.CAMPAIGNS_VIEW,
          PERMISSIONS.ANALYTICS_VIEW
        ];
      case 'client':
        return [
          PERMISSIONS.CAMPAIGNS_VIEW,
          PERMISSIONS.ANALYTICS_VIEW
        ];
      default:
        return [];
    }
  }
}
