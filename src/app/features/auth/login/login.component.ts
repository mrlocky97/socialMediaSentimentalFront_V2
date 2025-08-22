import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

import { AuthService } from '../../../core/auth/services/auth.service';
import { LoginNotificationService } from './services/login.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslocoModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);
  private notificationService = inject(LoginNotificationService);

  // Signals para estado del componente
  private _isLoading = signal(false);
  private _showPassword = signal(false);
  private _loginAttempts = signal(0);
  private _isLockedOut = signal(false);

  // Computed properties
  isLoading = computed(() => this._isLoading());
  showPassword = computed(() => this._showPassword());
  loginAttempts = computed(() => this._loginAttempts());
  isLockedOut = computed(() => this._isLockedOut());

  // Form y validaciones
  loginForm!: FormGroup;

  // Error messages
  get emailError(): string | null {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required') && emailControl?.touched) {
      return this.transloco.translate('login.errors.required');
    }
    if (emailControl?.hasError('email') && emailControl?.touched) {
      return this.transloco.translate('login.errors.email');
    }
    return null;
  }

  get passwordError(): string | null {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required') && passwordControl?.touched) {
      return this.transloco.translate('login.errors.required');
    }
    if (passwordControl?.hasError('minlength') && passwordControl?.touched) {
      return this.transloco.translate('login.errors.minlength');
    }
    return null;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.checkExistingAuth();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private checkExistingAuth(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility(): void {
    this._showPassword.update(current => !current);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.isLoading() || this.isLockedOut()) {
      return;
    }

    this._isLoading.set(true);

    try {
      const { email, password } = this.loginForm.value;

      // Realizar login
      const user = await this.authService.login({ email, password }).toPromise();

      if (user) {
        // Login exitoso
        const welcomeMessage = this.transloco.translate('login.welcome_message', { name: user.displayName });
        this.showSuccessMessage(welcomeMessage);

        // Reset intentos
        this._loginAttempts.set(0);

        // Redirigir al dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);

      } else {
        this.handleLoginError('Error de autenticación');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || this.transloco.translate('login.connection_error');
      this.handleLoginError(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  private handleLoginError(message: string): void {
    // Incrementar intentos fallidos
    const newAttempts = this.loginAttempts() + 1;
    this._loginAttempts.set(newAttempts);

    // Verificar bloqueo temporal
    if (newAttempts >= 5) {
      this._isLockedOut.set(true);
      const lockoutMessage = this.transloco.translate('login.too_many_attempts');
      this.showErrorMessage(lockoutMessage);

      // Desbloquear después de 15 minutos (900000 ms)
      setTimeout(() => {
        this._isLockedOut.set(false);
        this._loginAttempts.set(0);
      }, 900000);

    } else {
      const remainingAttempts = 5 - newAttempts;
      const errorMessage = this.transloco.translate('login.attempts_remaining', {
        message: message,
        remaining: remainingAttempts
      });
      this.showErrorMessage(errorMessage);
    }

    // Limpiar formulario en caso de error
    this.loginForm.patchValue({ password: '' });
  }

  private showSuccessMessage(message: string): void {
    const closeLabel = this.transloco.translate('login.close');
    this.snackBar.open(message, closeLabel, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    const closeLabel = this.transloco.translate('login.close');
    this.snackBar.open(message, closeLabel, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Método para testing/development
  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'admin@sentimentalsocial.com',
      password: 'admin123'
    });
  }
}
