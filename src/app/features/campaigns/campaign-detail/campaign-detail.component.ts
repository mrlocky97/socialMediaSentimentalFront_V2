/* =====================================
   CAMPAIGN DETAIL COMPONENT
   Displays campaign details and allows running scraping
   ===================================== */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';
import { ScrapingDispatchService } from '../../../core/services/scraping-dispatch.service';
import { ScrapingProgress, ScrapingService } from '../../../core/services/scraping.service';
import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatTabsModule
  ],
  template: `
    <div class="campaign-detail-container">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p class="loading-text">Loading campaign details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <h2>Error Loading Campaign</h2>
            <p>{{ error }}</p>
            <button mat-raised-button color="primary" [routerLink]="['/dashboard/campaigns']">
              Back to Campaigns
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Campaign Details -->
      <div *ngIf="campaign && !loading && !error" class="campaign-content">
        <!-- Header -->
        <div class="campaign-header">
          <div class="campaign-title">
            <h1>
              <mat-icon [ngClass]="'icon-' + campaign.status">{{ getTypeIcon(campaign.type) }}</mat-icon>
              {{ campaign.name }}
            </h1>
            <div class="campaign-badges">
              <span class="status-badge" [ngClass]="'status-' + campaign.status">
                {{ getStatusLabel(campaign.status) }}
              </span>
              <span class="type-badge">{{ getTypeLabel(campaign.type) }}</span>
            </div>
          </div>

          <div class="campaign-actions">
            <button 
              mat-raised-button 
              color="primary" 
              [disabled]="isScrapingRunning" 
              (click)="runScraping()"
              class="run-scraping-button">
              <mat-icon>cloud_download</mat-icon>
              Run Scraping Now
            </button>
            <button mat-stroked-button [routerLink]="['/dashboard/campaigns']">
              <mat-icon>arrow_back</mat-icon>
              Back to Campaigns
            </button>
          </div>
        </div>

        <!-- Scraping Progress Section -->
        <mat-card *ngIf="scrapingProgress" class="scraping-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">analytics</mat-icon>
            <mat-card-title>Scraping Progress</mat-card-title>
            <mat-card-subtitle>
              {{ getScrapingStatusText() }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Overall Progress -->
            <div class="progress-container">
              <h3>Overall Progress: {{ scrapingProgress.progress }}%</h3>
              <mat-progress-bar 
                [mode]="isScrapingRunning ? 'determinate' : 'determinate'" 
                [value]="scrapingProgress.progress" 
                class="overall-progress">
              </mat-progress-bar>
            </div>

            <!-- Progress Tags -->
            <div class="progress-tags">
              <div class="progress-tag" 
                   [class.in-progress]="scrapingProgress.hashtags.inProgress"
                   *ngIf="scrapingProgress.hashtags.total > 0">
                <mat-icon>tag</mat-icon>
                <span class="tag-label">Hashtags: {{ scrapingProgress.hashtags.completed }}/{{ scrapingProgress.hashtags.total }}</span>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="getProgressPercent(scrapingProgress.hashtags.completed, scrapingProgress.hashtags.total)" 
                  class="tag-progress">
                </mat-progress-bar>
              </div>

              <div class="progress-tag"
                   [class.in-progress]="scrapingProgress.search.inProgress"
                   *ngIf="scrapingProgress.search.total > 0">
                <mat-icon>search</mat-icon>
                <span class="tag-label">Keywords: {{ scrapingProgress.search.completed }}/{{ scrapingProgress.search.total }}</span>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="getProgressPercent(scrapingProgress.search.completed, scrapingProgress.search.total)" 
                  class="tag-progress">
                </mat-progress-bar>
              </div>

              <div class="progress-tag"
                   [class.in-progress]="scrapingProgress.users.inProgress"
                   *ngIf="scrapingProgress.users.total > 0">
                <mat-icon>person</mat-icon>
                <span class="tag-label">Users: {{ scrapingProgress.users.completed }}/{{ scrapingProgress.users.total }}</span>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="getProgressPercent(scrapingProgress.users.completed, scrapingProgress.users.total)" 
                  class="tag-progress">
                </mat-progress-bar>
              </div>
            </div>

            <!-- Metrics -->
            <div class="metrics-container" *ngIf="hasScrapingMetrics()">
              <div class="metric">
                <span class="metric-value">{{ scrapingProgress.metrics.totalScraped }}</span>
                <span class="metric-label">Total Scraped</span>
              </div>
              
              <div class="metric">
                <span class="metric-value">{{ scrapingProgress.metrics.saved }}</span>
                <span class="metric-label">Saved</span>
              </div>
              
              <div class="metric" *ngIf="scrapingProgress.metrics.errors > 0">
                <span class="metric-value error-text">{{ scrapingProgress.metrics.errors }}</span>
                <span class="metric-label">Errors</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Campaign Details Card -->
        <mat-card class="details-card">
          <mat-card-content>
            <div class="campaign-info">
              <div class="info-section">
                <h3>Campaign Details</h3>
                <p *ngIf="campaign.description">{{ campaign.description }}</p>
                
                <div class="info-grid">
                  <div class="info-item">
                    <strong>Status:</strong> {{ getStatusLabel(campaign.status) }}
                  </div>
                  <div class="info-item">
                    <strong>Created:</strong> {{ campaign.createdAt | date:'mediumDate' }}
                  </div>
                  <div class="info-item">
                    <strong>Start Date:</strong> {{ campaign.startDate | date:'mediumDate' }}
                  </div>
                  <div class="info-item">
                    <strong>End Date:</strong> {{ campaign.endDate | date:'mediumDate' }}
                  </div>
                  <div class="info-item">
                    <strong>Max Tweets:</strong> {{ campaign.maxTweets || 'Unlimited' }}
                  </div>
                  <div class="info-item">
                    <strong>Analysis:</strong> {{ campaign.sentimentAnalysis ? 'Sentiment Analysis Enabled' : 'Basic Analysis' }}
                  </div>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="tracking-section">
                <h3>Tracking Parameters</h3>
                
                <!-- Hashtags -->
                <div class="tracking-group" *ngIf="campaign.hashtags?.length">
                  <h4><mat-icon>tag</mat-icon> Hashtags</h4>
                  <div class="chips-container">
                    <span class="hashtag-chip" *ngFor="let hashtag of campaign.hashtags">
                      #{{ hashtag }}
                    </span>
                  </div>
                </div>
                
                <!-- Keywords -->
                <div class="tracking-group" *ngIf="campaign.keywords?.length">
                  <h4><mat-icon>search</mat-icon> Keywords</h4>
                  <div class="chips-container">
                    <span class="keyword-chip" *ngFor="let keyword of campaign.keywords">
                      {{ keyword }}
                    </span>
                  </div>
                </div>
                
                <!-- Mentions -->
                <div class="tracking-group" *ngIf="campaign.mentions?.length">
                  <h4><mat-icon>alternate_email</mat-icon> Mentions</h4>
                  <div class="chips-container">
                    <span class="mention-chip" *ngFor="let mention of campaign.mentions">
                      {{ '@' + mention }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Placeholder for tweet table - would be implemented in future iteration -->
        <div class="placeholder-section">
          <h3>Recent Tweets</h3>
          <p class="placeholder-message">Tweet table will be implemented in the next iteration.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .campaign-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      text-align: center;
    }

    .loading-text {
      margin-top: 20px;
      color: var(--color-gray-600);
    }

    .error-card {
      max-width: 500px;
      text-align: center;
      padding: 20px;
    }

    .error-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .campaign-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .campaign-title h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 28px;
      margin-bottom: 8px;
    }

    .campaign-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .status-badge, .type-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge {
      background-color: #e0e0e0;
    }

    .status-active {
      background-color: #c8e6c9;
      color: #2e7d32;
    }

    .status-paused {
      background-color: #fff9c4;
      color: #f57f17;
    }

    .status-completed {
      background-color: #e1f5fe;
      color: #0277bd;
    }

    .type-badge {
      background-color: #e0e0e0;
      color: #424242;
    }

    .campaign-actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .run-scraping-button {
      background-color: #3f51b5;
      color: white;
    }

    .scraping-card {
      margin-bottom: 24px;
    }

    .progress-container {
      margin: 20px 0;
    }

    .progress-container h3 {
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .overall-progress {
      height: 8px;
      border-radius: 4px;
    }

    .progress-tags {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 20px 0;
    }

    .progress-tag {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 4px;
      background-color: #f5f5f5;
      border-left: 3px solid #e0e0e0;
    }

    .in-progress {
      border-left-color: #3f51b5;
      background-color: rgba(63, 81, 181, 0.1);
    }

    .tag-label {
      flex: 1;
      font-weight: 500;
    }

    .tag-progress {
      width: 100px;
      height: 4px;
      border-radius: 2px;
    }

    .metrics-container {
      display: flex;
      gap: 24px;
      margin-top: 20px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 500;
    }

    .metric-label {
      font-size: 12px;
      color: #757575;
    }

    .error-text {
      color: #d32f2f;
    }

    .details-card {
      margin-bottom: 24px;
    }

    .campaign-info {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-section h3, .tracking-section h3 {
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tracking-group {
      margin-bottom: 20px;
    }

    .tracking-group h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .hashtag-chip, .keyword-chip, .mention-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
    }

    .hashtag-chip {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .keyword-chip {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .mention-chip {
      background-color: #e0f2f1;
      color: #00695c;
    }

    .icon-active {
      color: #43a047;
    }

    .icon-paused {
      color: #fb8c00;
    }

    .placeholder-section {
      margin-top: 24px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
      text-align: center;
    }

    .placeholder-message {
      color: #757575;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .campaign-header {
        flex-direction: column;
        align-items: stretch;
      }

      .campaign-actions {
        flex-direction: column;
      }

      .metrics-container {
        flex-wrap: wrap;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CampaignDetailComponent implements OnInit, OnDestroy {
  // Inject dependencies
  private route = inject(ActivatedRoute);
  private campaignFacade = inject(CampaignFacade);
  private scrapingService = inject(ScrapingService);
  private scrapingDispatchService = inject(ScrapingDispatchService);
  private snackBar = inject(MatSnackBar);
  
  // Component state
  campaign: Campaign | null = null;
  loading = true;
  error: string | null = null;
  scrapingProgress: ScrapingProgress | null = null;
  
  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();
  
  // Computed properties
  get isScrapingRunning(): boolean {
    return this.scrapingProgress?.status === 'running';
  }
  
  ngOnInit(): void {
    // Get campaign ID from route
    const campaignId = this.route.snapshot.paramMap.get('id');
    
    if (!campaignId) {
      this.error = 'Campaign ID not found in URL';
      this.loading = false;
      return;
    }
    
    // Check if we should auto-start scraping (coming from campaign creation)
    const autoStartScraping = this.route.snapshot.queryParamMap.has('autoScrape') || 
                             new URLSearchParams(window.location.search).has('autoScrape');
    
    // Load campaign data
    this.campaignFacade.selectCampaign(campaignId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (campaign) => {
          this.campaign = campaign;
          this.loading = false;
          
          if (!campaign) {
            this.error = 'Campaign not found';
            return;
          }
          
          // Auto-start scraping if the campaign was just created and has dataSources including Twitter
          // or if autoStartScraping flag is set
          const shouldAutoScrape = (
            autoStartScraping || 
            (campaign.dataSources?.includes('twitter') && this.isRecentlyCreated(campaign))
          );
          
          if (shouldAutoScrape) {
            setTimeout(() => this.runScraping(), 1000); // Small delay to let UI render first
          }
        },
        error: (err) => {
          this.error = `Failed to load campaign: ${err.message || 'Unknown error'}`;
          this.loading = false;
        }
      });
      
    // Subscribe to scraping progress
    this.scrapingService.scrapingProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.scrapingProgress = progress;
      });
  }
  
  /**
   * Check if campaign was created recently (within last 5 minutes)
   */
  private isRecentlyCreated(campaign: Campaign): boolean {
    if (!campaign.createdAt) return false;
    
    const createdAtDate = new Date(campaign.createdAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return createdAtDate > fiveMinutesAgo;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Start scraping process for this campaign using the dispatch service
   * This now uses the specialized dispatch service to handle different campaign types
   */
  runScraping(): void {
    if (!this.campaign || this.isScrapingRunning) {
      return;
    }
    
    this.snackBar.open('Starting scraping process...', 'Close', { duration: 2000 });
    
    // Use the dispatch service which handles campaign type conversion and specialized scraping
    this.scrapingDispatchService.dispatchScraping(this.campaign)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          this.snackBar.open(`Error running scraping: ${err.message || 'Unknown error'}`, 'Close', { 
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }
  
  /**
   * Calculate percentage based on completed/total
   */
  getProgressPercent(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
  
  /**
   * Check if there are any metrics to display
   */
  hasScrapingMetrics(): boolean {
    if (!this.scrapingProgress) return false;
    const { totalScraped, saved, errors } = this.scrapingProgress.metrics;
    return totalScraped > 0 || saved > 0 || errors > 0;
  }
  
  /**
   * Get text description of current scraping status
   */
  getScrapingStatusText(): string {
    if (!this.scrapingProgress) {
      return 'No scraping data yet';
    }
    
    switch (this.scrapingProgress.status) {
      case 'idle':
        return 'Ready to start scraping';
      case 'running':
        return 'Scraping in progress...';
      case 'completed':
        return 'Scraping completed successfully';
      case 'error':
        return 'Error occurred during scraping';
      default:
        return 'Unknown status';
    }
  }
  
  // Helper methods for display
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      active: 'play_circle',
      paused: 'pause_circle',
      completed: 'check_circle',
      inactive: 'drafts',
      cancelled: 'cancel',
    };
    return icons[status] || 'help';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      hashtag: 'tag',
      keyword: 'search',
      user: 'person',
      mention: 'alternate_email',
    };
    return icons[type] || 'campaign';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      hashtag: 'Hashtag Monitoring',
      keyword: 'Keyword Tracking',
      user: 'User Monitoring',
      mention: 'Mention Tracking',
    };
    return labels[type] || type;
  }
  
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      inactive: 'Inactive',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }
}
