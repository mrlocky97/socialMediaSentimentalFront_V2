import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
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

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';

  constructor() {
    this.loadAuthState();
  }

  get isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  get currentUser(): UserInfo | null {
    return this.authState().user;
  }

  get token(): string | null {
    return this.authState().token;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, formData)
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

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));

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
    return this.token;
  }
}