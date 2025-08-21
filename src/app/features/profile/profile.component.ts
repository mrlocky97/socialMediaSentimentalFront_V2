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
  private readonly profileService = inject(ProfileService);

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

  // Computed para validaciones
  readonly canSaveProfile = computed(
    () => this.profileForm?.valid && !this.isSubmitting() && !this.isLoading()
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
          validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
          updateOn: 'blur',
        },
      ],
      lastName: [
        '',
        {
          validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
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
      .subscribe(() => this._isFormsDirty.set(true));

    this.preferencesForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this._isFormsDirty.set(true));
  }

  private loadUserProfile(): void {
    this.profileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(),
        catchError((error) => {
          console.error('Error loading user profile:', error);
          this.profileService.showError('Error cargando perfil de usuario');
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

  private populateForms(profile: any): void {
    if (!profile) return;

    // Poblar formulario de perfil
    this.profileForm.patchValue(
      {
        displayName: profile.displayName ?? '',
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        bio: profile.bio ?? '',
      },
      { emitEvent: false }
    );

    // Poblar formulario de preferencias
    if (profile.preferences) {
      this.preferencesForm.patchValue(
        {
          language: profile.preferences.language ?? 'es',
          theme: profile.preferences.theme ?? 'light',
          emailNotifications: profile.preferences.notifications?.email ?? true,
          pushNotifications: profile.preferences.notifications?.push ?? true,
          campaignNotifications: profile.preferences.notifications?.campaigns ?? true,
          reportNotifications: profile.preferences.notifications?.reports ?? false,
          autoRefresh: profile.preferences.dashboard?.autoRefresh ?? true,
          refreshInterval: profile.preferences.dashboard?.refreshInterval ?? 30000,
        },
        { emitEvent: false }
      );
    }
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
    const updateRequest: UpdateProfileRequest = {
      displayName: formValue.displayName,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      bio: formValue.bio || undefined,
    };

    this.profileService
      .updateProfile(updateRequest)
      .pipe(
        tap(() => {
          this.profileService.showSuccess('Perfil actualizado correctamente');
          this._isFormsDirty.set(false);
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

    if (control.hasError('required')) return 'El nombre es requerido';
    if (control.hasError('minlength')) return 'Mínimo 2 caracteres';
    return null;
  });

  readonly lastNameError = computed((): string | null => {
    const control = this.profileForm?.get('lastName');
    if (!control || (!control.touched && !control.dirty)) return null;

    if (control.hasError('required')) return 'El apellido es requerido';
    if (control.hasError('minlength')) return 'Mínimo 2 caracteres';
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
