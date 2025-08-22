import { Injectable, computed, signal, inject } from '@angular/core';
import { AuthService, User } from '../auth/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SessionState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SessionStore {
  private authService = inject(AuthService);

  // Private signals for internal state management
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals - readonly access for components
  readonly user = computed(() => this._user());
  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // Computed derived state
  readonly userRole = computed(() => this._user()?.role);
  readonly userPermissions = computed(() => this._user()?.permissions || []);
  readonly isAdmin = computed(() => this.userRole() === 'admin');
  readonly isManager = computed(() => ['admin', 'manager'].includes(this.userRole() || ''));
  readonly organizationId = computed(() => this._user()?.organizationId);
  readonly hasOrganization = computed(() => !!this.organizationId());
  readonly userDisplayName = computed(() => {
    const user = this._user();
    return user?.displayName || user?.username || user?.email || 'Unknown User';
  });

  // Complete session state as computed
  readonly state = computed<SessionState>(() => ({
    user: this._user(),
    token: this._token(),
    isAuthenticated: this._isAuthenticated(),
    loading: this._loading(),
    error: this._error()
  }));

  constructor() {
    // Sync with AuthService signals
    this.syncWithAuthService();
  }

  // Actions - methods that update the store state
  login(credentials: { email: string; password: string }) {
    this._loading.set(true);
    this._error.set(null);

    this.authService.login(credentials).subscribe({
      next: (user) => {
        this._user.set(user);
        this._token.set(this.authService.token());
        this._isAuthenticated.set(true);
        this._loading.set(false);
        this._error.set(null);
      },
      error: (error) => {
        this._user.set(null);
        this._token.set(null);
        this._isAuthenticated.set(false);
        this._loading.set(false);
        this._error.set(error.message || 'Login failed');
      }
    });
  }

  register(credentials: { 
    email: string; 
    username: string; 
    displayName: string; 
    password: string; 
    organizationId?: string; 
  }) {
    this._loading.set(true);
    this._error.set(null);

    this.authService.register(credentials).subscribe({
      next: (user) => {
        this._user.set(user);
        this._token.set(this.authService.token());
        this._isAuthenticated.set(true);
        this._loading.set(false);
        this._error.set(null);
      },
      error: (error) => {
        this._user.set(null);
        this._token.set(null);
        this._isAuthenticated.set(false);
        this._loading.set(false);
        this._error.set(error.message || 'Registration failed');
      }
    });
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
    this._isAuthenticated.set(false);
    this._loading.set(false);
    this._error.set(null);
    this.authService.logout();
  }

  clearError() {
    this._error.set(null);
  }

  updateUser(user: User) {
    this._user.set(user);
  }

  // Permission checking utilities
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return this.authService.hasAnyPermission(permissions);
  }

  hasAllPermissions(permissions: string[]): boolean {
    return this.authService.hasAllPermissions(permissions);
  }

  hasRole(role: User['role']): boolean {
    return this.authService.hasRole(role);
  }

  // Private method to sync with AuthService
  private syncWithAuthService() {
    // Subscribe to AuthService signals and update store accordingly
    // This ensures the store stays in sync with the auth service
    
    // Initial sync
    this._user.set(this.authService.currentUser());
    this._token.set(this.authService.token());
    this._isAuthenticated.set(this.authService.isAuthenticated());
    this._loading.set(this.authService.isLoading());
    this._error.set(this.authService.error());

    // Note: Since signals don't have a subscribe method, we'll need to use effect
    // or rely on the components to react to the AuthService signals directly
    // This is a design decision - we could also make AuthService emit observables
  }
}
