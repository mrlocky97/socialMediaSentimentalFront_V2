import { ValidatorFn } from '@angular/forms';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime-local'
  | 'file'
  | 'range'
  | 'color';

export interface FormFieldOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FormFieldConfig {
  key: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  value?: any;
  validators?: ValidatorFn[];
  options?: FormFieldOption[]; // Para select y radio
  multiple?: boolean; // Para select múltiple
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // Para file input
  rows?: number; // Para textarea
  cols?: number; // Para textarea
  hint?: string;
  errorMessages?: { [key: string]: string };
  cssClass?: string;
  attributes?: { [key: string]: any };
}

export interface FormConfig {
  fields: FormFieldConfig[];
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
  cssClass?: string;
}

export interface FormSubmitEvent {
  value: any;
  valid: boolean;
  form: any;
}
