import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthState, LoginRequest, LoginResponse, UserInfo } from '../model/auth.model';
import { environment } from '../../../../enviroments/environment';
import { SecureStorageService } from '../../services/secure-storage.service';
import { InputSanitizerService } from '../../services/input-sanitizer.service';
import { SessionTimeoutService } from '../../services/session-timeout.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Inyectamos dependencias
  private http = inject(HttpClient);
  private router = inject(Router);
  private secureStorage = inject(SecureStorageService);
  private inputSanitizer = inject(InputSanitizerService);
  private sessionTimeout = inject(SessionTimeoutService);

  // Usamos signals para manejar el estado de autenticación de manera reactiva
  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  // Computed signals for easy access
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly currentUser = computed(() => this.authState().user);
  readonly token = computed(() => this.authState().token);

  constructor() {
    this.loadAuthState();
    
    // Configurar callback de logout para SessionTimeoutService
    this.sessionTimeout.setLogoutCallback(() => this.logout());
    
    // Suscribirse a eventos de logout del SessionTimeout
    this.sessionTimeout.logoutRequested$.subscribe(() => {
      // Realizar logout silencioso (ya manejado por el callback)
      console.log('Session timeout logout requested');
    });
    
    // Effect to sync with secure storage whenever auth state changes
    effect(() => {
      const state = this.authState();
      if (state.isAuthenticated && state.token && state.user) {
        this.secureStorage.setToken(state.token);
        this.secureStorage.setUserInfo(state.user);
      }
    });
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Sanitizar entradas
    const sanitizedEmail = this.inputSanitizer.sanitizeText(credentials.username);
    const sanitizedPassword = credentials.password; // No sanitizar password para preservar caracteres especiales
    
    // Validar email
    if (!this.inputSanitizer.isValidEmail(sanitizedEmail)) {
      return throwError(() => new Error('Invalid email format'));
    }

    const loginData = {
      email: sanitizedEmail,
      password: sanitizedPassword
    };

    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/login`, loginData)
      .pipe(
        tap(response => {
          console.log('Login response:', response); // Debug log
          console.log('Access token:', response.data.accessToken); // Debug log
          this.setAuthState(response.data.accessToken, response.data.user, response.data.refreshToken);
          console.log('Auth state updated, navigating to dashboard...'); // Debug log
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: { email: string; password: string; firstName?: string; lastName?: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/register`, userData)
      .pipe(
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  logoutFromServer(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/logout`, {})
      .pipe(
        tap(() => {
          this.logout(); // Call local logout after server logout
        }),
        catchError(error => {
          console.error('Server logout error:', error);
          this.logout(); // Still logout locally even if server fails
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/refresh`, {})
      .pipe(
        tap(response => {
          if (response.data && response.data.accessToken) {
            const currentUser = this.currentUser();
            if (currentUser) {
              this.setAuthState(response.data.accessToken, currentUser);
            }
          }
        }),
        catchError(error => {
          console.error('Token refresh error:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return throwError(() => error);
        })
      );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/reset-password`, { 
      token, 
      newPassword 
    })
      .pipe(
        catchError(error => {
          console.error('Reset password error:', error);
          return throwError(() => error);
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/change-password`, { 
      currentPassword, 
      newPassword 
    })
      .pipe(
        catchError(error => {
          console.error('Change password error:', error);
          return throwError(() => error);
        })
      );
  }

  verifyToken(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/${environment.apiVersion}/auth/verify-token`, {})
      .pipe(
        catchError(error => {
          console.error('Token verification error:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Limpiar storage seguro
    this.secureStorage.removeToken();
    this.secureStorage.removeUser();
    
    // Detener timeout de sesión
    this.sessionTimeout.stopSession();
    
    this.authState.set({
      isAuthenticated: false,
      user: null,
      token: null
    });
    this.router.navigate(['/login']);
  }

  private setAuthState(token: string, user: any, refreshToken?: string): void {
    console.log('Setting auth state with token:', token); // Debug log
    console.log('Setting auth state with user:', user); // Debug log
    
    const userInfo: UserInfo = {
      email: user.email,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      id: user.id,
      permissions: user.permissions
    };

    // Guardar usando secure storage
    this.secureStorage.setToken(token);
    this.secureStorage.setUserInfo(userInfo);
    if (refreshToken) {
      this.secureStorage.setRefreshToken(refreshToken);
    }
    console.log('Saved to secure storage - Token exists:', !!this.secureStorage.getToken()); // Debug log

    // Actualizar el signal
    this.authState.set({
      isAuthenticated: true,
      user: userInfo,
      token
    });
    
    // Iniciar timeout de sesión
    this.sessionTimeout.startSession();
    
    console.log('Auth state signal updated:', this.authState()); // Debug log
  }

  private loadAuthState(): void {
    console.log('🔄 Loading auth state from secure storage...');
    const token = this.secureStorage.getToken();
    const user = this.secureStorage.getUserInfo();
    
    console.log('📦 Token from secure storage:', !!token);
    console.log('👤 User from secure storage:', !!user);

    if (token && user) {
      try {
        this.authState.set({
          isAuthenticated: true,
          user,
          token
        });
        
        // Reiniciar timeout de sesión al cargar estado existente
        this.sessionTimeout.startSession();
        
        console.log('✅ Auth state loaded successfully:', this.authState());
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        this.logout();
      }
    } else {
      console.log('❌ No auth data found in localStorage');
      this.authState.set({
        isAuthenticated: false,
        user: null,
        token: null
      });
    }
  }

  // Método para obtener el token para los interceptors
  getToken(): string | null {
    return this.token();
  }

  // Backward compatibility
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  // Update user info
  updateUserInfo(userInfo: Partial<UserInfo>): void {
    const currentState = this.authState();
    if (currentState.user) {
      this.authState.update(state => ({
        ...state,
        user: { ...state.user!, ...userInfo }
      }));
    }
  }

  // Check if token is expired (basic implementation)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch {
      return true;
    }
  }

  // Refresh authentication state
  refreshAuthState(): void {
    if (this.isTokenExpired()) {
      this.logout();
    }
  }
}