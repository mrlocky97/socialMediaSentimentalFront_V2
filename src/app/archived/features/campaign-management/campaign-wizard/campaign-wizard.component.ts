/* =====================================
   CAMPAIGN WIZARD COMPONENT
   Step-by-step campaign creation wizard
   ===================================== */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';

import { CampaignStatus, CampaignType, SocialPlatform } from '../models/campaign.model';
import { CampaignService } from '../services/campaign.service';

interface WizardStep {
  label: string;
  description: string;
  completed: boolean;
  valid: boolean;
}

@Component({
  selector: 'app-campaign-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    MatStepperModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './campaign-wizard.component.html',
  styleUrls: ['./campaign-wizard.component.css']
})
export class CampaignWizardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly campaignService = inject(CampaignService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state
  currentStep = signal(0);
  isSubmitting = signal(false);

  // Form groups for each step
  basicInfoForm!: FormGroup;
  targetingForm!: FormGroup;
  budgetForm!: FormGroup;
  contentForm!: FormGroup;
  reviewForm!: FormGroup;

  // Enums for templates
  CampaignType = CampaignType;
  SocialPlatform = SocialPlatform;

  // Steps configuration
  steps: WizardStep[] = [
    {
      label: 'campaigns.wizard.steps.basicInfo',
      description: 'campaigns.wizard.steps.basicInfoDesc',
      completed: false,
      valid: false
    },
    {
      label: 'campaigns.wizard.steps.targeting',
      description: 'campaigns.wizard.steps.targetingDesc',
      completed: false,
      valid: false
    },
    {
      label: 'campaigns.wizard.steps.budget',
      description: 'campaigns.wizard.steps.budgetDesc',
      completed: false,
      valid: false
    },
    {
      label: 'campaigns.wizard.steps.content',
      description: 'campaigns.wizard.steps.contentDesc',
      completed: false,
      valid: false
    },
    {
      label: 'campaigns.wizard.steps.review',
      description: 'campaigns.wizard.steps.reviewDesc',
      completed: false,
      valid: false
    }
  ];

  ngOnInit(): void {
    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Step 1: Basic Information
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type: ['', Validators.required],
      platforms: [[], Validators.required],
      tags: ['']
    });

    // Step 2: Targeting
    this.targetingForm = this.fb.group({
      ageMin: [18, [Validators.required, Validators.min(13), Validators.max(100)]],
      ageMax: [65, [Validators.required, Validators.min(13), Validators.max(100)]],
      gender: ['all'],
      languages: [['en'], Validators.required],
      countries: [[], Validators.required],
      interests: [[]],
      customAudiences: [[]]
    });

    // Step 3: Budget & Timeline
    this.budgetForm = this.fb.group({
      totalBudget: ['', [Validators.required, Validators.min(10)]],
      dailyBudget: ['', [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      bidStrategy: ['automatic', Validators.required]
    });

    // Step 4: Content
    this.contentForm = this.fb.group({
      creatives: this.fb.array([]),
      ctaText: ['', Validators.required],
      ctaUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      adText: ['', [Validators.required, Validators.maxLength(280)]],
      hashtags: ['']
    });

    // Step 5: Review
    this.reviewForm = this.fb.group({
      agreedToTerms: [false, Validators.requiredTrue],
      immediateStart: [true]
    });

    // Initialize creatives array
    this.addCreative();

    // Watch for form changes to update step validity
    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    const forms = [
      this.basicInfoForm,
      this.targetingForm,
      this.budgetForm,
      this.contentForm,
      this.reviewForm
    ];

    forms.forEach((form, index) => {
      form.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(status => {
          this.steps[index].valid = status === 'VALID';
        });
    });
  }

  get creatives(): FormArray {
    return this.contentForm.get('creatives') as FormArray;
  }

  get creativesArray(): FormArray {
    return this.contentForm.get('creatives') as FormArray;
  }

  getCreativeAt(index: number): FormGroup {
    return this.creativesArray.at(index) as FormGroup;
  }

  addCreative(): void {
    const creativeGroup = this.fb.group({
      type: ['image', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      imageUrl: [''],
      videoUrl: [''],
      platforms: [[], Validators.required]
    });

    this.creatives.push(creativeGroup);
  }

  removeCreative(index: number): void {
    if (this.creatives.length > 1) {
      this.creatives.removeAt(index);
    }
  }

  nextStep(): void {
    const currentStepIndex = this.currentStep();

    if (this.isCurrentStepValid()) {
      this.steps[currentStepIndex].completed = true;

      if (currentStepIndex < this.steps.length - 1) {
        this.currentStep.set(currentStepIndex + 1);
      }
    }
  }

  previousStep(): void {
    const currentStepIndex = this.currentStep();
    if (currentStepIndex > 0) {
      this.currentStep.set(currentStepIndex - 1);
    }
  }

  goToStep(stepIndex: number): void {
    if (stepIndex <= this.getMaxAccessibleStep()) {
      this.currentStep.set(stepIndex);
    }
  }

  private getMaxAccessibleStep(): number {
    for (let i = 0; i < this.steps.length; i++) {
      if (!this.steps[i].completed && !this.isStepValid(i)) {
        return i;
      }
    }
    return this.steps.length - 1;
  }

  public isCurrentStepValid(): boolean {
    return this.isStepValid(this.currentStep());
  }

  private isStepValid(stepIndex: number): boolean {
    const forms = [
      this.basicInfoForm,
      this.targetingForm,
      this.budgetForm,
      this.contentForm,
      this.reviewForm
    ];

    return forms[stepIndex]?.valid || false;
  }

  async submitCampaign(): Promise<void> {
    if (!this.isAllStepsValid()) {
      this.snackBar.open('Por favor, completa todos los pasos correctamente', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      const campaignData = this.buildCampaignData();

      this.campaignService.createCampaign(campaignData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('¡Campaña creada exitosamente!', 'Cerrar', {
              duration: 3000
            });
            this.router.navigate(['/campaigns']);
          },
          error: (error) => {
            console.error('Error creating campaign:', error);
            this.snackBar.open('Error al crear la campaña. Intenta nuevamente.', 'Cerrar', {
              duration: 5000
            });
          },
          complete: () => {
            this.isSubmitting.set(false);
          }
        });

    } catch (error) {
      console.error('Error building campaign data:', error);
      this.snackBar.open('Error al procesar los datos. Intenta nuevamente.', 'Cerrar', {
        duration: 5000
      });
      this.isSubmitting.set(false);
    }
  }

  public isAllStepsValid(): boolean {
    return this.steps.every(step => step.valid);
  }

  private buildCampaignData(): any {
    const basicInfo = this.basicInfoForm.value;
    const targeting = this.targetingForm.value;
    const budget = this.budgetForm.value;
    const content = this.contentForm.value;
    const review = this.reviewForm.value;

    return {
      name: basicInfo.name,
      description: basicInfo.description,
      type: basicInfo.type,
      platforms: basicInfo.platforms,
      status: review.immediateStart ? CampaignStatus.ACTIVE : CampaignStatus.SCHEDULED,
      budget: {
        total: parseFloat(budget.totalBudget),
        spent: 0,
        dailyLimit: parseFloat(budget.dailyBudget),
        currency: 'USD'
      },
      timeline: {
        startDate: budget.startDate,
        endDate: budget.endDate
      },
      targeting: {
        demographics: {
          ageRange: {
            min: targeting.ageMin,
            max: targeting.ageMax
          },
          gender: targeting.gender,
          languages: targeting.languages
        },
        geographic: {
          countries: targeting.countries,
          cities: [],
          radius: null
        },
        interests: targeting.interests || [],
        customAudiences: targeting.customAudiences || [],
        lookalikeSources: []
      },
      content: content.creatives.map((creative: any) => ({
        type: creative.type,
        title: creative.title,
        description: creative.description,
        mediaUrl: creative.imageUrl || creative.videoUrl || '',
        platforms: creative.platforms,
        callToAction: {
          text: content.ctaText,
          url: content.ctaUrl
        }
      })),
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        engagements: 0,
        reach: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        cpa: 0,
        roas: 0,
        sentimentScore: 0,
        lastUpdated: new Date().toISOString()
      },
      tags: basicInfo.tags ? basicInfo.tags.split(',').map((tag: string) => tag.trim()) : []
    };
  }

  private calculateDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  cancel(): void {
    if (confirm('¿Estás seguro de que quieres cancelar? Se perderán todos los cambios.')) {
      this.router.navigate(['/campaigns']);
    }
  }

  // Additional methods for template functionality
  togglePlatform(platformKey: string): void {
    const currentPlatforms = this.basicInfoForm.get('platforms')?.value || [];
    const index = currentPlatforms.indexOf(platformKey);

    if (index === -1) {
      currentPlatforms.push(platformKey);
    } else {
      currentPlatforms.splice(index, 1);
    }

    this.basicInfoForm.get('platforms')?.setValue([...currentPlatforms]);
  }

  getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      twitter: 'alternate_email',
      facebook: 'facebook',
      instagram: 'photo_camera',
      linkedin: 'business',
      tiktok: 'music_video',
      youtube: 'play_circle'
    };
    return icons[platform] || 'share';
  }
}
