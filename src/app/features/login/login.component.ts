import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoRootModule } from '../../transloco-loader';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from '../../core/auth/services/auth.service';
import { InputSanitizerService } from '../../core/services/input-sanitizer.service';
import { LoginRequest } from '../../core/auth/model/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TranslocoRootModule,
    TranslocoModule
  ],
  templateUrl: './login.component.html',
  styleUrls: [
    './login.component.css',
    '../../../styles.css'
  ]
})
export class LoginComponent {
  // Using Angular's dependency injection to inject services
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private inputSanitizer = inject(InputSanitizerService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Reactive form for login
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Signals for loading state and error messages
  loading = signal(false);
  errorMessage = signal('');
  
  // Contador de intentos fallidos para prevenir ataques de fuerza bruta
  private failedAttempts = signal(0);
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
  private lockoutEndTime = signal<Date | null>(null);
  
  // Computed para verificar si está bloqueado
  readonly isLockedOut = computed(() => {
    const lockout = this.lockoutEndTime();
    return lockout ? new Date() < lockout : false;
  });

  // Computed para tiempo restante de bloqueo
  readonly lockoutTimeRemaining = computed(() => {
    const lockout = this.lockoutEndTime();
    if (!lockout) return 0;
    const remaining = lockout.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutos
  });
  
  onSubmit() {
    // Verificar si está bloqueado
    if (this.isLockedOut()) {
      const remaining = this.lockoutTimeRemaining();
      this.errorMessage.set(`Cuenta bloqueada. Intente nuevamente en ${remaining} minutos.`);
      this.snackBar.open(`Demasiados intentos fallidos. Espere ${remaining} minutos.`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const email = this.loginForm.value.email!;
      const password = this.loginForm.value.password!;

      // Validación adicional de seguridad
      if (!this.inputSanitizer.isValidEmail(email)) {
        this.loading.set(false);
        this.handleFailedAttempt();
        this.errorMessage.set('Invalid email format.');
        this.snackBar.open('Invalid email format.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      if (!this.inputSanitizer.isValidPassword(password)) {
        this.loading.set(false);
        this.handleFailedAttempt();
        this.errorMessage.set('Password contains invalid characters.');
        this.snackBar.open('Password contains invalid characters.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      const credentials: LoginRequest = {
        username: email,
        password: password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.loading.set(false);
          
          // Reset failed attempts on successful login
          this.failedAttempts.set(0);
          this.lockoutEndTime.set(null);
          
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading.set(false);
          this.handleFailedAttempt();
          
          let errorMsg = 'Login failed. Please try again.';
          // Manejo de errores según el código de estado
          if (error.status === 401) {
            errorMsg = 'Invalid email or password.';
          } else if (error.status === 0) {
            errorMsg = 'Cannot connect to server. Please check your connection.';
          } else if (error.status === 429) {
            errorMsg = 'Too many requests. Please wait and try again.';
          }
          
          // Mostrar advertencia si se acercan al límite
          const attempts = this.failedAttempts();
          if (attempts >= this.MAX_ATTEMPTS - 2 && attempts < this.MAX_ATTEMPTS) {
            errorMsg += ` (${this.MAX_ATTEMPTS - attempts} intentos restantes)`;
          }
          
          // Set the error message signal and show a snackbar
          this.errorMessage.set(errorMsg);
          this.snackBar.open(errorMsg, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  private handleFailedAttempt(): void {
    const newAttempts = this.failedAttempts() + 1;
    this.failedAttempts.set(newAttempts);
    
    if (newAttempts >= this.MAX_ATTEMPTS) {
      const lockoutEnd = new Date(Date.now() + this.LOCKOUT_TIME);
      this.lockoutEndTime.set(lockoutEnd);
      
      // Limpiar el formulario por seguridad
      this.loginForm.reset();
      
      console.warn(`Login locked out until: ${lockoutEnd.toLocaleTimeString()}`);
    }
  }
}