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

import { AuthService } from '../../core/auth/services/auth.service';

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
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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
      return 'El email es requerido';
    }
    if (emailControl?.hasError('email') && emailControl?.touched) {
      return 'Ingrese un email válido';
    }
    return null;
  }

  get passwordError(): string | null {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required') && passwordControl?.touched) {
      return 'La contraseña es requerida';
    }
    if (passwordControl?.hasError('minlength') && passwordControl?.touched) {
      return 'La contraseña debe tener al menos 6 caracteres';
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
    // Si ya está autenticado, redirigir al dashboard
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
        this.showSuccessMessage(`¡Bienvenido ${user.displayName}! Iniciando sesión...`);

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
      this.handleLoginError(error?.message || 'Error de conexión. Intente nuevamente.');
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
      this.showErrorMessage('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.');

      // Desbloquear después de 15 minutos (900000 ms)
      setTimeout(() => {
        this._isLockedOut.set(false);
        this._loginAttempts.set(0);
      }, 900000);

    } else {
      const remainingAttempts = 5 - newAttempts;
      this.showErrorMessage(`${message}. ${remainingAttempts} intentos restantes.`);
    }

    // Limpiar formulario en caso de error
    this.loginForm.patchValue({ password: '' });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
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
