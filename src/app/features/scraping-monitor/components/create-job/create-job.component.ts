/**
 * Create Job Component
 * Form component for creating new advanced scraping jobs
 */

import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CreateJobResponse, JobFormData } from '../../../../core/interfaces/advanced-scraping.interface';
import { AdvancedScrapingService } from '../../../../core/services/advanced-scraping.service';

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
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.css']
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
