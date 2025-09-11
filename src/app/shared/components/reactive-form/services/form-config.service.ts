import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormConfig, FormFieldConfig } from '../interfaces/form-field.interface';
import { CustomValidators } from '../validators/custom-validators';

@Injectable({
  providedIn: 'root',
})
export class FormConfigService {
  // Configuraciones predefinidas para formularios comunes
  getLoginFormConfig(): FormConfig {
    return {
      fields: [
        {
          key: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          required: true,
          validators: [Validators.email],
          errorMessages: {
            required: 'Email is required',
            email: 'Please enter a valid email address',
          },
        },
        {
          key: 'password',
          type: 'password',
          label: 'Password',
          placeholder: 'Enter your password',
          required: true,
          validators: [Validators.minLength(6)],
          errorMessages: {
            required: 'Password is required',
            minlength: 'Password must be at least 6 characters long',
          },
        },
        {
          key: 'rememberMe',
          type: 'checkbox',
          label: 'Remember me',
          value: false,
        },
      ],
      submitButtonText: 'Login',
      showResetButton: false,
    };
  }

  getRegistrationFormConfig(): FormConfig {
    return {
      fields: [
        {
          key: 'firstName',
          type: 'text',
          label: 'First Name',
          placeholder: 'Enter your first name',
          required: true,
          validators: [Validators.minLength(2)],
        },
        {
          key: 'lastName',
          type: 'text',
          label: 'Last Name',
          placeholder: 'Enter your last name',
          required: true,
          validators: [Validators.minLength(2)],
        },
        {
          key: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          required: true,
          validators: [Validators.email],
        },
        {
          key: 'phone',
          type: 'tel',
          label: 'Phone Number',
          placeholder: 'Enter your phone number',
          validators: [CustomValidators.phoneNumber()],
          errorMessages: {
            phoneNumber: 'Please enter a valid phone number',
          },
        },
        {
          key: 'password',
          type: 'password',
          label: 'Password',
          placeholder: 'Enter your password',
          required: true,
          validators: [CustomValidators.strongPassword()],
          errorMessages: {
            required: 'Password is required',
            strongPassword:
              'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
          },
        },
        {
          key: 'confirmPassword',
          type: 'password',
          label: 'Confirm Password',
          placeholder: 'Confirm your password',
          required: true,
          validators: [CustomValidators.matchFields('password')],
          errorMessages: {
            required: 'Password confirmation is required',
            matchFields: 'Passwords do not match',
          },
        },
        {
          key: 'birthDate',
          type: 'date',
          label: 'Birth Date',
          required: true,
          validators: [CustomValidators.minAge(18)],
          errorMessages: {
            required: 'Birth date is required',
            minAge: 'You must be at least 18 years old',
          },
        },
        {
          key: 'terms',
          type: 'checkbox',
          label: 'I agree to the Terms and Conditions',
          required: true,
          errorMessages: {
            required: 'You must accept the terms and conditions',
          },
        },
      ],
      submitButtonText: 'Register',
      resetButtonText: 'Clear Form',
      showResetButton: true,
    };
  }

  getContactFormConfig(): FormConfig {
    return {
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
          validators: [Validators.minLength(3)],
        },
        {
          key: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          required: true,
          validators: [Validators.email],
        },
        {
          key: 'subject',
          type: 'text',
          label: 'Subject',
          placeholder: 'Enter the subject',
          required: true,
        },
        {
          key: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'Enter your message',
          required: true,
          rows: 5,
          validators: [Validators.minLength(10)],
        },
        {
          key: 'priority',
          type: 'select',
          label: 'Priority',
          required: true,
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ],
        },
      ],
      submitButtonText: 'Send Message',
      resetButtonText: 'Clear',
      showResetButton: true,
    };
  }

  getProfileFormConfig(): FormConfig {
    return {
      fields: [
        {
          key: 'avatar',
          type: 'file',
          label: 'Profile Picture',
          accept: 'image/*',
          validators: [
            CustomValidators.fileSize(5 * 1024 * 1024), // 5MB
            CustomValidators.fileType(['image/jpeg', 'image/png', 'image/gif']),
          ],
          errorMessages: {
            fileSize: 'File size must be less than 5MB',
            fileType: 'Only JPEG, PNG and GIF files are allowed',
          },
        },
        {
          key: 'username',
          type: 'text',
          label: 'Username',
          placeholder: 'Enter your username',
          required: true,
          validators: [
            Validators.minLength(3),
            Validators.maxLength(20),
            CustomValidators.alphaNumeric(),
          ],
        },
        {
          key: 'bio',
          type: 'textarea',
          label: 'Bio',
          placeholder: 'Tell us about yourself',
          rows: 4,
          validators: [Validators.maxLength(500)],
        },
        {
          key: 'website',
          type: 'url',
          label: 'Website',
          placeholder: 'https://example.com',
          validators: [CustomValidators.url()],
          errorMessages: {
            url: 'Please enter a valid URL',
          },
        },
        {
          key: 'notifications',
          type: 'checkbox',
          label: 'Receive email notifications',
          value: true,
        },
        {
          key: 'theme',
          type: 'radio',
          label: 'Preferred Theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ],
          value: 'light',
        },
      ],
      submitButtonText: 'Update Profile',
      resetButtonText: 'Reset Changes',
      showResetButton: true,
    };
  }

  getSearchFormConfig(): FormConfig {
    return {
      fields: [
        {
          key: 'query',
          type: 'text',
          label: 'Search Query',
          placeholder: 'Enter search terms',
          required: true,
        },
        {
          key: 'category',
          type: 'select',
          label: 'Category',
          options: [
            { value: '', label: 'All Categories' },
            { value: 'products', label: 'Products' },
            { value: 'services', label: 'Services' },
            { value: 'articles', label: 'Articles' },
            { value: 'users', label: 'Users' },
          ],
        },
        {
          key: 'dateRange',
          type: 'date',
          label: 'From Date',
        },
        {
          key: 'sortBy',
          type: 'radio',
          label: 'Sort By',
          options: [
            { value: 'relevance', label: 'Relevance' },
            { value: 'date', label: 'Date' },
            { value: 'popularity', label: 'Popularity' },
          ],
          value: 'relevance',
        },
      ],
      submitButtonText: 'Search',
      showResetButton: true,
    };
  }

  // Método para crear configuración personalizada
  createCustomFormConfig(
    fields: FormFieldConfig[],
    options?: {
      submitButtonText?: string;
      resetButtonText?: string;
      showResetButton?: boolean;
      cssClass?: string;
    }
  ): FormConfig {
    return {
      fields,
      submitButtonText: options?.submitButtonText || 'Submit',
      resetButtonText: options?.resetButtonText || 'Reset',
      showResetButton: options?.showResetButton || false,
      cssClass: options?.cssClass,
    };
  }

  // Método para modificar configuración existente
  modifyFormConfig(
    baseConfig: FormConfig,
    modifications: {
      addFields?: FormFieldConfig[];
      removeFields?: string[];
      updateFields?: { [key: string]: Partial<FormFieldConfig> };
      updateOptions?: Partial<
        Pick<FormConfig, 'submitButtonText' | 'resetButtonText' | 'showResetButton' | 'cssClass'>
      >;
    }
  ): FormConfig {
    const newConfig = { ...baseConfig };

    // Remover campos
    if (modifications.removeFields) {
      newConfig.fields = newConfig.fields.filter(
        (field) => !modifications.removeFields!.includes(field.key)
      );
    }

    // Actualizar campos existentes
    if (modifications.updateFields) {
      newConfig.fields = newConfig.fields.map((field) => {
        if (modifications.updateFields![field.key]) {
          return { ...field, ...modifications.updateFields![field.key] };
        }
        return field;
      });
    }

    // Agregar nuevos campos
    if (modifications.addFields) {
      newConfig.fields.push(...modifications.addFields);
    }

    // Actualizar opciones
    if (modifications.updateOptions) {
      Object.assign(newConfig, modifications.updateOptions);
    }

    return newConfig;
  }
}
