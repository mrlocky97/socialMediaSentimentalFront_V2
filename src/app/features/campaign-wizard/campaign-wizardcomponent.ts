import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

export interface CampaignStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface CampaignFormData {
  basic: {
    name: string;
    description: string;
    type: 'hashtag' | 'keyword' | 'user';
  };
  targeting: {
    hashtags: string[];
    keywords: string[];
    mentions: string[];
  };
  settings: {
    startDate: string;
    endDate: string;
    maxTweets: number;
    sentimentAnalysis: boolean;
  };
}

@Component({
  selector: 'app-campaign-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslocoModule,
  ],
  templateUrl: './campaign-wizard.component.html',
  styleUrls: ['./campaign-wizard.component.css'],
})
export class CampaignWizardComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Reactive state
  readonly currentStep = signal(0);
  readonly isLoading = signal(false);
  readonly validationErrors = signal<string[]>([]);

  // Steps configuration - ahora es de solo lectura
  private readonly stepsInitial: CampaignStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Define campaign name, description and type',
      isCompleted: false,
    },
    {
      id: 'targeting',
      title: 'Targeting Setup',
      description: 'Configure hashtags, keywords and mentions',
      isCompleted: false,
    },
    {
      id: 'settings',
      title: 'Campaign Settings',
      description: 'Set dates, limits and analysis options',
      isCompleted: false,
    },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Review configuration and create campaign',
      isCompleted: false,
    },
  ];

  // Form groups
  readonly basicInfoForm: FormGroup;
  readonly targetingForm: FormGroup;
  readonly settingsForm: FormGroup;

  // Computed properties
  readonly steps = computed(() => {
    const currentStepVal = this.currentStep();
    const completed = [
      this.basicInfoForm.valid,
      this.targetingForm.valid,
      this.settingsForm.valid,
      false, // El paso de revisión no tiene formulario
    ];

    return this.stepsInitial.map((step, index) => ({
      ...step,
      isCompleted: completed[index] || false,
    }));
  });

  readonly isFirstStep = computed(() => this.currentStep() === 0);
  readonly isLastStep = computed(() => this.currentStep() === this.stepsInitial.length - 1);
  readonly isFormValid = computed(
    () => this.basicInfoForm.valid && this.targetingForm.valid && this.settingsForm.valid
  );
  readonly canCreateCampaign = computed(() => this.isFormValid());

  readonly canProceedToNext = computed(() => {
    const currentStepIndex = this.currentStep();
    switch (currentStepIndex) {
      case 0:
        return this.basicInfoForm.valid;
      case 1:
        return this.targetingForm.valid;
      case 2:
        return this.settingsForm.valid;
      default:
        return false;
    }
  });

  constructor() {
    // Initialize forms
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['', Validators.required],
    });

    this.targetingForm = this.fb.group(
      {
        hashtags: this.fb.array([]),
        keywords: this.fb.array([]),
      },
      { validators: this.targetingValidator }
    );

    this.settingsForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      maxTweets: [1000, [Validators.required, Validators.min(100), Validators.max(10000)]],
      sentimentAnalysis: [true],
      realTimeNotifications: [false],
    });

    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    // Usamos takeUntilDestroyed para manejar automáticamente la desuscripción
    this.basicInfoForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.validationErrors.set([]);
    });

    this.targetingForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.validationErrors.set([]);
    });

    this.settingsForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.validationErrors.set([]);
    });
  }

  // Custom validator for targeting form
  private targetingValidator = (formGroup: FormGroup) => {
    const hashtags = formGroup.get('hashtags') as FormArray;
    const keywords = formGroup.get('keywords') as FormArray;

    if (hashtags && keywords) {
      const hasHashtags = hashtags.length > 0 && hashtags.value.some((h: string) => h.trim());
      const hasKeywords = keywords.length > 0 && keywords.value.some((k: string) => k.trim());

      if (!hasHashtags && !hasKeywords) {
        return { noTargeting: true };
      }
    }
    return null;
  };

  // Form Array getters
  get hashtags(): FormArray {
    return this.targetingForm.get('hashtags') as FormArray;
  }

  get keywords(): FormArray {
    return this.targetingForm.get('keywords') as FormArray;
  }

  // Array manipulation methods
  addHashtag(): void {
    this.hashtags.push(this.fb.control('', Validators.required));
  }

  removeHashtag(index: number): void {
    if (this.hashtags.length > 0) {
      this.hashtags.removeAt(index);
    }
  }

  addKeyword(): void {
    this.keywords.push(this.fb.control('', Validators.required));
  }

  removeKeyword(index: number): void {
    if (this.keywords.length > 0) {
      this.keywords.removeAt(index);
    }
  }

  // Navigation methods
  nextStep(): void {
    if (this.canProceedToNext()) {
      this.currentStep.update((step) => Math.min(step + 1, this.stepsInitial.length - 1));
    } else {
      this.markCurrentFormAsTouched();
    }
  }

  previousStep(): void {
    this.currentStep.update((step) => Math.max(step - 1, 0));
  }

  private markCurrentFormAsTouched(): void {
    const forms = [this.basicInfoForm, this.targetingForm, this.settingsForm];
    const currentForm = forms[this.currentStep()];

    if (currentForm) {
      currentForm.markAllAsTouched();
    }
  }

  // Campaign creation
  async createCampaign(): Promise<void> {
    if (!this.canCreateCampaign()) {
      this.validationErrors.set(['Please complete all required fields']);
      this.markAllFormsAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.validationErrors.set([]);

    const campaignData: CampaignFormData = {
      basic: this.basicInfoForm.value,
      targeting: {
        hashtags: this.hashtags.value.filter((h: string) => h.trim()),
        keywords: this.keywords.value.filter((k: string) => k.trim()),
        mentions: [],
      },
      settings: this.settingsForm.value,
    };

    try {
      // Simulate API call - en un caso real, usarías un servicio HTTP
      await this.simulateApiCall(campaignData);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.validationErrors.set(['Failed to create campaign. Please try again.']);
      console.error('Campaign creation error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async simulateApiCall(data: CampaignFormData): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Campaign created:', data);
        resolve();
      }, 2000);
    });
  }

  private markAllFormsAsTouched(): void {
    [this.basicInfoForm, this.targetingForm, this.settingsForm].forEach((form) => {
      form.markAllAsTouched();
    });
  }

  /**
   * Returns true if the step at the given index has an error.
   * Update this logic to match your form validation structure.
   */
  hasStepError(index: number): boolean {
    switch (index) {
      case 0:
        return this.basicInfoForm && this.basicInfoForm.invalid && this.basicInfoForm.touched;
      case 1:
        return this.targetingForm && this.targetingForm.invalid && this.targetingForm.touched;
      case 2:
        return this.settingsForm && this.settingsForm.invalid && this.settingsForm.touched;
      case 3:
        // Review step usually doesn't have errors
        return false;
      default:
        return false;
    }
  }

  campaignTypeOptions() {
    return [
      { value: 'brand', label: 'Brand Monitoring', icon: 'business' },
      { value: 'event', label: 'Event Tracking', icon: 'event' },
      { value: 'product', label: 'Product Launch', icon: 'local_offer' },
      { value: 'custom', label: 'Custom', icon: 'tune' },
    ];
  }

  formatHashtag(index: number): void {
    const hashtagsArray = this.targetingForm.get('hashtags') as FormArray;
    if (hashtagsArray && Array.isArray(hashtagsArray.controls)) {
      const control = hashtagsArray.controls[index];
      let value = control.value || '';
      // Ensure hashtag starts with #
      if (value && !value.startsWith('#')) {
        value = '#' + value.replace(/^#+/, '');
        control.setValue(value);
      }
    }
  }

  maxHashtags(): number {
    return 10; // Set your desired maximum number of hashtags
  }

  maxKeywords(): number {
    return 10; // Set your desired maximum number of keywords
  }

  minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  maxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  }

  campaignDuration(): number {
    const startDate = this.settingsForm.get('startDate')?.value;
    const endDate = this.settingsForm.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  }

  getCampaignTypeLabel(value: string): string {
    const option = this.campaignTypeOptions().find((opt) => opt.value === value);
    return option ? option.label : value;
  }

  formatDateRange(): string {
    const startDate = this.settingsForm.get('startDate')?.value;
    const endDate = this.settingsForm.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString();
      const end = new Date(endDate).toLocaleDateString();
      return `${start} - ${end}`;
    } else if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString()}`;
    }
    return 'Not specified';
  }

  getHashtagValues(): string[] {
    return this.hashtags.value.filter((h: string) => h.trim()).map((h: string) => h.trim());
  }

  getKeywordValues(): string[] {
    return this.keywords.value.filter((k: string) => k.trim()).map((k: string) => k.trim());
  }

  hasEnabledFeatures(): boolean {
    return (
      this.settingsForm.get('sentimentAnalysis')?.value ||
      this.settingsForm.get('realTimeNotifications')?.value
    );
  }

  totalSteps(): number {
    return this.stepsInitial.length;
  }
}
