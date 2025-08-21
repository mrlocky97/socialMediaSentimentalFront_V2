import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfileService
} from '../../../core/services/user-profile.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);

  // Signals para el estado del componente
  private _isSubmitting = signal(false);
  private _showCurrentPassword = signal(false);
  private _showNewPassword = signal(false);
  private _showConfirmPassword = signal(false);

  // Computed properties
  isSubmitting = this._isSubmitting.asReadonly();
  showCurrentPassword = this._showCurrentPassword.asReadonly();
  showNewPassword = this._showNewPassword.asReadonly();
  showConfirmPassword = this._showConfirmPassword.asReadonly();

  // Referencias a servicios
  currentUser = this.authService.currentUser;
  profile = this.userProfileService.profile;
  isLoading = this.userProfileService.isLoading;
  error = this.userProfileService.error;
  hasChanges = this.userProfileService.hasChanges;

  // Métodos para mostrar/ocultar contraseñas
  toggleCurrentPasswordVisibility(): void {
    this._showCurrentPassword.update((current) => !current);
  }

  toggleNewPasswordVisibility(): void {
    this._showNewPassword.update((current) => !current);
  }

  toggleConfirmPasswordVisibility(): void {
    this._showConfirmPassword.update((current) => !current);
  }

  // Obtener iniciales del usuario para avatar
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '??';

    const displayName = user.displayName || user.username || '';
    const names = displayName.split(' ');

    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }

    return names[0] ? names[0].charAt(0).toUpperCase() : '??';
  }

  // Obtener color del avatar basado en el rol
  getAvatarColor(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'manager':
        return '#ff9800';
      case 'analyst':
        return '#2196f3';
      case 'onlyView':
        return '#9e9e9e';
      default:
        return '#4caf50';
    }
  }

  // Obtener etiqueta del rol traducida
  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      admin: 'Administrador',
      manager: 'Gerente',
      analyst: 'Analista',
      onlyView: 'Solo Lectura',
      client: 'Cliente',
    };
    return roleLabels[role] || role;
  }

  // Métodos de utilidad
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  // Métodos de perfil - delegación al UserProfileService
  updateProfile(request: UpdateProfileRequest): Observable<any> {
    this._isSubmitting.set(true);
    return this.userProfileService.updateProfile(request).pipe(
      finalize(() => this._isSubmitting.set(false))
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<boolean> {
    this._isSubmitting.set(true);
    return this.userProfileService.changePassword(request).pipe(
      finalize(() => this._isSubmitting.set(false))
    );
  }

  getProfile(): Observable<any> {
    return this.userProfileService.getProfile();
  }
}
