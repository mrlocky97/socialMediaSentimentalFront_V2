/**
 * Create Job Component
 * Form component for creating new advanced scraping jobs
 */

import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CreateJobResponse,
  JobFormData,
} from '../../../../core/interfaces/advanced-scraping.interface';
import { AdvancedScrapingService } from '../../../../core/services/advanced-scraping.service';
import {
  FormConfig,
  FormSubmitEvent,
  ReactiveFormComponent,
} from '../../../../shared/components/reactive-form';

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
    ReactiveFormComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.css'],
})
export class CreateJobComponent implements OnInit {
  @Output() jobCreated = new EventEmitter<CreateJobResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private scrapingService = inject(AdvancedScrapingService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateJobComponent>, { optional: true });

  // Form and state
  formConfig!: FormConfig;
  selectedType = signal<'hashtag' | 'user' | 'search'>('hashtag');
  isCreating = signal(false);

  scrapingTypes: ScrapingType[] = [
    {
      value: 'hashtag',
      label: 'Hashtag Scraping',
      icon: 'tag',
      description: 'Collect tweets containing specific hashtags',
      placeholder: 'javascript, ai, technology',
      examples: ['javascript', 'artificialintelligence', 'webdevelopment', 'reactjs'],
    },
    {
      value: 'user',
      label: 'User Scraping',
      icon: 'person',
      description: 'Collect tweets from specific users',
      placeholder: 'elonmusk, sundarpichai',
      examples: ['elonmusk', 'sundarpichai', 'satyanadella', 'tim_cook'],
    },
    {
      value: 'search',
      label: 'Free Search',
      icon: 'search',
      description: 'Custom search queries with advanced operators',
      placeholder: 'AI AND (machine learning OR deep learning)',
      examples: ['machine learning', 'climate change', 'cryptocurrency bitcoin', 'remote work'],
    },
  ];

  ngOnInit(): void {
    this.buildFormConfig();
  }

  private buildFormConfig(): void {
    this.formConfig = {
      fields: [
        {
          key: 'query',
          type: 'text',
          label: this.getSelectedTypeConfig()?.label || 'Query',
          placeholder: this.getSelectedTypeConfig()?.placeholder || 'Enter your query',
          required: true,
          validators: [Validators.minLength(2)],
          hint: this.getQueryHint(),
          errorMessages: {
            required: 'Query is required',
            minlength: 'Query must be at least 2 characters',
          },
        },
        {
          key: 'targetCount',
          type: 'number',
          label: 'Target Tweet Count',
          required: true,
          value: 1000,
          min: 1,
          max: 10000,
          validators: [Validators.min(1), Validators.max(10000)],
          hint: '1 - 10,000 tweets',
          errorMessages: {
            required: 'Target count is required',
            min: 'Minimum 1 tweet',
            max: 'Maximum 10,000 tweets',
          },
        },
        {
          key: 'priority',
          type: 'select',
          label: 'Priority',
          required: true,
          value: 'medium',
          options: [
            { value: 'high', label: 'High Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'low', label: 'Low Priority' },
          ],
        },
        {
          key: 'campaignId',
          type: 'text',
          label: 'Campaign ID (Optional)',
          placeholder: 'my-campaign-2024',
          hint: 'Link to existing campaign',
        },
        {
          key: 'includeReplies',
          type: 'checkbox',
          label: 'Include Replies',
          value: false,
          hint: 'Include reply tweets in results',
        },
        {
          key: 'includeRetweets',
          type: 'checkbox',
          label: 'Include Retweets',
          value: true,
          hint: 'Include retweeted content',
        },
      ],
      submitButtonText: 'Create Job',
      showResetButton: false,
      cssClass: 'job-form',
    };
  }

  selectType(type: 'hashtag' | 'user' | 'search'): void {
    this.selectedType.set(type);
    this.buildFormConfig(); // Rebuild form config when type changes
  }

  getSelectedTypeConfig(): ScrapingType | undefined {
    return this.scrapingTypes.find((t) => t.value === this.selectedType());
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
    // We'll handle this through form data update
    this.formConfig = {
      ...this.formConfig,
      fields: this.formConfig.fields.map((field) =>
        field.key === 'query' ? { ...field, value: example } : field
      ),
    };
  }

  onFormSubmit(event: FormSubmitEvent): void {
    if (event.valid && !this.isCreating()) {
      this.isCreating.set(true);

      const formData: JobFormData = {
        type: this.selectedType(),
        query: event.value.query,
        targetCount: event.value.targetCount,
        campaignId: event.value.campaignId || undefined,
        priority: event.value.priority,
        includeReplies: event.value.includeReplies,
        includeRetweets: event.value.includeRetweets,
      };

      this.scrapingService.createJob(formData).subscribe({
        next: (response: any) => {
          this.isCreating.set(false);
          this.jobCreated.emit(response);

          if (this.dialogRef) {
            this.dialogRef.close(response);
          }

          this.snackBar.open(
            `Job created successfully! Estimated completion: ${this.getEstimatedTime(
              event.value.targetCount
            )}`,
            'View Job',
            { duration: 7000 }
          );
        },
        error: (error: any) => {
          this.isCreating.set(false);
          console.error('Failed to create job:', error);
        },
      });
    }
  }

  onFormChange(formValue: any): void {
    // Handle form value changes if needed
    // This can be used for real-time updates like estimated time
  }

  getVolumeClass(count?: number): string {
    const targetCount = count || 0;
    if (targetCount <= 1000) return 'low';
    if (targetCount <= 5000) return 'medium';
    return 'high';
  }

  getVolumeLabel(count?: number): string {
    const targetCount = count || 0;
    if (targetCount <= 1000) return 'Low Volume';
    if (targetCount <= 5000) return 'Medium Volume';
    return 'High Volume';
  }

  getEstimatedTime(count?: number): string {
    const targetCount = count || 0;

    // Rough estimation based on rate limits
    // Assuming ~300 tweets per 15-minute window
    const estimatedMinutes = Math.ceil(targetCount / 300) * 15;

    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }

  onSubmit(): void {
    // This method is kept for template compatibility but delegates to onFormSubmit
    // The actual form submission is handled by onFormSubmit
  }

  onCancel(): void {
    this.cancelled.emit();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
