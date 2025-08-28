import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';
import { ScrapingService } from '../../../core/services/scraping.service';

interface WizardStep {
  id: string;
  label: string;
  completed: boolean;
}

interface CampaignType {
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface TrackingItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-modern-campaign-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="wizard-container">
      <!-- Header -->
      <div class="wizard-header">
        <h1 class="wizard-title">
          <mat-icon class="title-icon">auto_awesome</mat-icon>
          Create New Campaign
        </h1>
        <p class="wizard-subtitle">Set up your social media monitoring campaign</p>
        
        <!-- Progress -->
        <div class="progress-container">
          <mat-progress-bar 
            mode="determinate" 
            [value]="progressPercentage()"
            class="progress-bar">
          </mat-progress-bar>
          <div class="progress-info">
            <span>Step {{ currentStep() + 1 }} of {{ steps.length }}</span>
            <span>{{ progressPercentage() }}% Complete</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="wizard-content">
        <mat-card class="step-card">
          <!-- Step 1: Basic Information -->
          <div *ngIf="currentStep() === 0" class="step-content">
            <div class="step-header">
              <mat-icon>info</mat-icon>
              <h2>Basic Information</h2>
            </div>

            <form [formGroup]="basicInfoForm" class="form-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Campaign Name</mat-label>
                <input matInput formControlName="name" required>
                <mat-error>Campaign name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Campaign Type</mat-label>
                <mat-select formControlName="type" required>
                  <mat-option *ngFor="let type of campaignTypes" [value]="type.value">
                    {{ type.label }}
                  </mat-option>
                </mat-select>
                <mat-error>Please select a campaign type</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="4"></textarea>
              </mat-form-field>
            </form>
          </div>

          <!-- Step 2: Tracking -->
          <div *ngIf="currentStep() === 1" class="step-content">
            <div class="step-header">
              <mat-icon>track_changes</mat-icon>
              <h2>What to Track</h2>
            </div>

            <div class="tracking-sections">
              <!-- Hashtags -->
              <div class="tracking-section">
                <h3>Hashtags</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Add hashtag</mat-label>
                  <input matInput #hashtagInput 
                         placeholder="socialmedia"
                         (keydown.enter)="addHashtag($event, hashtagInput.value); hashtagInput.value = ''">
                  <button mat-icon-button matSuffix 
                          (click)="addHashtag($event, hashtagInput.value); hashtagInput.value = ''">
                    <mat-icon>add</mat-icon>
                  </button>
                </mat-form-field>

                <div *ngIf="hashtags().length > 0" class="chips-container">
                  <mat-chip-set>
                    <mat-chip *ngFor="let hashtag of hashtags()" 
                              [removable]="true" 
                              (removed)="removeHashtag(hashtag)">
                      #{{ hashtag.name }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <!-- Keywords -->
              <div class="tracking-section">
                <h3>Keywords</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Add keyword</mat-label>
                  <input matInput #keywordInput 
                         placeholder="brand reputation"
                         (keydown.enter)="addKeyword($event, keywordInput.value); keywordInput.value = ''">
                  <button mat-icon-button matSuffix 
                          (click)="addKeyword($event, keywordInput.value); keywordInput.value = ''">
                    <mat-icon>add</mat-icon>
                  </button>
                </mat-form-field>

                <div *ngIf="keywords().length > 0" class="chips-container">
                  <mat-chip-set>
                    <mat-chip *ngFor="let keyword of keywords()" 
                              [removable]="true" 
                              (removed)="removeKeyword(keyword)">
                      {{ keyword.name }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <!-- Mentions -->
              <div class="tracking-section">
                <h3>Mentions</h3>
                <p class="section-description">Add user handles to monitor (without at symbol)</p>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Add mention</mat-label>
                  <input matInput #mentionInput 
                         placeholder="company"
                         (keydown.enter)="addMention($event, mentionInput.value); mentionInput.value = ''">
                  <button mat-icon-button matSuffix 
                          (click)="addMention($event, mentionInput.value); mentionInput.value = ''">
                    <mat-icon>add</mat-icon>
                  </button>
                </mat-form-field>

                <div *ngIf="mentions().length > 0" class="chips-container">
                  <mat-chip-set>
                    <mat-chip *ngFor="let mention of mentions()" 
                              [removable]="true" 
                              (removed)="removeMention(mention)">
                      &#64;{{ mention.name }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Configuration -->
          <div *ngIf="currentStep() === 2" class="step-content">
            <div class="step-header">
              <mat-icon>settings</mat-icon>
              <h2>Configuration</h2>
            </div>

            <form [formGroup]="configForm" class="form-content">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Start Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate" readonly>
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="endDate" readonly>
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Max Posts to Collect</mat-label>
                <input matInput type="number" formControlName="maxTweets" placeholder="10000">
              </mat-form-field>

              <div class="toggles-section">
                <mat-slide-toggle formControlName="includeReplies">Include Replies</mat-slide-toggle>
                <mat-slide-toggle formControlName="includeRetweets">Include Retweets</mat-slide-toggle>
                <mat-slide-toggle formControlName="sentimentAnalysis">Sentiment Analysis</mat-slide-toggle>
              </div>
            </form>
          </div>

          <!-- Step 4: Review -->
          <div *ngIf="currentStep() === 3" class="step-content">
            <div class="step-header">
              <mat-icon>preview</mat-icon>
              <h2>Review & Create</h2>
            </div>

            <div class="review-content">
              <div class="review-section">
                <h3>Campaign Details</h3>
                <p><strong>Name:</strong> {{ basicInfoForm.get('name')?.value }}</p>
                <p><strong>Type:</strong> {{ getCampaignTypeLabel(basicInfoForm.get('type')?.value) }}</p>
                <p *ngIf="basicInfoForm.get('description')?.value">
                  <strong>Description:</strong> {{ basicInfoForm.get('description')?.value }}
                </p>
              </div>

              <div class="review-section" *ngIf="hasTrackingItems()">
                <h3>Tracking</h3>
                <div *ngIf="hashtags().length > 0">
                  <strong>Hashtags:</strong>
                  <span *ngFor="let hashtag of hashtags(); let last = last">
                    #{{ hashtag.name }}<span *ngIf="!last">, </span>
                  </span>
                </div>
                <div *ngIf="keywords().length > 0">
                  <strong>Keywords:</strong>
                  <span *ngFor="let keyword of keywords(); let last = last">
                    {{ keyword.name }}<span *ngIf="!last">, </span>
                  </span>
                </div>
                <div *ngIf="mentions().length > 0">
                  <strong>Mentions:</strong>
                  <span *ngFor="let mention of mentions(); let last = last">
                    &#64;{{ mention.name }}<span *ngIf="!last">, </span>
                  </span>
                </div>
              </div>

              <div class="review-section">
                <h3>Configuration</h3>
                <p><strong>Start Date:</strong> {{ configForm.get('startDate')?.value | date:'mediumDate' }}</p>
                <p *ngIf="configForm.get('endDate')?.value">
                  <strong>End Date:</strong> {{ configForm.get('endDate')?.value | date:'mediumDate' }}
                </p>
                <p *ngIf="configForm.get('maxTweets')?.value">
                  <strong>Max Posts:</strong> {{ configForm.get('maxTweets')?.value }}
                </p>
              </div>

              <div *ngIf="isLoading()" class="loading-state">
                <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
                <p>Creating campaign...</p>
              </div>

              <div *ngIf="error()" class="error-state">
                <mat-icon color="warn">error</mat-icon>
                <p>{{ error() }}</p>
              </div>
            </div>
          </div>
        </mat-card>

        <!-- Navigation -->
        <div class="wizard-navigation">
          <button mat-stroked-button 
                  (click)="previousStep()"
                  [disabled]="currentStep() === 0 || isLoading()"
                  *ngIf="currentStep() > 0">
            <mat-icon>chevron_left</mat-icon>
            Previous
          </button>

          <div class="nav-spacer"></div>

          <button mat-flat-button 
                  color="primary"
                  (click)="nextStep()"
                  [disabled]="!canProceedToNextStep() || isLoading()"
                  *ngIf="currentStep() < steps.length - 1">
            Next
            <mat-icon>chevron_right</mat-icon>
          </button>

          <button mat-flat-button 
                  color="accent"
                  (click)="createCampaign()"
                  [disabled]="!canCreateCampaign() || isLoading()"
                  *ngIf="currentStep() === steps.length - 1">
            <mat-icon>add</mat-icon>
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .wizard-header {
      margin-bottom: 32px;
      text-align: center;
    }

    .wizard-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .title-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .wizard-subtitle {
      font-size: 1.1rem;
      color: #666;
      margin: 0 0 24px 0;
    }

    .progress-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .progress-bar {
      height: 6px;
      border-radius: 3px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.9rem;
      color: #666;
    }

    .step-card {
      min-height: 500px;
      margin-bottom: 24px;
    }

    .step-content {
      padding: 24px;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .step-header mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1976d2;
    }

    .step-header h2 {
      margin: 0;
      font-weight: 400;
      color: #333;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .tracking-sections {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .tracking-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
    }

    .tracking-section h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .section-description {
      margin: 0 0 16px 0;
      font-size: 0.9rem;
      color: #666;
    }

    .chips-container {
      margin-top: 16px;
    }

    .toggles-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .review-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .review-section {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .review-section h3 {
      margin: 0 0 12px 0;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .review-section p {
      margin: 8px 0;
    }

    .loading-state {
      text-align: center;
      padding: 32px;
    }

    .loading-state mat-progress-spinner {
      margin: 0 auto 16px;
    }

    .error-state {
      text-align: center;
      padding: 16px;
      color: #f44336;
    }

    .wizard-navigation {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
    }

    .nav-spacer {
      flex: 1;
    }

    @media (max-width: 768px) {
      .wizard-container {
        padding: 16px;
      }

      .form-row {
        flex-direction: column;
      }

      .wizard-title {
        font-size: 1.5rem;
      }

      .step-content {
        padding: 16px;
      }
    }
  `]
})
export class ModernCampaignWizardComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private campaignFacade = inject(CampaignFacade);
  private scrapingService = inject(ScrapingService);
  private snackBar = inject(MatSnackBar);

  // State
  currentStep = signal(0);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  hashtags = signal<TrackingItem[]>([]);
  keywords = signal<TrackingItem[]>([]);
  mentions = signal<TrackingItem[]>([]);

  // Configuration
  steps: WizardStep[] = [
    { id: 'basic', label: 'Basic Info', completed: false },
    { id: 'tracking', label: 'Tracking', completed: false },
    { id: 'config', label: 'Configuration', completed: false },
    { id: 'review', label: 'Review', completed: false }
  ];

  campaignTypes: CampaignType[] = [
    {
      value: 'hashtag',
      label: 'Hashtag Monitoring',
      description: 'Monitor specific hashtags',
      icon: 'tag'
    },
    {
      value: 'keyword',
      label: 'Keyword Tracking',
      description: 'Track keywords and phrases',
      icon: 'search'
    },
    {
      value: 'user',
      label: 'User Monitoring',
      description: 'Monitor specific users',
      icon: 'person'
    },
    {
      value: 'mention',
      label: 'Mention Tracking',
      description: 'Track brand mentions',
      icon: 'alternate_email'
    }
  ];

  // Forms
  basicInfoForm: FormGroup;
  configForm: FormGroup;

  // Computed
  progressPercentage = computed(() => ((this.currentStep() + 1) / this.steps.length) * 100);

  constructor() {
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      description: ['']
    });

    this.configForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      endDate: [''],
      maxTweets: [10000],
      frequency: ['realtime'],
      includeReplies: [true],
      includeRetweets: [true],
      sentimentAnalysis: [true],
      languageDetection: [false]
    });
  }

  // Navigation
  nextStep(): void {
    if (this.canProceedToNextStep()) {
      this.currentStep.update(step => Math.min(step + 1, this.steps.length - 1));
    }
  }

  previousStep(): void {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.basicInfoForm.valid;
      case 1:
        return this.hasTrackingItems();
      case 2:
        return this.configForm.valid;
      default:
        return false;
    }
  }

  canCreateCampaign(): boolean {
    return this.basicInfoForm.valid && 
           this.configForm.valid && 
           this.hasTrackingItems();
  }

  // Tracking items management
  addHashtag(event: Event, value: string): void {
    event.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue && !this.hashtags().some(h => h.name === trimmedValue)) {
      this.hashtags.update(items => [
        ...items,
        { id: Date.now().toString(), name: trimmedValue }
      ]);
    }
  }

  removeHashtag(hashtag: TrackingItem): void {
    this.hashtags.update(items => items.filter(h => h.id !== hashtag.id));
  }

  addKeyword(event: Event, value: string): void {
    event.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue && !this.keywords().some(k => k.name === trimmedValue)) {
      this.keywords.update(items => [
        ...items,
        { id: Date.now().toString(), name: trimmedValue }
      ]);
    }
  }

  removeKeyword(keyword: TrackingItem): void {
    this.keywords.update(items => items.filter(k => k.id !== keyword.id));
  }

  addMention(event: Event, value: string): void {
    event.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue && !this.mentions().some(m => m.name === trimmedValue)) {
      this.mentions.update(items => [
        ...items,
        { id: Date.now().toString(), name: trimmedValue }
      ]);
    }
  }

  removeMention(mention: TrackingItem): void {
    this.mentions.update(items => items.filter(m => m.id !== mention.id));
  }

  hasTrackingItems(): boolean {
    return this.hashtags().length > 0 || 
           this.keywords().length > 0 || 
           this.mentions().length > 0;
  }

  // Campaign creation
  async createCampaign(): Promise<void> {
    if (!this.canCreateCampaign()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const campaignData = {
        ...this.basicInfoForm.value,
        ...this.configForm.value,
        hashtags: this.hashtags().map(h => h.name),
        keywords: this.keywords().map(k => k.name),
        mentions: this.mentions().map(m => m.name),
        status: 'active',
        createdAt: new Date(),
        dataSources: ['twitter'] // Add Twitter as data source for scraping
      };

      // Create campaign using the facade
      this.campaignFacade.createCampaign(campaignData).subscribe({
        next: (result) => {
          console.log('Campaign created successfully!', result);
          
          // If campaign creation was successful and dataSources includes twitter, navigate to detail page
          if (result && result.type === '[Campaign] Create Campaign Success' && campaignData.dataSources.includes('twitter')) {
            // Extract the campaign ID from the result
            const campaignId = result.campaign?.id;
            if (campaignId) {
              this.snackBar.open('Campaign created! Initiating data scraping...', 'Close', { duration: 3000 });
              // Navigate to campaign detail page which will handle the scraping
              // Pass autoScrape parameter to trigger automatic scraping
              this.router.navigate(['/dashboard/campaigns', campaignId], { 
                queryParams: { autoScrape: true } 
              });
            } else {
              // Fallback if we don't get the campaign ID
              this.router.navigate(['/dashboard/campaigns']);
            }
          } else {
            // Default navigation to campaigns list
            this.router.navigate(['/dashboard/campaigns']);
          }
        },
        error: (error) => {
          console.error('Error in campaign creation subscription:', error);
          this.error.set('Failed to create campaign. Please try again.');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      this.error.set('Failed to create campaign. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper methods
  getCampaignTypeLabel(type: string): string {
    const campaignType = this.campaignTypes.find(t => t.value === type);
    return campaignType ? campaignType.label : type;
  }

  // Track by functions for performance
  trackByStep(index: number, step: WizardStep): string {
    return step.id;
  }

  trackByType(index: number, type: CampaignType): string {
    return type.value;
  }

  trackByHashtag(index: number, hashtag: TrackingItem): string {
    return hashtag.id;
  }

  trackByKeyword(index: number, keyword: TrackingItem): string {
    return keyword.id;
  }

  trackByMention(index: number, mention: TrackingItem): string {
    return mention.id;
  }
}
