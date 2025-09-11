/**
 * Job List Component
 * Displays active scraping jobs with real-time progress
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, timer } from 'rxjs';
import { AdvancedScrapingService } from '../../../core/services/advanced-scraping.service';
import { ScrapingJob, JobProgress } from '../../../core/interfaces/advanced-scraping.interface';

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
    MatBadgeModule
  ],
  template: `
    <div class="job-list-container">
      <!-- Header -->
      <div class="list-header">
        <div class="header-info">
          <h2>
            <mat-icon>list_alt</mat-icon>
            Active Jobs
            @if (connectionStatus()) {
              <mat-icon class="status-icon connected" matTooltip="Connected to real-time updates">
                wifi
              </mat-icon>
            } @else {
              <mat-icon class="status-icon disconnected" matTooltip="Disconnected - updates may be delayed">
                wifi_off
              </mat-icon>
            }
          </h2>
          <p>{{ jobs().length }} jobs • {{ runningJobs() }} running</p>
        </div>
        
        <div class="header-actions">
          <button 
            mat-icon-button 
            (click)="refreshJobs()"
            [disabled]="isRefreshing()"
            matTooltip="Refresh jobs"
          >
            <mat-icon [class.spinning]="isRefreshing()">refresh</mat-icon>
          </button>
          
          <button 
            mat-button 
            [matMenuTriggerFor]="filterMenu"
            [matBadge]="filterCount()"
            [matBadgeHidden]="filterCount() === 0"
          >
            <mat-icon>filter_list</mat-icon>
            Filter
          </button>
          
          <mat-menu #filterMenu="matMenu">
            <button mat-menu-item (click)="setFilter('all')">
              <mat-icon>list</mat-icon>
              All Jobs
            </button>
            <button mat-menu-item (click)="setFilter('running')">
              <mat-icon>play_arrow</mat-icon>
              Running
            </button>
            <button mat-menu-item (click)="setFilter('completed')">
              <mat-icon>check_circle</mat-icon>
              Completed
            </button>
            <button mat-menu-item (click)="setFilter('failed')">
              <mat-icon>error</mat-icon>
              Failed
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Jobs List -->
      @if (filteredJobs().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <h3>No jobs found</h3>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>
      } @else {
        <div class="jobs-grid">
          @for (job of filteredJobs(); track job.id) {
            <mat-card class="job-card" [class]="'status-' + job.status">
              <!-- Job Header -->
              <mat-card-header>
                <div class="job-header">
                  <div class="job-title">
                    <mat-icon class="type-icon">{{ getTypeIcon(job.type) }}</mat-icon>
                    <div>
                      <h3>{{ getJobTitle(job) }}</h3>
                      <span class="job-id">ID: {{ job.id }}</span>
                    </div>
                  </div>
                  
                  <div class="job-status">
                    <mat-chip [class]="'status-chip-' + job.status">
                      <mat-icon>{{ getStatusIcon(job.status) }}</mat-icon>
                      {{ getStatusLabel(job.status) }}
                    </mat-chip>
                  </div>
                </div>
              </mat-card-header>

              <!-- Job Content -->
              <mat-card-content>
                <div class="job-details">
                  <!-- Query -->
                  <div class="detail-row">
                    <mat-icon>search</mat-icon>
                    <span class="detail-label">Query:</span>
                    <span class="detail-value">"{{ job.query }}"</span>
                  </div>
                  
                  <!-- Progress -->
                  <div class="detail-row">
                    <mat-icon>target</mat-icon>
                    <span class="detail-label">Progress:</span>
                    <span class="detail-value">
                      {{ job.progress.current }}/{{ job.progress.total }}
                      ({{ job.progress.percentage.toFixed(1) }}%)
                    </span>
                  </div>
                  
                  <!-- Priority -->
                  <div class="detail-row">
                    <mat-icon [class]="'priority-' + job.priority">{{ getPriorityIcon(job.priority) }}</mat-icon>
                    <span class="detail-label">Priority:</span>
                    <span class="detail-value">{{ job.priority | titlecase }}</span>
                  </div>
                  
                  <!-- Created At -->
                  <div class="detail-row">
                    <mat-icon>schedule</mat-icon>
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ formatDate(job.createdAt) }}</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="progress-section">
                  <div class="progress-info">
                    <span class="progress-label">Progress</span>
                    <span class="progress-percentage">{{ job.progress.percentage.toFixed(1) }}%</span>
                  </div>
                  <mat-progress-bar 
                    [value]="job.progress.percentage" 
                    [color]="getProgressColor(job.status)"
                    mode="determinate"
                    [class]="'progress-' + job.status">
                  </mat-progress-bar>
                </div>

                <!-- Batch Info for Running Jobs -->
                @if (job.status === 'running') {
                  <div class="batch-info">
                    <div class="batch-detail">
                      <mat-icon>layers</mat-icon>
                      <span>Batch {{ job.progress.currentBatch }}/{{ job.progress.totalBatches }}</span>
                    </div>
                    
                    @if (job.progress.throughput) {
                      <div class="batch-detail">
                        <mat-icon>speed</mat-icon>
                        <span>{{ job.progress.throughput.toFixed(1) }} tweets/sec</span>
                      </div>
                    }
                    
                    @if (job.progress.estimatedTimeRemaining) {
                      <div class="batch-detail">
                        <mat-icon>timer</mat-icon>
                        <span>{{ formatTime(job.progress.estimatedTimeRemaining) }} remaining</span>
                      </div>
                    }
                  </div>
                }

                <!-- Error Messages -->
                @if (job.progress.errors.length > 0) {
                  <div class="error-section">
                    <mat-icon class="error-icon">warning</mat-icon>
                    <span class="error-count">{{ job.progress.errors.length }} error(s)</span>
                    <button mat-button (click)="showErrors(job)">View Details</button>
                  </div>
                }
              </mat-card-content>

              <!-- Job Actions -->
              <mat-card-actions align="end">
                @if (job.status === 'running') {
                  <button 
                    mat-icon-button 
                    color="warn"
                    (click)="cancelJob(job.id)"
                    matTooltip="Cancel job"
                  >
                    <mat-icon>stop</mat-icon>
                  </button>
                }
                
                @if (job.status === 'completed') {
                  <button 
                    mat-button 
                    color="primary"
                    (click)="viewResults(job.id)"
                  >
                    <mat-icon>visibility</mat-icon>
                    View Results
                  </button>
                }
                
                <button 
                  mat-icon-button 
                  [matMenuTriggerFor]="jobMenu"
                >
                  <mat-icon>more_vert</mat-icon>
                </button>
                
                <mat-menu #jobMenu="matMenu">
                  <button mat-menu-item (click)="copyJobId(job.id)">
                    <mat-icon>content_copy</mat-icon>
                    Copy Job ID
                  </button>
                  <button mat-menu-item (click)="viewJobDetails(job.id)">
                    <mat-icon>info</mat-icon>
                    Job Details
                  </button>
                  @if (job.status !== 'running') {
                    <button mat-menu-item (click)="deleteJob(job.id)" class="danger-menu-item">
                      <mat-icon>delete</mat-icon>
                      Delete Job
                    </button>
                  }
                </mat-menu>
              </mat-card-actions>

              <!-- Real-time indicator for running jobs -->
              @if (job.status === 'running') {
                <div class="live-indicator">
                  <div class="pulse-dot"></div>
                  <span>Live</span>
                </div>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .job-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-info h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #333;
    }

    .status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-icon.connected {
      color: #4caf50;
    }

    .status-icon.disconnected {
      color: #f44336;
    }

    .header-info p {
      margin: 0;
      color: #666;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .jobs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .job-card {
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .job-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .job-card.status-running {
      border-left: 4px solid #2196f3;
    }

    .job-card.status-completed {
      border-left: 4px solid #4caf50;
    }

    .job-card.status-failed {
      border-left: 4px solid #f44336;
    }

    .job-card.status-pending {
      border-left: 4px solid #ff9800;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .job-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .type-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .job-title h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
    }

    .job-id {
      font-size: 12px;
      color: #999;
      font-family: monospace;
    }

    .status-chip-running {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-chip-completed {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-chip-failed {
      background: #ffebee;
      color: #d32f2f;
    }

    .status-chip-pending {
      background: #fff3e0;
      color: #f57c00;
    }

    .job-details {
      margin-bottom: 16px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .detail-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .detail-label {
      font-weight: 500;
      color: #666;
      min-width: 60px;
    }

    .detail-value {
      color: #333;
      flex: 1;
    }

    .priority-high {
      color: #f44336 !important;
    }

    .priority-medium {
      color: #ff9800 !important;
    }

    .priority-low {
      color: #4caf50 !important;
    }

    .progress-section {
      margin-bottom: 16px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .progress-label {
      color: #666;
      font-weight: 500;
    }

    .progress-percentage {
      color: #333;
      font-weight: 600;
    }

    .batch-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .batch-detail {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
    }

    .batch-detail mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .error-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fff3e0;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .error-icon {
      color: #f57c00;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .error-count {
      font-size: 14px;
      color: #f57c00;
      font-weight: 500;
    }

    .live-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 12px;
      font-size: 12px;
      color: #4caf50;
      font-weight: 500;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #4caf50;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      }
      
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
      }
      
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      }
    }

    .danger-menu-item {
      color: #f44336 !important;
    }

    @media (max-width: 768px) {
      .job-list-container {
        padding: 16px;
      }
      
      .jobs-grid {
        grid-template-columns: 1fr;
      }
      
      .list-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .batch-info {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
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
    
    return allJobs.filter(job => job.status === filter);
  });

  runningJobs = computed(() => 
    this.jobs().filter(job => job.status === 'running').length
  );

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
    this.scrapingService.jobs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobs => {
        this.jobs.set(jobs);
      });

    // Subscribe to connection status
    this.scrapingService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
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
      }
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
      panelClass: ['error-snackbar']
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
      case 'hashtag': return 'Hashtag';
      case 'user': return 'User';
      case 'search': return 'Search';
      default: return type;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'hashtag': return 'tag';
      case 'user': return 'person';
      case 'search': return 'search';
      default: return 'help';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'running': return 'play_arrow';
      case 'completed': return 'check_circle';
      case 'failed': return 'error';
      default: return 'help';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'priority_high';
      case 'medium': return 'remove';
      case 'low': return 'keyboard_arrow_down';
      default: return 'remove';
    }
  }

  getProgressColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'running': return 'primary';
      case 'completed': return 'accent';
      case 'failed': return 'warn';
      default: return 'primary';
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
      case 'running': return 'No running jobs found';
      case 'completed': return 'No completed jobs found';
      case 'failed': return 'No failed jobs found';
      default: return 'No jobs found. Create a new job to get started.';
    }
  }
}
