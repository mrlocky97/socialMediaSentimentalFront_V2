import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(control.value) ? null : { phoneNumber: true };
    };
  }

  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const hasNumber = /[0-9]/.test(control.value);
      const hasUpper = /[A-Z]/.test(control.value);
      const hasLower = /[a-z]/.test(control.value);
      const hasSpecial = /[#?!@$%^&*-]/.test(control.value);
      const isLengthValid = control.value.length >= 8;

      const passwordValid = hasNumber && hasUpper && hasLower && hasSpecial && isLengthValid;

      return passwordValid
        ? null
        : {
            strongPassword: {
              hasNumber,
              hasUpper,
              hasLower,
              hasSpecial,
              isLengthValid,
            },
          };
    };
  }

  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: true };
      }
    };
  }

  static minAge(minimumAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const today = new Date();
      const birthDate = new Date(control.value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= minimumAge ? null : { minAge: { minimumAge, actualAge: age - 1 } };
      }

      return age >= minimumAge ? null : { minAge: { minimumAge, actualAge: age } };
    };
  }

  static fileSize(maxSizeInBytes: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const file = control.value as File;
      if (file && file.size > maxSizeInBytes) {
        return {
          fileSize: {
            maxSize: maxSizeInBytes,
            actualSize: file.size,
            maxSizeMB: Math.round((maxSizeInBytes / (1024 * 1024)) * 100) / 100,
            actualSizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
          },
        };
      }

      return null;
    };
  }

  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const file = control.value as File;
      if (file && !allowedTypes.includes(file.type)) {
        return {
          fileType: {
            allowedTypes,
            actualType: file.type,
          },
        };
      }

      return null;
    };
  }

  static matchFields(fieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;

      const field = control.parent.get(fieldName);
      if (field && control.value !== field.value) {
        return { matchFields: { fieldName } };
      }

      return null;
    };
  }

  static conditionalRequired(condition: (form: AbstractControl) => boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;

      if (condition(control.parent) && (!control.value || control.value.trim() === '')) {
        return { conditionalRequired: true };
      }

      return null;
    };
  }

  static alphaNumeric(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
      return alphaNumericRegex.test(control.value) ? null : { alphaNumeric: true };
    };
  }

  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const isWhitespace = (control.value || '').trim().length === 0;
      return isWhitespace ? { noWhitespace: true } : null;
    };
  }

  static creditCard(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      // Luhn algorithm implementation
      const value = control.value.replace(/\D/g, '');
      let sum = 0;
      let shouldDouble = false;

      for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value.charAt(i), 10);

        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
      }

      return sum % 10 === 0 ? null : { creditCard: true };
    };
  }
}
