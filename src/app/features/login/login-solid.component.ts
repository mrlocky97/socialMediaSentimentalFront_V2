/**
 * Simplified Login Component - Clean and Functional
 */
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

@Component({
  selector: 'app-login-solid',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Sign In</mat-card-title>
          <mat-card-subtitle>Access your social media monitoring dashboard</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            
            <!-- Validation Errors -->
            @if (validationErrors().length > 0) {
              <div class="validation-errors">
                @for (error of validationErrors(); track error) {
                  <p class="error-message">{{ error }}</p>
                }
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input 
                matInput 
                type="email" 
                formControlName="email"
                [disabled]="loading()"
                autocomplete="email"
                placeholder="Enter your email">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input 
                matInput 
                type="password" 
                formControlName="password"
                [disabled]="loading()"
                autocomplete="current-password"
                placeholder="Enter your password">
            </mat-form-field>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              class="login-button"
              [disabled]="!loginForm.valid || loading()">
              
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
                <span style="margin-left: 8px;">Signing in...</span>
              } @else {
                Sign In
              }
            </button>

            <div class="register-link">
              <p>Don't have an account? 
                <a (click)="goToRegister()" class="link">Create one here</a>
              </p>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border-radius: 16px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .login-button {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
      font-weight: 500;
    }

    .validation-errors {
      background-color: #ffebee;
      border: 1px solid #f44336;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .error-message {
      margin: 0;
      color: #d32f2f;
      font-size: 14px;
    }

    .error-message:not(:last-child) {
      margin-bottom: 8px;
    }

    .register-link {
      text-align: center;
      margin-top: 16px;
    }

    .register-link p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .link {
      color: #1976d2;
      cursor: pointer;
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 24px;
    }

    mat-card-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    mat-card-subtitle {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
  `]
})
export class LoginSolidComponent {
  // Service Dependencies
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Form setup
  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Component State
  loading = signal(false);
  validationErrors = signal<string[]>([]);

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.loginForm.valid) {
      this.validationErrors.set(['Please fill in all required fields correctly.']);
      return;
    }

    const email = this.loginForm.value.email!;
    const password = this.loginForm.value.password!;

    // Basic validation
    if (!this.isValidEmail(email)) {
      this.validationErrors.set(['Please enter a valid email address.']);
      return;
    }

    if (password.length < 6) {
      this.validationErrors.set(['Password must be at least 6 characters long.']);
      return;
    }

    // Clear previous errors and proceed with login
    this.validationErrors.set([]);
    this.performLogin(email, password);
  }

  /**
   * Perform login simulation
   */
  private performLogin(email: string, password: string): void {
    this.loading.set(true);

    // Simulate API call
    setTimeout(() => {
      // Simulate different outcomes
      if (email === 'admin@example.com' && password === 'password123') {
        this.handleLoginSuccess();
      } else if (email === 'demo@example.com' && password === 'demo123') {
        this.handleLoginSuccess();
      } else {
        this.handleLoginError('Invalid email or password.');
      }
    }, 2000);
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(): void {
    this.loading.set(false);
    this.snackBar.open('Login successful! Welcome back.', 'Close', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    
    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
  }

  /**
   * Handle login error
   */
  private handleLoginError(errorMessage: string): void {
    this.loading.set(false);
    this.validationErrors.set([errorMessage]);
    this.snackBar.open(errorMessage, 'Close', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Navigate to register page
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Basic email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
