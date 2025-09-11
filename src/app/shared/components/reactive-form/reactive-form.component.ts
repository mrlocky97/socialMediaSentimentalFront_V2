import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormConfig, FormFieldConfig, FormSubmitEvent } from './interfaces/form-field.interface';

@Component({
  selector: 'app-reactive-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSliderModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './reactive-form.component.html',
  styleUrls: ['./reactive-form.component.css'],
})
export class ReactiveFormComponent implements OnInit, OnDestroy {
  @Input() config!: FormConfig;
  @Input() loading = false;
  @Input() initialData?: any;
  @Output() formSubmit = new EventEmitter<FormSubmitEvent>();
  @Output() formChange = new EventEmitter<any>();
  @Output() formReset = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.setupFormSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    const formControls: any = {};

    this.config.fields.forEach((field) => {
      const validators = field.validators || [];
      if (field.required) {
        validators.push(Validators.required);
      }

      const initialValue =
        this.initialData?.[field.key] ?? field.value ?? this.getDefaultValue(field);

      formControls[field.key] = [
        { value: initialValue, disabled: field.disabled || false },
        validators,
      ];
    });

    this.form = this.fb.group(formControls);
  }

  private getDefaultValue(field: FormFieldConfig): any {
    switch (field.type) {
      case 'checkbox':
        return false;
      case 'select':
        return field.multiple ? [] : null;
      case 'number':
      case 'range':
        return field.min || 0;
      default:
        return '';
    }
  }

  private setupFormSubscription(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.formChange.emit(value);
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const submitEvent: FormSubmitEvent = {
        value: this.form.value,
        valid: this.form.valid,
        form: this.form,
      };
      this.formSubmit.emit(submitEvent);
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  onReset(): void {
    this.form.reset();
    this.buildForm();
    this.formReset.emit();
  }

  onFileChange(event: any, fieldKey: string): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileValue = this.config.fields.find((f) => f.key === fieldKey)?.multiple
        ? Array.from(files)
        : files[0];
      this.form.patchValue({ [fieldKey]: fileValue });
    }
  }

  getFieldError(fieldKey: string): string | null {
    const field = this.form.get(fieldKey);
    if (field && field.invalid && (field.dirty || field.touched)) {
      const fieldConfig = this.config.fields.find((f) => f.key === fieldKey);
      const errors = field.errors;

      if (errors) {
        // Check for custom error messages first
        if (fieldConfig?.errorMessages) {
          for (const errorKey in errors) {
            if (fieldConfig.errorMessages[errorKey]) {
              return fieldConfig.errorMessages[errorKey];
            }
          }
        }

        // Default error messages
        if (errors['required']) return `${fieldConfig?.label} is required`;
        if (errors['email']) return 'Please enter a valid email';
        if (errors['min']) return `Minimum value is ${errors['min'].min}`;
        if (errors['max']) return `Maximum value is ${errors['max'].max}`;
        if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength}`;
        if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;
        if (errors['pattern']) return 'Invalid format';
      }
    }
    return null;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
  }

  // Public methods for external control
  resetForm(): void {
    this.onReset();
  }

  updateFormData(data: any): void {
    this.form.patchValue(data);
  }

  getFormValue(): any {
    return this.form.value;
  }

  getFormControl(fieldKey: string) {
    return this.form.get(fieldKey);
  }

  isFieldInvalid(fieldKey: string): boolean {
    const field = this.form.get(fieldKey);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFormValid(): boolean {
    return this.form.valid;
  }
}
