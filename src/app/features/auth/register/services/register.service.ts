import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AuthService, RegisterRequest } from '../../../../core/auth/services/auth.service';

export interface PasswordStrength {
  strength: number;
  label: string;
  color: string;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);

  async register(registerRequest: RegisterRequest): Promise<void> {
    try {
      const user = await this.authService.register(registerRequest).toPromise();

      if (user) {
        const successMessage = this.transloco.translate('register.success_message', {
          name: user.displayName,
        });
        this.showSuccessMessage(successMessage);

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = this.getErrorMessage(error);
      this.showErrorMessage(errorMessage);
      throw error;
    }
  }

  getPasswordStrength(password: string): PasswordStrength {
    if (!password) {
      return { strength: 0, label: '', color: '' };
    }

    let strength = 0;
    const checks = {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumeric: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      isValidLength: password.length >= 8,
    };

    strength = Object.values(checks).filter(Boolean).length;

    const strengthMap = {
      0: { label: '', color: '' },
      1: {
        label: this.transloco.translate('register.password_strength.very_weak'),
        color: '#f44336',
      },
      2: { label: this.transloco.translate('register.password_strength.weak'), color: '#ff9800' },
      3: { label: this.transloco.translate('register.password_strength.fair'), color: '#ffeb3b' },
      4: { label: this.transloco.translate('register.password_strength.good'), color: '#4caf50' },
      5: { label: this.transloco.translate('register.password_strength.strong'), color: '#2e7d32' },
    };

    return { strength, ...strengthMap[strength as keyof typeof strengthMap] };
  }

  getErrorMessage(error: any): string {
    if (error?.message) {
      const errorMap: { [key: string]: string } = {
        'Email already exists': 'register.errors.email_exists',
        'Username already exists': 'register.errors.username_exists',
        'Invalid email format': 'register.errors.email_invalid',
        'Password too weak': 'register.errors.password_weak',
      };

      return this.transloco.translate(errorMap[error.message] || 'register.errors.general');
    }

    return this.transloco.translate('register.errors.general');
  }

  private showSuccessMessage(message: string): void {
    const closeLabel = this.transloco.translate('register.close');
    this.snackBar.open(message, closeLabel, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorMessage(message: string): void {
    const closeLabel = this.transloco.translate('register.close');
    this.snackBar.open(message, closeLabel, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
