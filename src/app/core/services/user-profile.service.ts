/**
 * ===== USER PROFILE SERVICE =====
 * Servicio específico para gestión de perfil de usuario
 * Cumple con los requirements del checklist de endpoints indispensables
 */

import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, retry, tap } from 'rxjs/operators';

// ===== CONFIGURACIÓN =====
const USER_CONFIG = {
  BASE_URL: 'http://localhost:3001/api/v1',
  ENDPOINTS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    USER_BY_ID: (id: string) => `/users/${id}`,
    CHANGE_PASSWORD: '/users/change-password',
    UPLOAD_AVATAR: '/users/avatar'
  }
};

// ===== INTERFACES =====
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'analyst' | 'onlyView' | 'client';
  permissions: string[];
  organizationId?: string;
  organizationName?: string;
  preferences: {
    language: 'en' | 'es' | 'fr' | 'de';
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      campaigns: boolean;
      reports: boolean;
    };
    dashboard: {
      autoRefresh: boolean;
      refreshInterval: number;
      defaultView: string;
    };
  };
  statistics: {
    campaignsCreated: number;
    totalTweets: number;
    loginCount: number;
    lastLoginAt: Date;
  };
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileRequest {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  preferences?: Partial<UserProfile['preferences']>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: string;
  organizationName?: string;
  isVerified: boolean;
  joinedAt: Date;
  publicStats: {
    campaignsVisible: number;
    tweetsProcessed: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

// ===== SERVICIO =====
@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly http = inject(HttpClient);

  // ===== SIGNALS REACTIVOS =====
  public readonly profile = signal<UserProfile | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly hasChanges = signal<boolean>(false);

  // ===== COMPUTED VALUES =====
  public readonly userInitials = computed(() => {
    const user = this.profile();
    if (!user) return '';
    
    const firstName = user.firstName || user.displayName.split(' ')[0] || '';
    const lastName = user.lastName || user.displayName.split(' ')[1] || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  });

  public readonly fullName = computed(() => {
    const user = this.profile();
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return user.displayName;
  });

  public readonly isAdmin = computed(() => {
    const user = this.profile();
    return user?.role === 'admin';
  });

  public readonly canManageCampaigns = computed(() => {
    const user = this.profile();
    return user?.permissions.includes('campaigns:create') || 
           user?.permissions.includes('campaigns:edit') ||
           user?.role === 'admin';
  });

  public readonly preferredLanguage = computed(() => {
    return this.profile()?.preferences.language || 'es';
  });

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Obtener perfil del usuario autenticado
   * Endpoint: GET /api/v1/users/profile
   */
  public getProfile(): Observable<UserProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<UserProfile>>(
      `${USER_CONFIG.BASE_URL}${USER_CONFIG.ENDPOINTS.PROFILE}`
    ).pipe(
      retry({ count: 2, delay: 1000 }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error obteniendo perfil');
        }
        return response.data;
      }),
      tap(profile => {
        this.profile.set(profile);
        this.hasChanges.set(false);
      }),
      catchError(error => {
        console.error('Error getting user profile:', error);
        this.error.set('Error cargando perfil de usuario');
        
        // Fallback con datos mock
        const mockProfile: UserProfile = {
          id: 'user-123',
          email: 'usuario@ejemplo.com',
          username: 'usuario_demo',
          displayName: 'Usuario Demo',
          firstName: 'Usuario',
          lastName: 'Demo',
          bio: 'Usuario de demostración del sistema',
          role: 'analyst',
          permissions: ['campaigns:view', 'analytics:view', 'users:view'],
          preferences: {
            language: 'es',
            theme: 'light',
            notifications: {
              email: true,
              push: true,
              campaigns: true,
              reports: false
            },
            dashboard: {
              autoRefresh: true,
              refreshInterval: 30000,
              defaultView: 'overview'
            }
          },
          statistics: {
            campaignsCreated: 5,
            totalTweets: 1250,
            loginCount: 42,
            lastLoginAt: new Date()
          },
          isActive: true,
          isVerified: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        };
        
        this.profile.set(mockProfile);
        return of(mockProfile);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Actualizar perfil del usuario
   * Endpoint: PUT /api/v1/users/profile
   */
  public updateProfile(updates: UpdateProfileRequest): Observable<UserProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.put<ApiResponse<UserProfile>>(
      `${USER_CONFIG.BASE_URL}${USER_CONFIG.ENDPOINTS.UPDATE_PROFILE}`,
      updates
    ).pipe(
      retry({ count: 1, delay: 1000 }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error actualizando perfil');
        }
        return response.data;
      }),
      tap(profile => {
        this.profile.set(profile);
        this.hasChanges.set(false);
      }),
      catchError(error => {
        console.error('Error updating user profile:', error);
        this.error.set('Error actualizando perfil');
        
        // En caso de error, intentamos actualizar localmente
        const current = this.profile();
        if (current) {
          const updated: UserProfile = { 
            ...current, 
            ...(updates.displayName && { displayName: updates.displayName }),
            ...(updates.firstName && { firstName: updates.firstName }),
            ...(updates.lastName && { lastName: updates.lastName }),
            ...(updates.bio && { bio: updates.bio }),
            ...(updates.preferences && { 
              preferences: { ...current.preferences, ...updates.preferences }
            }),
            updatedAt: new Date() 
          };
          this.profile.set(updated);
          return of(updated);
        }
        
        throw error;
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Obtener perfil público de un usuario
   * Endpoint: GET /api/v1/users/:id
   */
  public getPublicProfile(userId: string): Observable<PublicUserProfile> {
    return this.http.get<ApiResponse<PublicUserProfile>>(
      `${USER_CONFIG.BASE_URL}${USER_CONFIG.ENDPOINTS.USER_BY_ID(userId)}`
    ).pipe(
      retry({ count: 2, delay: 1000 }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error obteniendo perfil público');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error getting public profile:', error);
        
        // Fallback con datos mock
        const mockPublicProfile: PublicUserProfile = {
          id: userId,
          username: 'usuario_publico',
          displayName: 'Usuario Público',
          bio: 'Perfil público de usuario',
          role: 'analyst',
          isVerified: false,
          joinedAt: new Date('2024-01-01'),
          publicStats: {
            campaignsVisible: 3,
            tweetsProcessed: 450
          }
        };
        
        return of(mockPublicProfile);
      })
    );
  }

  /**
   * Cambiar contraseña del usuario
   * Endpoint: POST /api/v1/users/change-password
   */
  public changePassword(request: ChangePasswordRequest): Observable<boolean> {
    if (request.newPassword !== request.confirmPassword) {
      return of(false).pipe(
        tap(() => this.error.set('Las contraseñas no coinciden'))
      );
    }

    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<ApiResponse<{ success: boolean }>>(
      `${USER_CONFIG.BASE_URL}${USER_CONFIG.ENDPOINTS.CHANGE_PASSWORD}`,
      {
        currentPassword: request.currentPassword,
        newPassword: request.newPassword
      }
    ).pipe(
      retry({ count: 1, delay: 1000 }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error cambiando contraseña');
        }
        return response.data.success;
      }),
      catchError(error => {
        console.error('Error changing password:', error);
        this.error.set('Error cambiando contraseña');
        return of(false);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Subir avatar del usuario
   * Endpoint: POST /api/v1/users/avatar
   */
  public uploadAvatar(file: File): Observable<string> {
    this.isLoading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<ApiResponse<{ avatarUrl: string }>>(
      `${USER_CONFIG.BASE_URL}${USER_CONFIG.ENDPOINTS.UPLOAD_AVATAR}`,
      formData
    ).pipe(
      retry({ count: 1, delay: 1000 }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Error subiendo avatar');
        }
        return response.data.avatarUrl;
      }),
      tap(avatarUrl => {
        const current = this.profile();
        if (current) {
          this.profile.set({
            ...current,
            avatar: avatarUrl,
            updatedAt: new Date()
          });
        }
      }),
      catchError(error => {
        console.error('Error uploading avatar:', error);
        this.error.set('Error subiendo imagen');
        return of('');
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Marcar que hay cambios pendientes
   */
  public markAsChanged(): void {
    this.hasChanges.set(true);
  }

  /**
   * Limpiar errores
   */
  public clearError(): void {
    this.error.set(null);
  }

  /**
   * Limpiar estado
   */
  public clearProfile(): void {
    this.profile.set(null);
    this.error.set(null);
    this.hasChanges.set(false);
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  public hasPermission(permission: string): boolean {
    const user = this.profile();
    if (!user) return false;
    
    // Admin tiene todos los permisos
    if (user.permissions.includes('*')) return true;
    
    return user.permissions.includes(permission);
  }

  /**
   * Verificar si el usuario tiene alguno de los permisos
   */
  public hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Obtener rol traducido
   */
  public getRoleDisplayName(role?: string): string {
    const roleToCheck = role || this.profile()?.role;
    
    switch (roleToCheck) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'analyst': return 'Analista';
      case 'onlyView': return 'Solo Lectura';
      case 'client': return 'Cliente';
      default: return 'Usuario';
    }
  }

  /**
   * Validar datos del perfil
   */
  public validateProfile(profile: Partial<UpdateProfileRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (profile.displayName && profile.displayName.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (profile.bio && profile.bio.length > 500) {
      errors.push('La biografía no puede exceder 500 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
