import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { AdvancedScrapingService } from '../../core/services/advanced-scraping.service';
import { DialogConfig, DialogService } from '../../shared/components/dialog';
import { FormConfig, FormSubmitEvent } from '../../shared/components/reactive-form/interfaces/form-field.interface';
import { ReactiveFormComponent } from '../../shared/components/reactive-form/reactive-form.component';
import { CreateJobComponent } from './components/create-job/create-job.component';
import { JobListComponent } from './components/job-list/job-list.component';
import { ScrapingDashboardComponent } from './components/scraping-dashboard/scraping-dashboard.component';

@Component({
  selector: 'app-scraping-monitor',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    CreateJobComponent,
    JobListComponent,
    ScrapingDashboardComponent,
  ],
  templateUrl: './scraping-monitor.component.html',
  styleUrls: ['./scraping-monitor.component.css'],
})
export class ScrapingMonitorComponent implements OnInit, OnDestroy {
  private scrapingService = inject(AdvancedScrapingService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private destroyer$ = new Subject<void>();

  // State signals
  selectedTabIndex = signal(0);
  connectionStatus = signal(false);
  activeJobsCount = signal(0);
  totalJobs = signal(0);
  totalTweetsCollected = signal(0);
  isRefreshing = signal(false);

  ngOnInit(): void {
    this.subscribeToUpdates();
    this.loadInitialData();
  }

  private subscribeToUpdates(): void {
    // Subscribe to connection status
    this.scrapingService.connectionStatus$.subscribe((status) => {
      this.connectionStatus.set(status);
    });

    // Subscribe to metrics
    this.scrapingService.metrics$.subscribe((metrics) => {
      this.activeJobsCount.set(metrics.runningJobs);
      this.totalJobs.set(metrics.totalJobs);
      this.totalTweetsCollected.set(metrics.totalTweetsCollected);
    });
  }

  private loadInitialData(): void {
    // Only load system stats, jobs are already loaded by the service constructor
    this.scrapingService.getSystemStats().subscribe();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  openCreateJobDialog(): void {
    const formConfig = this.buildCreateJobFormConfig();

    const dialogConfig: DialogConfig = {
      title: 'Create New Scraping Job',
      size: 'lg',
      showCloseButton: true,
      disableClose: false,
      buttons: [
        {
          text: 'Cancel',
          type: 'stroked',
          color: 'default',
          action: 'cancel',
          autoClose: true
        },
        {
          text: 'Create Job',
          type: 'raised',
          color: 'primary',
          action: 'submit',
          autoClose: false,
          icon: 'rocket_launch'
        }
      ]
    };

    // Usar el contenido personalizado con el ReactiveFormComponent
    const customContent = {
      component: ReactiveFormComponent,
      data: {
        config: formConfig,
        onSubmit: (event: FormSubmitEvent) => this.handleJobFormSubmit(event)
      }
    };

    this.dialogService.custom(dialogConfig, customContent).subscribe(result => {
      if (result?.action === 'cancel') {
        console.log('Job creation cancelled');
      }
      // El submit se maneja en handleJobFormSubmit
    });
  }

  private buildCreateJobFormConfig(): FormConfig {
    return {
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'Job Name',
          placeholder: 'Enter a descriptive name for your job',
          required: true,
          validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
          hint: 'Choose a unique, descriptive name for easy identification',
        },
        {
          key: 'type',
          type: 'select',
          label: 'Scraping Type',
          placeholder: 'Select the type of data to scrape',
          required: true,
          validators: [Validators.required],
          options: [
            { value: 'hashtag', label: 'Hashtag Analysis' },
            { value: 'user', label: 'User Profile' },
            { value: 'search', label: 'Keyword Search' },
          ],
          hint: 'Different types collect different data points',
        },
        {
          key: 'target',
          type: 'text',
          label: 'Target',
          placeholder: 'Enter hashtag, username, or search terms',
          required: true,
          validators: [Validators.required, Validators.minLength(2)],
          hint: 'The main target for data collection',
        },
        {
          key: 'maxResults',
          type: 'number',
          label: 'Maximum Results',
          placeholder: '1000',
          required: true,
          validators: [Validators.required, Validators.min(1), Validators.max(10000)],
          value: 1000,
          min: 1,
          max: 10000,
          hint: 'Maximum number of items to collect (1-10,000)',
        },
        {
          key: 'priority',
          type: 'select',
          label: 'Priority',
          placeholder: 'Select job priority',
          required: true,
          validators: [Validators.required],
          options: [
            { value: 'low', label: 'Low Priority' },
            { value: 'normal', label: 'Normal Priority' },
            { value: 'high', label: 'High Priority' },
            { value: 'urgent', label: 'Urgent' },
          ],
          value: 'normal',
          hint: 'Higher priority jobs are processed first',
        },
        {
          key: 'collectReplies',
          type: 'checkbox',
          label: 'Collect Replies',
          value: false,
          hint: 'Include reply tweets in the collection',
        },
        {
          key: 'includeRetweets',
          type: 'checkbox',
          label: 'Include Retweets',
          value: true,
          hint: 'Include retweets in the data collection',
        },
        {
          key: 'enableSentimentAnalysis',
          type: 'checkbox',
          label: 'Sentiment Analysis',
          value: true,
          hint: 'Perform real-time sentiment analysis',
        },
        {
          key: 'autoStart',
          type: 'checkbox',
          label: 'Auto Start',
          value: true,
          hint: 'Start the job immediately after creation',
        },
        {
          key: 'description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Optional description of this job...',
          required: false,
          rows: 3,
          hint: 'Provide additional context or notes about this job',
        },
      ],
      submitButtonText: 'Create Job',
      resetButtonText: 'Reset Form',
      showResetButton: true,
    };
  }

  private async handleJobFormSubmit(event: FormSubmitEvent): Promise<void> {
    try {
      const formData = event.value;

      // Transformar los datos al formato esperado por el servicio
      const jobData: any = {
        type: formData.type,
        query: formData.target,
        targetCount: formData.maxResults,
        priority: formData.priority,
        includeReplies: formData.collectReplies || false,
        includeRetweets: formData.includeRetweets !== false,
      };

      // Mostrar loading
      this.dialogService.info('Creating Job', 'Please wait while we create your scraping job...');

      // Crear el job
      const response = await this.scrapingService.createJob(jobData).toPromise();

      if (response?.jobId) {
        // Cerrar todos los diálogos primero
        this.dialogService.closeAll();

        // Mostrar éxito
        this.dialogService
          .success(
            'Job Created Successfully',
            `Job "${formData.name || 'Unnamed Job'}" has been created with ID: ${response.jobId}${
              formData.autoStart ? ' and started automatically' : ''
            }.`
          )
          .subscribe(() => {
            // Simular el evento de job creado
            const mockJob = {
              id: response.jobId,
              name: formData.name,
              type: jobData.type,
              query: jobData.query,
              targetCount: jobData.targetCount,
              priority: jobData.priority,
              status: 'pending' as const,
              createdAt: new Date(),
              options: {
                includeReplies: jobData.includeReplies,
                includeRetweets: jobData.includeRetweets,
              },
            };
            this.onJobCreated(mockJob);
          });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error creating job:', error);

      // Cerrar diálogos de loading
      this.dialogService.closeAll();

      this.dialogService.error(
        'Failed to Create Job',
        error.message || 'An unexpected error occurred while creating the job.'
      );
    }
  }

  onJobCreated(job: any): void {
    // Switch to jobs tab to see the new job
    this.selectedTabIndex.set(1);
    // Refresh job list
    this.scrapingService.loadJobs().subscribe();
  }

  onJobCreationCancelled(): void {
    // Switch back to dashboard
    this.selectedTabIndex.set(0);
  }

  refreshAllData(): void {
    this.isRefreshing.set(true);

    Promise.all([
      this.scrapingService.loadJobs().toPromise(),
      this.scrapingService.getSystemStats().toPromise(),
    ])
      .then(() => {
        this.isRefreshing.set(false);
      })
      .catch(() => {
        this.isRefreshing.set(false);
      });
  }

  toggleConnectionStatus(): void {
    if (this.connectionStatus()) {
      // Disconnect logic would go here
      console.log('Disconnecting from real-time updates');
    } else {
      // Reconnect logic
      this.scrapingService.reconnectWebSocket();
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();
  }
}
