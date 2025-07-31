/**
 * Login Validation Service - Single Responsibility Principle
 * Responsible only for login validation logic
 */
import { Injectable } from '@angular/core';

export interface LoginValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LoginValidationService {

  validateLoginForm(email: string, password: string): LoginValidationResult {
    const errors: string[] = [];

    // Email validation
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else if (!this.isValidEmailFormat(email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (!password || password.trim() === '') {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Brute Force Protection Service - Single Responsibility Principle
 * Responsible only for handling login attempt protection
 */
@Injectable({
  providedIn: 'root'
})
export class BruteForceProtectionService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
  private failedAttempts = new Map<string, number>();
  private lockoutTimes = new Map<string, Date>();

  isLockedOut(identifier: string): boolean {
    const lockoutTime = this.lockoutTimes.get(identifier);
    if (!lockoutTime) return false;
    
    const now = new Date();
    if (now >= lockoutTime) {
      this.clearLockout(identifier);
      return false;
    }
    
    return true;
  }

  recordFailedAttempt(identifier: string): void {
    const attempts = this.failedAttempts.get(identifier) || 0;
    const newAttempts = attempts + 1;
    this.failedAttempts.set(identifier, newAttempts);

    if (newAttempts >= this.MAX_ATTEMPTS) {
      const lockoutEnd = new Date(Date.now() + this.LOCKOUT_TIME);
      this.lockoutTimes.set(identifier, lockoutEnd);
    }
  }

  recordSuccessfulLogin(identifier: string): void {
    this.failedAttempts.delete(identifier);
    this.lockoutTimes.delete(identifier);
  }

  getRemainingLockoutTime(identifier: string): number {
    const lockoutTime = this.lockoutTimes.get(identifier);
    if (!lockoutTime) return 0;
    
    const remaining = lockoutTime.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutes
  }

  getAttemptsRemaining(identifier: string): number {
    const attempts = this.failedAttempts.get(identifier) || 0;
    return Math.max(0, this.MAX_ATTEMPTS - attempts);
  }

  private clearLockout(identifier: string): void {
    this.failedAttempts.delete(identifier);
    this.lockoutTimes.delete(identifier);
  }
}

/**
 * Login Notification Service - Single Responsibility Principle
 * Responsible only for handling login-related notifications
 */
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class LoginNotificationService {
  private snackBar = inject(MatSnackBar);

  showSuccessMessage(): void {
    this.snackBar.open('Login successful!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  showLockoutWarning(attemptsRemaining: number): void {
    this.snackBar.open(
      `Warning: ${attemptsRemaining} attempts remaining before lockout`, 
      'Close', 
      {
        duration: 4000,
        panelClass: ['warning-snackbar']
      }
    );
  }

  showLockoutMessage(timeRemaining: number): void {
    this.snackBar.open(
      `Account locked. Try again in ${timeRemaining} minutes.`, 
      'Close', 
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
  }
}
