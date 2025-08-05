import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';

// RxJS imports
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  of,
  timer
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  throttleTime
} from 'rxjs/operators';

import { RxjsBaseService } from '../../core/services/rxjs-base.service';
import { CampaignWizardService } from './services/campaign-wizard.service';

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
    MatChipsModule
  ],
  template: `
    <div class="campaign-wizard-container">
      <!-- Header -->
      <div class="wizard-header">
        <h1>
          <mat-icon>campaign</mat-icon>
          Create New Campaign
        </h1>
        <p>Follow the steps below to set up your social media monitoring campaign</p>
      </div>

      <!-- Stepper -->
      <mat-stepper #stepper [selectedIndex]="currentStep()" orientation="horizontal" linear>

        <!-- Step 1: Basic Information -->
        <mat-step [completed]="steps[0].isCompleted">
          <ng-template matStepLabel>{{ steps[0].title }}</ng-template>

          <div class="step-content">
            <h2>{{ steps[0].title }}</h2>
            <p>{{ steps[0].description }}</p>

            <form [formGroup]="basicInfoForm" class="step-form">
              <mat-card>
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Campaign Name</mat-label>
                    <input matInput formControlName="name" placeholder="Enter campaign name">
                    <mat-icon matSuffix>title</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" placeholder="Describe your campaign" rows="3"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Campaign Type</mat-label>
                    <mat-select formControlName="type">
                      <mat-option value="hashtag">Hashtag Tracking</mat-option>
                      <mat-option value="keyword">Keyword Monitoring</mat-option>
                      <mat-option value="user">User Mentions</mat-option>
                    </mat-select>
                  </mat-form-field>
                </mat-card-content>
              </mat-card>
            </form>
          </div>
        </mat-step>

        <!-- Step 2: Targeting Setup -->
        <mat-step [completed]="steps[1].isCompleted">
          <ng-template matStepLabel>{{ steps[1].title }}</ng-template>

          <div class="step-content">
            <h2>{{ steps[1].title }}</h2>
            <p>{{ steps[1].description }}</p>

            <form [formGroup]="targetingForm" class="step-form">
              <div class="targeting-grid">

                <!-- Hashtags -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Hashtags</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div formArrayName="hashtags">
                      @for (control of hashtags.controls; track $index) {
                        <div class="tag-input-row">
                          <mat-form-field appearance="outline" class="tag-field">
                            <input matInput [formControlName]="$index" placeholder="#example">
                          </mat-form-field>
                          <button mat-icon-button color="warn" (click)="removeHashtag($index)" type="button">
                            <mat-icon>remove_circle</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                    <button mat-stroked-button (click)="addHashtag()" type="button">
                      <mat-icon>add</mat-icon>
                      Add Hashtag
                    </button>
                  </mat-card-content>
                </mat-card>

                <!-- Keywords -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Keywords</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div formArrayName="keywords">
                      @for (control of keywords.controls; track $index) {
                        <div class="tag-input-row">
                          <mat-form-field appearance="outline" class="tag-field">
                            <input matInput [formControlName]="$index" placeholder="keyword">
                          </mat-form-field>
                          <button mat-icon-button color="warn" (click)="removeKeyword($index)" type="button">
                            <mat-icon>remove_circle</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                    <button mat-stroked-button (click)="addKeyword()" type="button">
                      <mat-icon>add</mat-icon>
                      Add Keyword
                    </button>
                  </mat-card-content>
                </mat-card>
              </div>
            </form>
          </div>
        </mat-step>

        <!-- Step 3: Settings -->
        <mat-step [completed]="steps[2].isCompleted">
          <ng-template matStepLabel>{{ steps[2].title }}</ng-template>

          <div class="step-content">
            <h2>{{ steps[2].title }}</h2>
            <p>{{ steps[2].description }}</p>

            <form [formGroup]="settingsForm" class="step-form">
              <mat-card>
                <mat-card-content>
                  <div class="settings-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Start Date</mat-label>
                      <input matInput type="date" formControlName="startDate">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>End Date</mat-label>
                      <input matInput type="date" formControlName="endDate">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Maximum Tweets</mat-label>
                      <input matInput type="number" formControlName="maxTweets" min="100" max="10000">
                    </mat-form-field>

                    <mat-checkbox formControlName="sentimentAnalysis" class="full-width">
                      Enable Sentiment Analysis
                    </mat-checkbox>
                  </div>
                </mat-card-content>
              </mat-card>
            </form>
          </div>
        </mat-step>

        <!-- Step 4: Review -->
        <mat-step [completed]="steps[3].isCompleted">
          <ng-template matStepLabel>{{ steps[3].title }}</ng-template>

          <div class="step-content">
            <h2>{{ steps[3].title }}</h2>
            <p>{{ steps[3].description }}</p>

            @if (isFormValid()) {
              <mat-card>
                <mat-card-content>
                  <h3>Campaign Summary</h3>
                  <p><strong>Name:</strong> {{ basicInfoForm.get('name')?.value }}</p>
                  <p><strong>Type:</strong> {{ basicInfoForm.get('type')?.value }}</p>
                  <p><strong>Max Tweets:</strong> {{ settingsForm.get('maxTweets')?.value }}</p>

                  @if (validationErrors().length > 0) {
                    <div class="error-list">
                      <h4>Please fix these issues:</h4>
                      <ul>
                        @for (error of validationErrors(); track error) {
                          <li>{{ error }}</li>
                        }
                      </ul>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-step>
      </mat-stepper>

      <!-- Navigation -->
      <div class="wizard-navigation">
        <button mat-button [disabled]="isFirstStep()" (click)="previousStep()" type="button">
          <mat-icon>chevron_left</mat-icon>
          Previous
        </button>

        @if (!isLastStep()) {
          <button mat-raised-button color="primary" [disabled]="!canProceedToNext()" (click)="nextStep()" type="button">
            Next
            <mat-icon>chevron_right</mat-icon>
          </button>
        } @else {
          <button mat-raised-button color="primary" [disabled]="!canCreateCampaign() || isLoading()" (click)="createCampaign()" type="button">
            @if (isLoading()) {
              Creating...
            } @else {
              Create Campaign
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .campaign-wizard-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .wizard-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .wizard-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #1976d2;
    }

    .step-content {
      padding: 24px 0;
      min-height: 400px;
    }

    .step-content h2 {
      color: #333;
      margin-bottom: 8px;
    }

    .step-form {
      max-width: 600px;
      margin: 0 auto;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .targeting-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .tag-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .tag-field {
      flex: 1;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
    }

    .wizard-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .error-list {
      background: #ffebee;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #f44336;
    }

    .error-list ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .error-list li {
      color: #d32f2f;
    }

    @media (max-width: 768px) {
      .campaign-wizard-container {
        padding: 16px;
      }

      .targeting-grid {
        grid-template-columns: 1fr;
      }

      .settings-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CampaignWizardComponent implements OnInit {
  // Dependency injection with modern Angular patterns
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rxjsService = inject(RxjsBaseService);
  private readonly campaignWizardService = inject(CampaignWizardService);

  // ================================
  // REACTIVE STATE WITH SIGNALS
  // ================================

  currentStep = signal(0);
  isLoading = signal(false);
  validationErrors = signal<string[]>([]);
  nameValidationStatus = signal<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  autoSaveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ================================
  // RXJS SUBJECTS FOR REACTIVE FLOWS
  // ================================

  private readonly nameValidationSubject = new BehaviorSubject<string>('');
  private readonly stepChangeSubject = new Subject<number>();
  private readonly saveProgressSubject = new Subject<void>();

  // ================================
  // FORM GROUPS
  // ================================

  basicInfoForm: FormGroup;
  targetingForm: FormGroup;
  settingsForm: FormGroup;

  // ================================
  // REACTIVE STREAMS (INITIALIZED IN ngOnInit)
  // ================================

  nameValidation$!: Observable<{ name: string; isValid: boolean }>;
  stepValidation$!: Observable<{ isValid: boolean; errors: string[] }>;
  autoSave$!: Observable<boolean>;
  formData$!: Observable<CampaignFormData>;

  // Steps configuration
  steps: CampaignStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Define campaign name, description and type',
      isCompleted: false
    },
    {
      id: 'targeting',
      title: 'Targeting Setup',
      description: 'Configure hashtags, keywords and mentions',
      isCompleted: false
    },
    {
      id: 'settings',
      title: 'Campaign Settings',
      description: 'Set dates, limits and analysis options',
      isCompleted: false
    },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Review configuration and create campaign',
      isCompleted: false
    }
  ];

  // ================================
  // COMPUTED PROPERTIES
  // ================================

  canProceedToNext = computed(() => {
    const currentStepIndex = this.currentStep();
    switch (currentStepIndex) {
      case 0: return this.basicInfoForm?.valid && this.nameValidationStatus() !== 'invalid';
      case 1: return this.targetingForm?.valid && this.hasValidTargeting();
      case 2: return this.settingsForm?.valid;
      default: return false;
    }
  });

  ngOnInit(): void {
    this.setupReactiveStreams();
    this.loadSavedProgress();
  }

  constructor() {
    // Initialize forms
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['', Validators.required]
    });

    this.targetingForm = this.fb.group({
      hashtags: this.fb.array([]),
      keywords: this.fb.array([])
    });

    this.settingsForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      maxTweets: [1000, [Validators.required, Validators.min(100), Validators.max(10000)]],
      sentimentAnalysis: [true]
    });

    this.setupFormValidation();
  }

  // ================================
  // REACTIVE SETUP METHODS
  // ================================

  private setupReactiveStreams(): void {
    // Real-time name validation with debounce
    this.nameValidation$ = this.nameValidationSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(name => name.length >= 3),
      tap(() => this.nameValidationStatus.set('checking')),
      switchMap(name =>
        this.rxjsService.validateAsync(name, 'validate-campaign-name').pipe(
          map(isValid => ({ name, isValid })),
          catchError(() => of({ name, isValid: false }))
        )
      ),
      tap(result => {
        this.nameValidationStatus.set(result.isValid ? 'valid' : 'invalid');
        if (!result.isValid) {
          this.basicInfoForm.get('name')?.setErrors({ 'nameTaken': true });
        } else {
          // Clear name validation error if valid
          const nameControl = this.basicInfoForm.get('name');
          if (nameControl?.hasError('nameTaken')) {
            const errors = { ...nameControl.errors };
            delete errors['nameTaken'];
            nameControl.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      }),
      shareReplay(1)
    );

    // Step validation streams
    this.stepValidation$ = this.stepChangeSubject.pipe(
      switchMap(stepIndex => this.validateStepAsync(stepIndex)),
      tap(({ isValid, errors }) => {
        if (!isValid) {
          this.validationErrors.set(errors);
        } else {
          this.validationErrors.set([]);
        }
      })
    );

    // Auto-save progress every 30 seconds
    this.autoSave$ = this.saveProgressSubject.pipe(
      throttleTime(2000), // Prevent too frequent saves
      tap(() => this.autoSaveStatus.set('saving')),
      switchMap(() => this.saveFormProgress()),
      tap(success => {
        this.autoSaveStatus.set(success ? 'saved' : 'error');
        // Reset status after 3 seconds
        timer(3000).pipe(take(1)).subscribe(() => {
          this.autoSaveStatus.set('idle');
        });
      }),
      catchError(error => {
        console.warn('Auto-save failed:', error);
        this.autoSaveStatus.set('error');
        return of(false);
      })
    );

    // Combined form data stream
    this.formData$ = combineLatest([
      this.basicInfoForm.valueChanges.pipe(startWith(this.basicInfoForm.value)),
      this.targetingForm.valueChanges.pipe(startWith(this.targetingForm.value)),
      this.settingsForm.valueChanges.pipe(startWith(this.settingsForm.value))
    ]).pipe(
      map(([basic, targeting, settings]) => ({
        basic,
        targeting: {
          hashtags: targeting.hashtags?.filter((h: string) => h.trim()) || [],
          keywords: targeting.keywords?.filter((k: string) => k.trim()) || [],
          mentions: targeting.mentions?.filter((m: string) => m.trim()) || []
        },
        settings
      } as CampaignFormData)),
      shareReplay(1)
    );

    // Subscribe to name changes for validation
    this.basicInfoForm.get('name')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(name => {
      if (name && name.length >= 3) {
        this.nameValidationSubject.next(name);
      }
    });

    // Subscribe to auto-save trigger
    this.autoSave$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private validateStepAsync(stepIndex: number): Observable<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let isValid = true;

    switch (stepIndex) {
      case 0:
        if (!this.basicInfoForm.valid) {
          isValid = false;
          if (this.basicInfoForm.get('name')?.hasError('required')) {
            errors.push('Campaign name is required');
          }
          if (this.basicInfoForm.get('name')?.hasError('minlength')) {
            errors.push('Campaign name must be at least 3 characters');
          }
          if (this.basicInfoForm.get('description')?.hasError('required')) {
            errors.push('Description is required');
          }
          if (this.basicInfoForm.get('type')?.hasError('required')) {
            errors.push('Campaign type is required');
          }
        }
        break;
      case 1:
        if (!this.hasValidTargeting()) {
          isValid = false;
          errors.push('At least one targeting option (hashtag, keyword, or mention) is required');
        }
        break;
      case 2:
        if (!this.settingsForm.valid) {
          isValid = false;
          if (this.settingsForm.get('startDate')?.hasError('required')) {
            errors.push('Start date is required');
          }
          if (this.settingsForm.get('endDate')?.hasError('required')) {
            errors.push('End date is required');
          }
          if (this.settingsForm.get('maxTweets')?.hasError('min')) {
            errors.push('Maximum tweets must be at least 100');
          }
        }
        break;
    }

    return of({ isValid, errors });
  }

  private saveFormProgress(): Observable<boolean> {
    try {
      const formData = {
        basic: this.basicInfoForm.value,
        targeting: this.targetingForm.value,
        settings: this.settingsForm.value,
        currentStep: this.currentStep(),
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('campaign-wizard-progress', JSON.stringify(formData));
      return of(true);
    } catch (error) {
      console.error('Failed to save progress:', error);
      return of(false);
    }
  }

  private loadSavedProgress(): void {
    try {
      const savedData = localStorage.getItem('campaign-wizard-progress');
      if (savedData) {
        const progress = JSON.parse(savedData);

        // Restore form values
        if (progress.basic) {
          this.basicInfoForm.patchValue(progress.basic);
        }
        if (progress.targeting) {
          this.targetingForm.patchValue(progress.targeting);
        }
        if (progress.settings) {
          this.settingsForm.patchValue(progress.settings);
        }

        // Restore current step
        if (progress.currentStep) {
          this.currentStep.set(progress.currentStep);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved progress:', error);
    }
  }

  private hasValidTargeting(): boolean {
    const hashtags = this.hashtags.value.filter((h: string) => h.trim()).length > 0;
    const keywords = this.keywords.value.filter((k: string) => k.trim()).length > 0;
    return hashtags || keywords;
  }

  private setupFormValidation(): void {
    this.basicInfoForm.valueChanges.subscribe(() => {
      this.updateStepCompletion(0, this.basicInfoForm.valid);
    });

    this.targetingForm.valueChanges.subscribe(() => {
      this.updateStepCompletion(1, this.targetingForm.valid);
    });

    this.settingsForm.valueChanges.subscribe(() => {
      this.updateStepCompletion(2, this.settingsForm.valid);
    });
  }

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
    this.hashtags.removeAt(index);
  }

  addKeyword(): void {
    this.keywords.push(this.fb.control('', Validators.required));
  }

  removeKeyword(index: number): void {
    this.keywords.removeAt(index);
  }

  // Navigation methods
  nextStep(): void {
    if (this.canProceedToNext()) {
      this.currentStep.update(step => Math.min(step + 1, this.steps.length - 1));
    }
  }

  previousStep(): void {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  private updateStepCompletion(stepIndex: number, isCompleted: boolean): void {
    this.steps[stepIndex].isCompleted = isCompleted;
  }

  // Helper methods
  isFirstStep(): boolean {
    return this.currentStep() === 0;
  }

  isLastStep(): boolean {
    return this.currentStep() === this.steps.length - 1;
  }

  isFormValid(): boolean {
    return this.basicInfoForm.valid && this.targetingForm.valid && this.settingsForm.valid;
  }

  canCreateCampaign(): boolean {
    return this.isFormValid();
  }

  // Campaign creation
  async createCampaign(): Promise<void> {
    if (!this.canCreateCampaign()) {
      this.validationErrors.set(['Please complete all required fields']);
      return;
    }

    this.isLoading.set(true);
    this.validationErrors.set([]);

    const campaignData: CampaignFormData = {
      basic: this.basicInfoForm.value,
      targeting: {
        hashtags: this.hashtags.value.filter((h: string) => h.trim()),
        keywords: this.keywords.value.filter((k: string) => k.trim()),
        mentions: []
      },
      settings: this.settingsForm.value
    };

    try {
      // Use the campaign wizard service with backend fallback
      const result = await this.campaignWizardService.createCampaign(campaignData);
      console.log('Campaign created successfully:', result);

      // Clear saved progress after successful creation
      localStorage.removeItem('campaign-wizard-progress');

      // Navigate to campaigns list or dashboard
      await this.router.navigate(['/dashboard/home']);
    } catch (error) {
      console.error('Error creating campaign:', error);
      this.validationErrors.set(['Error creating campaign. Please try again.']);
    } finally {
      this.isLoading.set(false);
    }
  }
}
