import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@ngneat/transloco';
import { catchError, of, tap } from 'rxjs';

import {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../../core/services/user-profile.service';
import { ProfileUtils } from '../../shared/utils/profile.utils';
import { ProfileService } from './services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    TranslocoModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  public readonly profileService = inject(ProfileService);

  // Signals para el estado del componente
  private readonly _isFormsDirty = signal(false);

  // Computed properties para optimización
  readonly isSubmitting = this.profileService.isSubmitting;
  readonly showCurrentPassword = this.profileService.showCurrentPassword;
  readonly showNewPassword = this.profileService.showNewPassword;
  readonly showConfirmPassword = this.profileService.showConfirmPassword;
  readonly currentUser = this.profileService.currentUser;
  readonly profile = this.profileService.profile;
  readonly isLoading = this.profileService.isLoading;
  readonly error = this.profileService.error;
  readonly hasChanges = this.profileService.hasChanges;
  readonly currentLanguage = this.profileService.currentLanguage;
  readonly availableLanguages = this.profileService.availableLanguages;

  // Computed para validaciones
  readonly canSaveProfile = computed(
    () => this.profileForm?.valid && !this.isSubmitting() && !this.isLoading() && this._isFormsDirty()
  );

  readonly canChangePassword = computed(() => this.passwordForm?.valid && !this.isSubmitting());

  readonly canSavePreferences = computed(() => this.preferencesForm?.valid && !this.isSubmitting());

  // Formularios
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  preferencesForm!: FormGroup;

  // Opciones para selects
  readonly languageOptions = ProfileUtils.languageOptions;
  readonly themeOptions = ProfileUtils.themeOptions;
  readonly refreshIntervalOptions = ProfileUtils.refreshIntervalOptions;

  ngOnInit(): void {
    this.initializeForms();
    this.setupFormSubscriptions();
    this.loadUserProfile();
  }

  private initializeForms(): void {
    // Formulario de perfil
    this.profileForm = this.fb.nonNullable.group({
      username: [
        { value: '', disabled: true },
        {
          validators: [Validators.required],
          updateOn: 'blur',
        },
      ],
      email: [
        { value: '', disabled: true },
        {
          validators: [Validators.required, Validators.email],
          updateOn: 'blur',
        },
      ],
      displayName: [
        '',
        {
          validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
          updateOn: 'blur',
        },
      ],
      firstName: [
        '',
        {
          validators: [Validators.minLength(2), Validators.maxLength(50)],
          updateOn: 'blur',
        },
      ],
      lastName: [
        '',
        {
          validators: [Validators.minLength(2), Validators.maxLength(50)],
          updateOn: 'blur',
        },
      ],
      bio: [
        '',
        {
          validators: [Validators.maxLength(500)],
          updateOn: 'change',
        },
      ],
    });

    // Formulario de cambio de contraseña
    this.passwordForm = this.fb.nonNullable.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: ProfileUtils.passwordMatchValidator,
        updateOn: 'blur',
      }
    );

    // Formulario de preferencias
    this.preferencesForm = this.fb.nonNullable.group({
      language: ['es', [Validators.required]],
      theme: ['light', [Validators.required]],
      emailNotifications: [true],
      pushNotifications: [true],
      campaignNotifications: [true],
      reportNotifications: [false],
      autoRefresh: [true],
      refreshInterval: [30000, [Validators.required]],
    });
  }

  private setupFormSubscriptions(): void {
    // Suscripciones optimizadas con takeUntilDestroyed
    this.profileForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        // Solo marcar como dirty si no estamos poblando el formulario
        if (this.profileForm.dirty) {
          this._isFormsDirty.set(true);
        }
      });

    this.preferencesForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        // Solo marcar como dirty si no estamos poblando el formulario
        if (this.preferencesForm.dirty) {
          this._isFormsDirty.set(true);
        }
      });
  }

  private loadUserProfile(): void {
    // Primero intentamos usar los datos del usuario actual si están disponibles
    const currentUserData = this.currentUser();
    if (currentUserData) {
      this.populateForms({ user: currentUserData });
      this._isFormsDirty.set(false);
    }

    // Luego obtenemos el perfil completo del servidor
    this.profileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(),
        catchError((error) => {
          console.error('Error loading user profile:', error);
          // Si ya tenemos datos del currentUser, no mostramos error
          if (!currentUserData) {
            this.profileService.showError('Error cargando perfil de usuario');
          }
          return of(null);
        })
      )
      .subscribe((profile) => {
        if (profile) {
          this.populateForms(profile);
          this._isFormsDirty.set(false);
        }
      });
  }

  refreshProfile(): void {
    this.loadUserProfile();
  }

  // Método para resetear el formulario a los valores originales
  resetProfileForm(): void {
    const currentUserData = this.currentUser();
    if (currentUserData) {
      this.populateForms({ user: currentUserData });
      this._isFormsDirty.set(false);
    }
  }

  private populateForms(profile: any): void {
    if (!profile) return;

    // Si el perfil viene directamente del currentUser (formato del API)
    const userData = profile.user || profile;

    // Poblar formulario de perfil con los datos del usuario
    this.profileForm.patchValue(
      {
        username: userData.username ?? '',
        email: userData.email ?? '',
        displayName: userData.displayName ?? userData.username ?? '',
        firstName: userData.firstName ?? this.extractFirstName(userData.displayName) ?? '',
        lastName: userData.lastName ?? this.extractLastName(userData.displayName) ?? '',
        bio: userData.bio ?? '',
      },
      { emitEvent: false }
    );

    // Poblar formulario de preferencias con valores por defecto
    this.preferencesForm.patchValue(
      {
        language: userData.preferences?.language ?? 'es',
        theme: userData.preferences?.theme ?? 'light',
        emailNotifications: userData.preferences?.notifications?.email ?? true,
        pushNotifications: userData.preferences?.notifications?.push ?? true,
        campaignNotifications: userData.preferences?.notifications?.campaigns ?? true,
        reportNotifications: userData.preferences?.notifications?.reports ?? false,
        autoRefresh: userData.preferences?.dashboard?.autoRefresh ?? true,
        refreshInterval: userData.preferences?.dashboard?.refreshInterval ?? 30000,
      },
      { emitEvent: false }
    );
  }

  // Métodos auxiliares para extraer nombres del displayName
  private extractFirstName(displayName?: string): string {
    if (!displayName) return '';
    const parts = displayName.split(' ');
    return parts[0] || '';
  }

  private extractLastName(displayName?: string): string {
    if (!displayName) return '';
    const parts = displayName.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  // Métodos para mostrar/ocultar contraseñas
  toggleCurrentPasswordVisibility(): void {
    this.profileService.toggleCurrentPasswordVisibility();
  }

  toggleNewPasswordVisibility(): void {
    this.profileService.toggleNewPasswordVisibility();
  }

  toggleConfirmPasswordVisibility(): void {
    this.profileService.toggleConfirmPasswordVisibility();
  }

  // Guardar perfil usando observables en lugar de promesas
  onSaveProfile(): void {
    if (!this.canSaveProfile()) {
      ProfileUtils.markFormGroupTouched(this.profileForm);
      return;
    }

    const formValue = this.profileForm.getRawValue();
    
    // Solo incluir los campos que el usuario puede editar
    const updateRequest: UpdateProfileRequest = {
      displayName: formValue.displayName,
      firstName: formValue.firstName || undefined,
      lastName: formValue.lastName || undefined,
      bio: formValue.bio || undefined,
    };

    this.profileService
      .updateProfile(updateRequest)
      .pipe(
        tap(() => {
          this.profileService.showSuccess('Perfil actualizado correctamente');
          this._isFormsDirty.set(false);
          // Recargar el perfil actualizado
          this.loadUserProfile();
        }),
        catchError((error) => {
          console.error('Error updating profile:', error);
          this.profileService.showError(
            error?.message || 'Error actualizando perfil. Por favor, intenta nuevamente.'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  // Guardar preferencias
  onSavePreferences(): void {
    if (!this.canSavePreferences()) {
      ProfileUtils.markFormGroupTouched(this.preferencesForm);
      return;
    }

    const formValue = this.preferencesForm.getRawValue();
    
    // Si el idioma cambió, aplicarlo inmediatamente
    const currentLanguage = this.currentLanguage();
    if (formValue.language !== currentLanguage) {
      this.onLanguageChange(formValue.language);
    }

    const preferencesUpdate: UpdateProfileRequest = {
      preferences: {
        language: formValue.language,
        theme: formValue.theme,
        notifications: {
          email: formValue.emailNotifications,
          push: formValue.pushNotifications,
          campaigns: formValue.campaignNotifications,
          reports: formValue.reportNotifications,
        },
        dashboard: {
          autoRefresh: formValue.autoRefresh,
          refreshInterval: formValue.refreshInterval,
          defaultView: 'overview',
        },
      },
    };

    this.profileService
      .updateProfile(preferencesUpdate)
      .pipe(
        tap(() => {
          this.profileService.showSuccess('Preferencias actualizadas correctamente');
          this._isFormsDirty.set(false);
        }),
        catchError((error) => {
          console.error('Error updating preferences:', error);
          this.profileService.showError(
            error?.message || 'Error actualizando preferencias. Por favor, intenta nuevamente.'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  // ===== MÉTODOS DE IDIOMA =====
  
  /**
   * Manejar cambio de idioma
   */
  onLanguageChange(newLanguage: string): void {
    this.profileService
      .changeLanguage(newLanguage)
      .pipe(
        catchError((error) => {
          console.error('Error changing language:', error);
          // Revertir el formulario al idioma anterior si hay error
          const currentLang = this.currentLanguage();
          this.preferencesForm.patchValue({ language: currentLang }, { emitEvent: false });
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Cambio rápido de idioma (sin guardar en preferencias)
   */
  onQuickLanguageSwitch(): void {
    const currentLang = this.currentLanguage();
    const currentIndex = this.languageOptions.findIndex(lang => lang.value === currentLang);
    const nextIndex = (currentIndex + 1) % this.languageOptions.length;
    const nextLang = this.languageOptions[nextIndex];
    
    // Cambiar en el formulario también para que se vea la bandera correcta
    this.preferencesForm.patchValue({ language: nextLang.value });
    
    // Aplicar el cambio de idioma
    this.profileService.switchToNextLanguage();
  }

  // Cambiar contraseña
  onChangePassword(): void {
    if (!this.canChangePassword()) {
      ProfileUtils.markFormGroupTouched(this.passwordForm);
      return;
    }

    const formValue = this.passwordForm.getRawValue();
    const changePasswordRequest: ChangePasswordRequest = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword,
    };

    this.profileService
      .changePassword(changePasswordRequest)
      .pipe(
        tap((success) => {
          if (success) {
            this.profileService.showSuccess('Contraseña cambiada correctamente');
            this.passwordForm.reset();
          } else {
            this.profileService.showError(
              'Error cambiando contraseña. Verifica tu contraseña actual.'
            );
          }
        }),
        catchError((error) => {
          console.error('Error changing password:', error);
          this.profileService.showError(
            error?.message || 'Error cambiando contraseña. Por favor, intenta nuevamente.'
          );
          return of(false);
        })
      )
      .subscribe();
  }

  // Métodos de utilidad
  getUserInitials(): string {
    return this.profileService.getUserInitials();
  }

  getAvatarColor(): string {
    return this.profileService.getAvatarColor();
  }

  getRoleLabel(role: string): string {
    return this.profileService.getRoleLabel(role);
  }

  // Métodos auxiliares para verificación y permisos
  hasVerificationStatus(): boolean {
    const user = this.currentUser();
    return user !== null && 'isVerified' in user;
  }

  isUserVerified(): boolean {
    const user = this.currentUser() as any;
    return user?.isVerified === true;
  }

  getUserPermissionsCount(): number {
    const user = this.currentUser() as any;
    return user?.permissions?.length || 0;
  }

  // Método para manejar errores de carga de imágenes de banderas
  onImageError(event: Event, fallbackFlag: string): void {
    const imgElement = event.target as HTMLImageElement;
    // Crear un elemento span con el emoji como fallback
    const span = document.createElement('span');
    span.textContent = fallbackFlag;
    span.className = 'flag-emoji-fallback';
    
    // Reemplazar la imagen con el emoji
    if (imgElement.parentNode) {
      imgElement.parentNode.replaceChild(span, imgElement);
    }
  }

  // Método para obtener la información del idioma actual con icono
  getCurrentLanguageInfo() {
    const currentLang = this.currentLanguage();
    const langInfo = this.languageOptions.find(lang => lang.value === currentLang);
    return langInfo || { value: 'es', label: 'Español', flag: '🌐', flagIcon: '/icons/lang/spanish.png' };
  }

  // Método para obtener la información del idioma seleccionado en el formulario
  getSelectedLanguageInfo() {
    const selectedLang = this.preferencesForm?.get('language')?.value || 'es';
    const langInfo = this.languageOptions.find(lang => lang.value === selectedLang);
    return langInfo || { value: 'es', label: 'Español', flag: '🌐', flagIcon: '/icons/lang/spanish.png' };
  }

  // Computed properties para validaciones de formularios
  readonly displayNameError = computed((): string | null => {
    const control = this.profileForm?.get('displayName');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('required')) return 'El nombre es requerido';
    if (control.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (control.hasError('maxlength')) return 'Máximo 100 caracteres';
    return null;
  });

  readonly firstNameError = computed((): string | null => {
    const control = this.profileForm?.get('firstName');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (control.hasError('maxlength')) return 'Máximo 50 caracteres';
    return null;
  });

  readonly lastNameError = computed((): string | null => {
    const control = this.profileForm?.get('lastName');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (control.hasError('maxlength')) return 'Máximo 50 caracteres';
    return null;
  });

  readonly currentPasswordError = computed((): string | null => {
    const control = this.passwordForm?.get('currentPassword');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('required')) return 'La contraseña actual es requerida';
    return null;
  });

  readonly newPasswordError = computed((): string | null => {
    const control = this.passwordForm?.get('newPassword');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('required')) return 'La nueva contraseña es requerida';
    if (control.hasError('minlength')) return 'Mínimo 8 caracteres';
    return null;
  });

  readonly confirmPasswordError = computed((): string | null => {
    const control = this.passwordForm?.get('confirmPassword');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('required')) return 'Confirma la contraseña';
    if (this.passwordForm?.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    return null;
  });
}
