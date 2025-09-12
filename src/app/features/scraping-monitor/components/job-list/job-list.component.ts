/**
 * Job List Component
 * Displays active scraping jobs with real-time progress
 */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, timer } from 'rxjs';
import { ScrapingJob } from '../../../../core/interfaces/advanced-scraping.interface';
import { AdvancedScrapingService } from '../../../../core/services/advanced-scraping.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit, OnDestroy {
  private scrapingService = inject(AdvancedScrapingService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // State signals
  jobs = signal<ScrapingJob[]>([]);
  isRefreshing = signal(false);
  filterStatus = signal<'all' | 'running' | 'completed' | 'failed'>('all');
  connectionStatus = signal(false);

  // Computed properties
  filteredJobs = computed(() => {
    const allJobs = this.jobs();
    const filter = this.filterStatus();

    if (filter === 'all') {
      return allJobs;
    }

    return allJobs.filter((job) => job.status === filter);
  });

  runningJobs = computed(() => this.jobs().filter((job) => job.status === 'running').length);

  filterCount = computed(() => {
    const filter = this.filterStatus();
    return filter === 'all' ? 0 : 1;
  });

  ngOnInit(): void {
    this.loadJobs();
    this.subscribeToUpdates();
    this.startPeriodicRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToUpdates(): void {
    // Subscribe to jobs updates
    this.scrapingService.jobs$.pipe(takeUntil(this.destroy$)).subscribe((jobs) => {
      this.jobs.set(jobs);
    });

    // Subscribe to connection status
    this.scrapingService.connectionStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.connectionStatus.set(status);
    });
  }

  private startPeriodicRefresh(): void {
    // Refresh jobs every 30 seconds if not connected to WebSocket
    timer(0, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.connectionStatus()) {
          this.loadJobs();
        }
      });
  }

  loadJobs(): void {
    this.scrapingService.loadJobs().subscribe();
  }

  refreshJobs(): void {
    this.isRefreshing.set(true);
    this.scrapingService.loadJobs().subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.snackBar.open('Jobs refreshed', 'Close', { duration: 2000 });
      },
      error: () => {
        this.isRefreshing.set(false);
      },
    });
  }

  setFilter(status: 'all' | 'running' | 'completed' | 'failed'): void {
    this.filterStatus.set(status);
  }

  cancelJob(jobId: string): void {
    this.scrapingService.cancelJob(jobId).subscribe();
  }

  viewResults(jobId: string): void {
    // Navigate to results view
    console.log('View results for job:', jobId);
    this.snackBar.open('Results view not implemented yet', 'Close', { duration: 3000 });
  }

  showErrors(job: ScrapingJob): void {
    const errorMessage = job.progress.errors.join('\n');
    this.snackBar.open(`Errors in job ${job.id}:\n${errorMessage}`, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  copyJobId(jobId: string): void {
    navigator.clipboard.writeText(jobId).then(() => {
      this.snackBar.open('Job ID copied to clipboard', 'Close', { duration: 2000 });
    });
  }

  viewJobDetails(jobId: string): void {
    // Navigate to job details
    console.log('View details for job:', jobId);
    this.snackBar.open('Job details view not implemented yet', 'Close', { duration: 3000 });
  }

  deleteJob(jobId: string): void {
    // Implement job deletion
    console.log('Delete job:', jobId);
    this.snackBar.open('Job deletion not implemented yet', 'Close', { duration: 3000 });
  }

  // Helper methods
  getJobTitle(job: ScrapingJob): string {
    return `${this.getTypeLabel(job.type)} - ${job.query}`;
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'hashtag':
        return 'Hashtag Analysis';
      case 'user':
        return 'User Profile';
      case 'search':
        return 'Keyword Search';
      case 'sentiment':
        return 'Sentiment Analysis';
      case 'crisis':
        return 'Crisis Monitoring';
      case 'competitor':
        return 'Competitor Analysis';
      case 'influencer':
        return 'Influencer Tracking';
      case 'campaign':
        return 'Campaign Performance';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'hashtag':
        return 'tag';
      case 'user':
        return 'person';
      case 'search':
        return 'search';
      case 'sentiment':
        return 'psychology';
      case 'crisis':
        return 'warning';
      case 'competitor':
        return 'compare_arrows';
      case 'influencer':
        return 'star';
      case 'campaign':
        return 'campaign';
      default:
        return 'data_usage';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'running':
        return 'play_arrow';
      case 'completed':
        return 'check_circle';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'emergency';
      case 'high':
        return 'priority_high';
      case 'medium':
      case 'normal':
        return 'remove';
      case 'low':
        return 'keyboard_arrow_down';
      default:
        return 'remove';
    }
  }

  getProgressColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'accent';
      case 'failed':
        return 'warn';
      default:
        return 'primary';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  getEmptyStateMessage(): string {
    const filter = this.filterStatus();
    switch (filter) {
      case 'running':
        return 'No running jobs found';
      case 'completed':
        return 'No completed jobs found';
      case 'failed':
        return 'No failed jobs found';
      default:
        return 'No jobs found. Create a new job to get started.';
    }
  }
}
