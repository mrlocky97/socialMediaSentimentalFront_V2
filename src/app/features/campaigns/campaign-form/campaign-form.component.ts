import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CampaignFacade } from '../../../core/facades/campaign.facade';
import { Campaign } from '../../../core/state/app.state';

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="campaign-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            {{ isEditMode() ? 'Edit Campaign' : 'Create New Campaign' }}
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="campaignForm" (ngSubmit)="onSubmit()">
            <!-- Basic Information -->
            <div class="form-section">
              <h3>Basic Information</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Campaign Name</mat-label>
                <input matInput formControlName="name" required>
                <mat-error *ngIf="campaignForm.get('name')?.hasError('required')">
                  Campaign name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Campaign Type</mat-label>
                <mat-select formControlName="type" required>
                  <mat-option value="hashtag">Hashtag Monitoring</mat-option>
                  <mat-option value="keyword">Keyword Tracking</mat-option>
                  <mat-option value="user">User Monitoring</mat-option>
                  <mat-option value="mention">Mention Tracking</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Tracking Parameters -->
            <div class="form-section">
              <h3>Tracking Parameters</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Hashtags (comma separated)</mat-label>
                <input matInput formControlName="hashtagsInput" 
                       placeholder="#socialmedia, #marketing">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Keywords (comma separated)</mat-label>
                <input matInput formControlName="keywordsInput" 
                       placeholder="artificial intelligence, machine learning">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mentions (comma separated)</mat-label>
                <input matInput formControlName="mentionsInput" 
                       placeholder="@company, @brand">
              </mat-form-field>
            </div>

            <!-- Time Configuration -->
            <div class="form-section">
              <h3>Time Configuration</h3>
              
              <div class="date-row">
                <mat-form-field appearance="outline">
                  <mat-label>Start Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate" required>
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="endDate" required>
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>

            <!-- Collection Settings -->
            <div class="form-section">
              <h3>Collection Settings</h3>
              
              <mat-form-field appearance="outline">
                <mat-label>Maximum Tweets</mat-label>
                <input matInput type="number" formControlName="maxTweets" min="100" max="10000">
              </mat-form-field>

              <div class="toggle-row">
                <mat-slide-toggle formControlName="sentimentAnalysis">
                  Enable Sentiment Analysis
                </mat-slide-toggle>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" 
                  (click)="onSubmit()" 
                  [disabled]="campaignForm.invalid || loading()">
            {{ isEditMode() ? 'Update' : 'Create' }} Campaign
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .campaign-form-container {
      max-width: 800px;
      margin: 24px auto;
      padding: 0 24px;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section h3 {
      margin-bottom: 16px;
      color: #424242;
      font-weight: 500;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .date-row {
      display: flex;
      gap: 16px;
    }

    .date-row mat-form-field {
      flex: 1;
    }

    .toggle-row {
      margin: 16px 0;
    }

    mat-card-actions {
      padding: 16px 24px;
      margin: 0;
    }

    @media (max-width: 768px) {
      .date-row {
        flex-direction: column;
      }
    }
  `]
})
export class CampaignFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private campaignFacade = inject(CampaignFacade);

  campaignForm!: FormGroup;
  isEditMode = signal(false);
  loading = signal(false);
  campaignId: string | null = null;

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.campaignId);
    
    this.initializeForm();
    
    if (this.isEditMode()) {
      this.loadCampaign();
    }
  }

  private initializeForm(): void {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['hashtag', Validators.required],
      hashtagsInput: [''],
      keywordsInput: [''],
      mentionsInput: [''],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), Validators.required], // 30 days from now
      maxTweets: [1000, [Validators.required, Validators.min(100), Validators.max(10000)]],
      sentimentAnalysis: [true]
    });
  }

  private loadCampaign(): void {
    if (this.campaignId) {
      this.campaignFacade.selectCampaign(this.campaignId).subscribe((campaign: Campaign | null) => {
        if (campaign) {
          this.populateForm(campaign);
        }
      });
    }
  }

  private populateForm(campaign: Campaign): void {
    this.campaignForm.patchValue({
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      hashtagsInput: campaign.hashtags.join(', '),
      keywordsInput: campaign.keywords.join(', '),
      mentionsInput: campaign.mentions.join(', '),
      startDate: new Date(campaign.startDate),
      endDate: new Date(campaign.endDate),
      maxTweets: campaign.maxTweets,
      sentimentAnalysis: campaign.sentimentAnalysis
    });
  }

  onSubmit(): void {
    if (this.campaignForm.valid) {
      this.loading.set(true);
      
      const formValue = this.campaignForm.value;
      const campaignData = {
        name: formValue.name,
        description: formValue.description,
        type: formValue.type,
        hashtags: this.parseCommaSeparated(formValue.hashtagsInput),
        keywords: this.parseCommaSeparated(formValue.keywordsInput),
        mentions: this.parseCommaSeparated(formValue.mentionsInput),
        startDate: formValue.startDate.toISOString(),
        endDate: formValue.endDate.toISOString(),
        maxTweets: formValue.maxTweets,
        sentimentAnalysis: formValue.sentimentAnalysis
      };

      const operation = this.isEditMode() 
        ? this.campaignFacade.updateCampaign({ id: this.campaignId!, ...campaignData })
        : this.campaignFacade.createCampaign(campaignData);

      operation.subscribe({
        next: (result) => {
          this.loading.set(false);
          if (result) {
            this.snackBar.open(
              `Campaign ${this.isEditMode() ? 'updated' : 'created'} successfully`, 
              'Close', 
              { duration: 3000 }
            );
            this.router.navigate(['/campaigns']);
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open(
            `Error ${this.isEditMode() ? 'updating' : 'creating'} campaign`, 
            'Close', 
            { duration: 5000 }
          );
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/campaigns']);
  }

  private parseCommaSeparated(input: string): string[] {
    return input
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
}
