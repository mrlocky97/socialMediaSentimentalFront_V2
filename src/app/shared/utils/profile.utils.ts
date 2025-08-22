import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export class ProfileUtils {
  // Validador personalizado para contraseñas - optimizado con tipos correctos
  static passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }
    
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  };

  // Marcar todos los campos de un formulario como tocados - optimizado
  static markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        // Si el control es un FormGroup anidado, aplicar recursivamente
        if (control instanceof FormGroup) {
          this.markFormGroupTouched(control);
        }
      }
    });
  }

  // Opciones para selects con iconos de banderas
  static languageOptions = [
    { 
      value: 'es', 
      label: 'Español', 
      flag: '🇪🇸',
      flagIcon: '/icons/lang/ES.png'
    },
    { 
      value: 'en', 
      label: 'English', 
      flag: '🇺🇸',
      flagIcon: '/icons/lang/UK.png'
    },
    { 
      value: 'fr', 
      label: 'Français', 
      flag: '🇫🇷',
      flagIcon: '/icons/lang/FR.png'
    },
    { 
      value: 'de', 
      label: 'Deutsch', 
      flag: '🇩🇪',
      flagIcon: '/icons/lang/DE.png'
    },
  ];

  static themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' },
  ];

  static refreshIntervalOptions = [
    { value: 15000, label: '15 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' },
  ];
}
