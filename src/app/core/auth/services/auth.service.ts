import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthState, LoginRequest, LoginResponse, UserInfo } from '../model/auth.model';
import { environment } from '../../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Inyectamos HttpClient y Router para manejar las peticiones HTTP y la navegación
  private http = inject(HttpClient);
  private router = inject(Router);

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

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';

  constructor() {
    this.loadAuthState();
    
    // Effect to sync with localStorage whenever auth state changes
    effect(() => {
      const state = this.authState();
      if (state.isAuthenticated && state.token && state.user) {
        localStorage.setItem(this.TOKEN_KEY, state.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(state.user));
      }
    });
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const loginData = {
      email: credentials.username,
      password: credentials.password
    };

    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/v1/auth/login`, loginData)
      .pipe(
        tap(response => {
          this.setAuthState(response.access_token, credentials.username);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({
      isAuthenticated: false,
      user: null,
      token: null
    });
    this.router.navigate(['/login']);
  }

  private setAuthState(token: string, email: string): void {
    const userInfo: UserInfo = {
      email,
      username: email.split('@')[0],
      role: 'user' // Esto se puede obtener del token decodificado si es necesario
    };

    this.authState.set({
      isAuthenticated: true,
      user: userInfo,
      token
    });
  }

  private loadAuthState(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.authState.set({
          isAuthenticated: true,
          user,
          token
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
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