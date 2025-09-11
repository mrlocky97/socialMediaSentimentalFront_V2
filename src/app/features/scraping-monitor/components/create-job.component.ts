/**
 * Create Job Component
 * Form component for creating new advanced scraping jobs
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { AdvancedScrapingService } from '../../../core/services/advanced-scraping.service';
import { JobFormData, CreateJobResponse } from '../../../core/interfaces/advanced-scraping.interface';

interface ScrapingType {
  value: 'hashtag' | 'user' | 'search';
  label: string;
  icon: string;
  description: string;
  placeholder: string;
  examples: string[];
}

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSliderModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule
],
  template: `
    <div class="create-job-container">
      <mat-card class="job-form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>rocket_launch</mat-icon>
            Create Advanced Scraping Job
          </mat-card-title>
          <mat-card-subtitle>
            Configure a new high-volume social media data collection job
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="jobForm" (ngSubmit)="onSubmit()">
            <!-- Scraping Type Selection -->
            <div class="form-section">
              <h3>
                <mat-icon>category</mat-icon>
                Scraping Type
              </h3>
              <div class="type-selection">
                @for (type of scrapingTypes; track type.value) {
                  <div 
                    class="type-card" 
                    [class.selected]="selectedType() === type.value"
                    (click)="selectType(type.value)"
                  >
                    <mat-icon>{{ type.icon }}</mat-icon>
                    <h4>{{ type.label }}</h4>
                    <p>{{ type.description }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Query Configuration -->
            <div class="form-section">
              <h3>
                <mat-icon>search</mat-icon>
                Query Configuration
              </h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ getSelectedTypeConfig()?.label || 'Query' }}</mat-label>
                <mat-icon matPrefix>{{ getSelectedTypeConfig()?.icon || 'search' }}</mat-icon>
                <input 
                  matInput 
                  formControlName="query"
                  [placeholder]="getSelectedTypeConfig()?.placeholder || 'Enter your query'"
                />
                <mat-hint>{{ getQueryHint() }}</mat-hint>
                @if (jobForm.get('query')?.hasError('required')) {
                  <mat-error>Query is required</mat-error>
                }
                @if (jobForm.get('query')?.hasError('minlength')) {
                  <mat-error>Query must be at least 2 characters</mat-error>
                }
              </mat-form-field>

              <!-- Query Examples -->
              @if (getSelectedTypeConfig()?.examples?.length) {
                <div class="examples-section">
                  <label>Examples:</label>
                  <mat-chip-set>
                    @for (example of getSelectedTypeConfig()?.examples; track example) {
                      <mat-chip (click)="useExample(example)" class="example-chip">
                        {{ example }}
                      </mat-chip>
                    }
                  </mat-chip-set>
                </div>
              }
            </div>

            <!-- Volume Configuration -->
            <div class="form-section">
              <h3>
                <mat-icon>bar_chart</mat-icon>
                Volume Configuration
              </h3>
              
              <div class="volume-controls">
                <mat-form-field appearance="outline" class="target-count-field">
                  <mat-label>Target Tweet Count</mat-label>
                  <mat-icon matPrefix>target</mat-icon>
                  <input 
                    matInput 
                    type="number"
                    formControlName="targetCount"
                    min="1"
                    max="10000"
                  />
                  <mat-hint>1 - 10,000 tweets</mat-hint>
                  @if (jobForm.get('targetCount')?.hasError('required')) {
                    <mat-error>Target count is required</mat-error>
                  }
                  @if (jobForm.get('targetCount')?.hasError('min')) {
                    <mat-error>Minimum 1 tweet</mat-error>
                  }
                  @if (jobForm.get('targetCount')?.hasError('max')) {
                    <mat-error>Maximum 10,000 tweets</mat-error>
                  }
                </mat-form-field>

                <div class="volume-indicator">
                  <div class="volume-info">
                    <span class="volume-label">Volume Level:</span>
                    <span class="volume-value" [class]="getVolumeClass()">
                      {{ getVolumeLabel() }}
                    </span>
                  </div>
                  <div class="estimated-time">
                    <mat-icon>schedule</mat-icon>
                    <span>Est. Time: {{ getEstimatedTime() }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Job Configuration -->
            <div class="form-section">
              <h3>
                <mat-icon>settings</mat-icon>
                Job Configuration
              </h3>
              
              <div class="config-row">
                <mat-form-field appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-icon matPrefix>flag</mat-icon>
                  <mat-select formControlName="priority">
                    <mat-option value="high">
                      <div class="priority-option">
                        <mat-icon class="priority-icon high">priority_high</mat-icon>
                        <span>High Priority</span>
                      </div>
                    </mat-option>
                    <mat-option value="medium">
                      <div class="priority-option">
                        <mat-icon class="priority-icon medium">remove</mat-icon>
                        <span>Medium Priority</span>
                      </div>
                    </mat-option>
                    <mat-option value="low">
                      <div class="priority-option">
                        <mat-icon class="priority-icon low">keyboard_arrow_down</mat-icon>
                        <span>Low Priority</span>
                      </div>
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Campaign ID (Optional)</mat-label>
                  <mat-icon matPrefix>campaign</mat-icon>
                  <input matInput formControlName="campaignId" placeholder="my-campaign-2024">
                  <mat-hint>Link to existing campaign</mat-hint>
                </mat-form-field>
              </div>

              <!-- Content Options -->
              <div class="options-section">
                <h4>Content Options</h4>
                <div class="checkbox-group">
                  <mat-checkbox formControlName="includeReplies">
                    <div class="checkbox-content">
                      <span>Include Replies</span>
                      <small>Include reply tweets in results</small>
                    </div>
                  </mat-checkbox>
                  
                  <mat-checkbox formControlName="includeRetweets">
                    <div class="checkbox-content">
                      <span>Include Retweets</span>
                      <small>Include retweeted content</small>
                    </div>
                  </mat-checkbox>
                </div>
              </div>
            </div>

            <!-- Job Summary -->
            <div class="form-section">
              <h3>
                <mat-icon>summarize</mat-icon>
                Job Summary
              </h3>
              
              <div class="job-summary">
                <div class="summary-item">
                  <mat-icon>{{ getSelectedTypeConfig()?.icon || 'search' }}</mat-icon>
                  <div>
                    <strong>Type:</strong> {{ getSelectedTypeConfig()?.label || 'Not selected' }}
                  </div>
                </div>
                
                <div class="summary-item">
                  <mat-icon>search</mat-icon>
                  <div>
                    <strong>Query:</strong> "{{ jobForm.get('query')?.value || 'Not specified' }}"
                  </div>
                </div>
                
                <div class="summary-item">
                  <mat-icon>target</mat-icon>
                  <div>
                    <strong>Target:</strong> {{ jobForm.get('targetCount')?.value || 0 }} tweets
                  </div>
                </div>
                
                <div class="summary-item">
                  <mat-icon>flag</mat-icon>
                  <div>
                    <strong>Priority:</strong> {{ jobForm.get('priority')?.value || 'medium' }}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button 
            mat-button 
            type="button" 
            (click)="onCancel()"
            [disabled]="isCreating()"
          >
            Cancel
          </button>
          
          <button 
            mat-raised-button 
            color="primary"
            type="submit"
            (click)="onSubmit()"
            [disabled]="jobForm.invalid || isCreating()"
          >
            @if (isCreating()) {
              <ng-container>
                <mat-icon>hourglass_empty</mat-icon>
                Creating...
              </ng-container>
            } @else {
              <ng-container>
                <mat-icon>rocket_launch</mat-icon>
                Create Job
              </ng-container>
            }
          </button>
        </mat-card-actions>

        @if (isCreating()) {
          <mat-progress-bar mode="indeterminate" class="creation-progress"></mat-progress-bar>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .create-job-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    .job-form-card {
      margin-bottom: 24px;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      margin-bottom: 16px;
      font-size: 18px;
    }

    .type-selection {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .type-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .type-card:hover {
      border-color: #1976d2;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .type-card.selected {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .type-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .type-card h4 {
      margin: 8px 0 4px 0;
      color: #333;
    }

    .type-card p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    .full-width {
      width: 100%;
    }

    .examples-section {
      margin-top: 16px;
    }

    .examples-section label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #666;
    }

    .example-chip {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .example-chip:hover {
      background-color: #e3f2fd;
    }

    .volume-controls {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .target-count-field {
      flex: 1;
      max-width: 300px;
    }

    .volume-indicator {
      flex: 1;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      min-width: 200px;
    }

    .volume-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .volume-label {
      color: #666;
    }

    .volume-value {
      font-weight: 500;
    }

    .volume-value.low {
      color: #4caf50;
    }

    .volume-value.medium {
      color: #ff9800;
    }

    .volume-value.high {
      color: #f44336;
    }

    .estimated-time {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .estimated-time mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .config-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .config-row mat-form-field {
      flex: 1;
    }

    .priority-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .priority-icon.high {
      color: #f44336;
    }

    .priority-icon.medium {
      color: #ff9800;
    }

    .priority-icon.low {
      color: #4caf50;
    }

    .options-section h4 {
      margin-bottom: 16px;
      color: #333;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkbox-content {
      display: flex;
      flex-direction: column;
    }

    .checkbox-content small {
      color: #666;
      margin-top: 2px;
    }

    .job-summary {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .summary-item:last-child {
      margin-bottom: 0;
    }

    .summary-item mat-icon {
      color: #1976d2;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .creation-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }

    mat-card-actions {
      position: relative;
    }

    @media (max-width: 768px) {
      .create-job-container {
        padding: 16px;
      }
      
      .type-selection {
        grid-template-columns: 1fr;
      }
      
      .volume-controls {
        flex-direction: column;
        gap: 16px;
      }
      
      .target-count-field {
        max-width: none;
      }
      
      .config-row {
        flex-direction: column;
      }
    }
  `]
})
export class CreateJobComponent {
  @Output() jobCreated = new EventEmitter<CreateJobResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private scrapingService = inject(AdvancedScrapingService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateJobComponent>, { optional: true });

  // Form and state
  jobForm: FormGroup;
  selectedType = signal<'hashtag' | 'user' | 'search'>('hashtag');
  isCreating = signal(false);

  scrapingTypes: ScrapingType[] = [
    {
      value: 'hashtag',
      label: 'Hashtag Scraping',
      icon: 'tag',
      description: 'Collect tweets containing specific hashtags',
      placeholder: 'javascript, ai, technology',
      examples: ['javascript', 'artificialintelligence', 'webdevelopment', 'reactjs']
    },
    {
      value: 'user',
      label: 'User Scraping',
      icon: 'person',
      description: 'Collect tweets from specific users',
      placeholder: 'elonmusk, sundarpichai',
      examples: ['elonmusk', 'sundarpichai', 'satyanadella', 'tim_cook']
    },
    {
      value: 'search',
      label: 'Free Search',
      icon: 'search',
      description: 'Custom search queries with advanced operators',
      placeholder: 'AI AND (machine learning OR deep learning)',
      examples: ['machine learning', 'climate change', 'cryptocurrency bitcoin', 'remote work']
    }
  ];

  constructor() {
    this.jobForm = this.fb.group({
      query: ['', [Validators.required, Validators.minLength(2)]],
      targetCount: [1000, [Validators.required, Validators.min(1), Validators.max(10000)]],
      campaignId: [''],
      priority: ['medium', Validators.required],
      includeReplies: [false],
      includeRetweets: [true]
    });
  }

  selectType(type: 'hashtag' | 'user' | 'search'): void {
    this.selectedType.set(type);
    // Clear query when type changes
    this.jobForm.get('query')?.setValue('');
  }

  getSelectedTypeConfig(): ScrapingType | undefined {
    return this.scrapingTypes.find(t => t.value === this.selectedType());
  }

  getQueryHint(): string {
    const config = this.getSelectedTypeConfig();
    if (!config) return '';

    switch (config.value) {
      case 'hashtag':
        return 'Enter hashtags separated by commas (without # symbol)';
      case 'user':
        return 'Enter usernames separated by commas (without @ symbol)';
      case 'search':
        return 'Use AND, OR, quotes for exact phrases, - to exclude';
      default:
        return '';
    }
  }

  useExample(example: string): void {
    this.jobForm.get('query')?.setValue(example);
  }

  getVolumeClass(): string {
    const count = this.jobForm.get('targetCount')?.value || 0;
    if (count <= 1000) return 'low';
    if (count <= 5000) return 'medium';
    return 'high';
  }

  getVolumeLabel(): string {
    const count = this.jobForm.get('targetCount')?.value || 0;
    if (count <= 1000) return 'Low Volume';
    if (count <= 5000) return 'Medium Volume';
    return 'High Volume';
  }

  getEstimatedTime(): string {
    const count = this.jobForm.get('targetCount')?.value || 0;
    
    // Rough estimation based on rate limits
    // Assuming ~300 tweets per 15-minute window
    const estimatedMinutes = Math.ceil(count / 300) * 15;
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }

  onSubmit(): void {
    if (this.jobForm.valid && !this.isCreating()) {
      this.isCreating.set(true);

      const formData: JobFormData = {
        type: this.selectedType(),
        query: this.jobForm.get('query')?.value,
        targetCount: this.jobForm.get('targetCount')?.value,
        campaignId: this.jobForm.get('campaignId')?.value || undefined,
        priority: this.jobForm.get('priority')?.value,
        includeReplies: this.jobForm.get('includeReplies')?.value,
        includeRetweets: this.jobForm.get('includeRetweets')?.value
      };

      this.scrapingService.createJob(formData).subscribe({
        next: (response: any) => {
          this.isCreating.set(false);
          this.jobCreated.emit(response);
          
          if (this.dialogRef) {
            this.dialogRef.close(response);
          }
          
          this.snackBar.open(
            `Job created successfully! Estimated completion: ${this.getEstimatedTime()}`, 
            'View Job', 
            { duration: 7000 }
          );
        },
        error: (error: any) => {
          this.isCreating.set(false);
          console.error('Failed to create job:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
