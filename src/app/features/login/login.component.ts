import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  
  onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const credentials: LoginRequest = {
        username: this.loginForm.value.email!,
        password: this.loginForm.value.password!
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.loading.set(false);
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading.set(false);
          let errorMsg = 'Login failed. Please try again.';
          // Manejo de errores según el código de estado
          if (error.status === 401) {
            errorMsg = 'Invalid email or password.';
          } else if (error.status === 0) {
            errorMsg = 'Cannot connect to server. Please check your connection.';
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
}