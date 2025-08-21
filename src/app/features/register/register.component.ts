import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MATERIAL_FORMS } from '../../shared/material/material-imports';
import { RegisterService, PasswordStrength } from './services/register.service';
import { PasswordValidators } from './validators/password-validator';
import { RegisterRequest } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterModule, ...MATERIAL_FORMS, TranslocoModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private transloco = inject(TranslocoService);
  private registerService = inject(RegisterService);

  registerForm!: FormGroup;
  isSubmitting = false;
  passwordStrength: PasswordStrength = { strength: 0, label: '', color: '' };
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), PasswordValidators.strongPassword]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: PasswordValidators.matchPasswords 
    });

    // Subscribe to password changes to update strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength = this.registerService.getPasswordStrength(password || '');
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.registerForm.value;
      const registerRequest: RegisterRequest = {
        username: formValue.userName,
        displayName: formValue.displayName,
        email: formValue.email,
        password: formValue.password
      };

      await this.registerService.register(registerRequest);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility methods for template
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || (!field.dirty && !field.touched)) {
      return null;
    }

    const errors = field.errors;
    if (errors['required']) return `register.${fieldName}_required`;
    if (errors['minlength']) return `register.${fieldName}_minlength`;
    if (errors['maxlength']) return `register.${fieldName}_maxlength`;
    if (errors['email']) return 'register.email_invalid';
    if (errors['strongPassword']) return 'register.password_weak';

    return null;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
