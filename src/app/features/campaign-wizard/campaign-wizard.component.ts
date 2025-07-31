import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

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
    MatCardModule
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
export class CampaignWizardComponent {
  private fb = new FormBuilder();

  // Reactive state
  currentStep = signal(0);
  isLoading = signal(false);
  validationErrors = signal<string[]>([]);

  // Form groups
  basicInfoForm: FormGroup;
  targetingForm: FormGroup;
  settingsForm: FormGroup;

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

  // Computed properties
  canProceedToNext = computed(() => {
    const currentStepIndex = this.currentStep();
    switch (currentStepIndex) {
      case 0: return this.basicInfoForm.valid;
      case 1: return this.targetingForm.valid;
      case 2: return this.settingsForm.valid;
      default: return false;
    }
  });

  constructor(private router: Router) {
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
  createCampaign(): void {
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

    // Simulate API call
    setTimeout(() => {
      console.log('Campaign created:', campaignData);
      this.isLoading.set(false);
      
      // Navigate to campaigns list
      this.router.navigate(['/dashboard']);
    }, 2000);
  }
}
