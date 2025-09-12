import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class CreateJobComponent {
  @Output() jobCreated = new EventEmitter<CreateJobResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private scrapingService = inject(AdvancedScrapingService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateJobComponent>, { optional: true });

  // Use viewChild to get reference to the reactive form
  reactiveForm = viewChild<ReactiveFormComponent>('reactiveForm');

  // Form and state
  selectedType = signal<'hashtag' | 'user' | 'search'>('hashtag');
  isCreating = signal(false);

  // Computed values
  selectedTypeConfig = computed(() =>
    this.scrapingTypes.find((t) => t.value === this.selectedType())
  );

  queryHint = computed(() => {
    const config = this.selectedTypeConfig();
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
  });

  formConfig = computed<FormConfig>(() => {
    const fields: any[] = [
      {
        key: 'query',
        type: 'text',
        label: this.selectedTypeConfig()?.label || 'Query',
        placeholder: this.selectedTypeConfig()?.placeholder || 'Enter your query',
        required: true,
        validators: [Validators.required, Validators.minLength(2)],
        hint: this.queryHint(),
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
        validators: [Validators.required, Validators.min(1), Validators.max(10000)],
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
        validators: [Validators.required],
        options: [
          { value: 'urgent', label: 'Urgent Priority - Immediate Processing' },
          { value: 'high', label: 'High Priority - Fast Processing' },
          { value: 'medium', label: 'Normal Priority - Regular Analysis (< 2 hours)' },
          { value: 'low', label: 'Low Priority - Background Processing' },
        ],
        hint: 'Higher priority jobs consume more system resources',
        errorMessages: {
          required: 'Priority selection is required',
        },
      },
      {
        key: 'campaignId',
        type: 'text',
        label: 'Campaign ID (Optional)',
        placeholder: 'my-campaign-2024',
        required: false,
        hint: 'Link to existing campaign',
      },
      {
        key: 'includeReplies',
        type: 'checkbox',
        label: 'Include Replies',
        required: true,
        value: false,
        hint: 'Include reply tweets in results',
      },
      {
        key: 'includeRetweets',
        type: 'checkbox',
        label: 'Include Retweets',
        required: true,
        value: true,
        hint: 'Include retweeted content',
      },
      {
        key: 'analyzeSentiment',
        type: 'checkbox',
        label: 'Analyze Sentiment',
        required: true,
        value: true,
        hint: 'Enable AI-powered sentiment analysis on collected data',
      },
    ];

    return {
      fields: fields,
      submitButtonText: 'Create Job',
      showResetButton: false,
      cssClass: 'job-form',
    };
  });

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

  selectType(type: 'hashtag' | 'user' | 'search'): void {
    this.selectedType.set(type);
  }

  useExample(example: string): void {
    const form = this.reactiveForm()?.form;
    if (form) {
      form.patchValue({ query: example });
    }
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
        analyzeSentiment: event.value.analyzeSentiment,
      };

      this.scrapingService
        .createJob(formData)
        .pipe(takeUntilDestroyed())
        .subscribe({
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
            this.snackBar.open('Failed to create job. Please try again.', 'Dismiss', {
              duration: 5000,
            });
          },
        });
    }
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

  onCancel(): void {
    this.cancelled.emit();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
