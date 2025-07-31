import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecureStorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Usar sessionStorage en lugar de localStorage para mayor seguridad
  setToken(token: string): void {
    try {
      // Usar sessionStorage (se limpia al cerrar pestaña)
      sessionStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  getToken(): string | null {
    try {
      return sessionStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  removeToken(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  setRefreshToken(token: string): void {
    try {
      // Refresh token puede ir en localStorage con mayor duración
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  setUserInfo(user: any): void {
    try {
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user info:', error);
    }
  }

  getUserInfo(): any | null {
    try {
      const userStr = sessionStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      return null;
    }
  }

  removeUser(): void {
    try {
      sessionStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Error removing user info:', error);
    }
  }

  clearAll(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Validar que no hay caracteres maliciosos
  private sanitizeToken(token: string): boolean {
    // JWT debería tener formato xxx.yyy.zzz
    const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    return jwtPattern.test(token);
  }
}
