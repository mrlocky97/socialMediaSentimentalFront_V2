/* =====================================
   CAMPAIGN DETAIL COMPONENT - OPTIMIZED
   ===================================== */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subject, catchError, combineLatest, of, takeUntil, tap } from 'rxjs';
import { CampaignStats, Tweet, TweetWithCalculatedFields } from '../../../core/interfaces/tweet.interface';
import { ScrapingDispatchService } from '../../../core/services/scraping-dispatch.service';
import { ScrapingProgress, ScrapingService } from '../../../core/services/scraping.service';
import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';
import { TweetFacade } from '../../../core/store/fecades/tweet.facade';
import { TableAction, TableColumn, TableConfig } from '../../../shared/components/solid-data-table/service/table-services';
import { SolidDataTableRxjsComponent } from '../../../shared/components/solid-data-table/solid-data-table-rxjs.component';

import { computeCampaignStats, safeDivide } from '../../../shared/utils/campaign-aggregator';

// Register Chart.js components
Chart.register(...registerables);

// Constants for better maintainability
const STATUS_ICONS: { [key: string]: string } = {
  active: 'play_circle',
  paused: 'pause_circle',
  completed: 'check_circle',
  inactive: 'drafts',
  cancelled: 'cancel',
};

const TYPE_ICONS: { [key: string]: string } = {
  hashtag: 'tag',
  keyword: 'search',
  user: 'person',
  mention: 'alternate_email',
};

const STATUS_LABELS: { [key: string]: string } = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  inactive: 'Inactive',
  cancelled: 'Cancelled',
};

const TYPE_LABELS: { [key: string]: string } = {
  hashtag: 'Hashtag Monitoring',
  keyword: 'Keyword Tracking',
  user: 'User Monitoring',
  mention: 'Mention Tracking',
};

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
    MatTabsModule,
    MatTableModule,
    BaseChartDirective,
    SolidDataTableRxjsComponent,
  ],
  templateUrl: './campaign-detail.component.html',
  styleUrls: ['./campaign-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimización clave
})
export class CampaignDetailComponent implements OnInit, OnDestroy {
  // Inject dependencies
  private route = inject(ActivatedRoute);
  private campaignFacade = inject(CampaignFacade);
  private tweetFacade = inject(TweetFacade);
  private scrapingService = inject(ScrapingService);
  private scrapingDispatchService = inject(ScrapingDispatchService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  // Component state using signals for better reactivity
  campaign = signal<Campaign | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  scrapingProgress = signal<ScrapingProgress | null>(null);
  tweets = signal<Tweet[]>([]);
  tweetsLoading = signal(false);
  tweetsError = signal<string | null>(null);

  // Campaign analytics signals
  campaignStats = signal<CampaignStats | null>(null);
  tweetsWithCalculatedFields = signal<TweetWithCalculatedFields[]>([]);

  // Computed properties using signals
  isScrapingRunning = computed(() => this.scrapingProgress()?.status === 'running');

  hasScrapingMetrics = computed(() => {
    const progress = this.scrapingProgress();
    if (!progress) return false;

    const { totalScraped, saved, errors } = progress.metrics;
    return totalScraped > 0 || saved > 0 || errors > 0;
  });

  // Analytics computed properties
  hasTweetsData = computed(() => this.tweets().length > 0);
  
  // Chart configurations
  sentimentChartConfig: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: ['Positive', 'Negative', 'Neutral', 'Unknown'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          '#4CAF50', // Green for positive
          '#F44336', // Red for negative  
          '#9E9E9E', // Gray for neutral
          '#FF9800'  // Orange for unknown
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  };

  hashtagsChartConfig: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Frequency',
        data: [],
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  };

  tweetsTimelineChartConfig: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Tweets per Day',
        data: [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  };

  // Table configuration for tweets - Optimized for web recommendations
  tweetTableColumns: TableColumn<Tweet>[] = [
    { 
      key: 'content', 
      label: 'Tweet Content', 
      sortable: false, 
      width: '280px',
      formatter: (content: string) => content.length > 80 ? content.substring(0, 80) + '...' : content
    },
    { 
      key: 'author', 
      label: 'Author', 
      sortable: false, 
      width: '140px',
      formatter: (author: any) => author?.username || 'Unknown'
    },
    { 
      key: 'sentiment', 
      label: 'Sentiment', 
      sortable: true, 
      width: '110px',
      formatter: (sentiment: any) => sentiment?.label || 'Unknown'
    },
    { 
      key: 'engagement', 
      label: 'Engagement', 
      sortable: true, 
      width: '100px',
      formatter: (value: any, row?: any) => {
        const tweet = row as TweetWithCalculatedFields;
        return tweet?.calculatedEngagement?.toString() || tweet?.metrics?.engagement?.toString() || '0';
      }
    },
    { 
      key: 'engagementRate', 
      label: 'Eng. Rate %', 
      sortable: true, 
      width: '110px',
      formatter: (value: any, row?: any) => {
        const tweet = row as TweetWithCalculatedFields;
        const rate = tweet?.calculatedEngagementRate;
        return rate !== undefined ? `${rate.toFixed(2)}%` : '0.00%';
      }
    },
    { 
      key: 'language', 
      label: 'Language', 
      sortable: true, 
      width: '90px'
    },
    { 
      key: 'tweetCreatedAt', 
      label: 'Date', 
      sortable: true, 
      width: '120px',
      formatter: (date: string) => new Date(date).toLocaleDateString()
    }
  ];

  tweetTableConfig: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: false,
    multiSelection: false,
    pageSize: 15, // Optimized page size for better UX
    pageSizeOptions: [10, 15, 25, 50], // More flexible options
  };

  tweetTableActions: TableAction<Tweet>[] = [
    { icon: 'visibility', label: 'View', color: 'primary' },
    { icon: 'link', label: 'Open Tweet', color: 'primary' }
  ];

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Get campaign ID from route
    const campaignId = this.route.snapshot.paramMap.get('id');

    if (!campaignId) {
      this.error.set('Campaign ID not found in URL');
      this.loading.set(false);
      this.cdr.markForCheck();
      return;
    }

    console.log('Campaign Detail Component: Loading campaign with ID:', campaignId);

    // Check if we should auto-start scraping
    const autoStartScraping =
      this.route.snapshot.queryParamMap.has('autoScrape') ||
      new URLSearchParams(window.location.search).has('autoScrape');

    // First, try to load all campaigns to ensure we have the data
    this.campaignFacade.loadCampaigns();

    // Load campaign data and tweets in parallel
    combineLatest([
      this.campaignFacade.selectCampaign(campaignId),
      this.tweetFacade.getTweetsByCampaign(campaignId),
      this.tweetFacade.loading$,
      this.tweetFacade.error$
    ]).pipe(
      takeUntil(this.destroy$),
      tap(([campaign, tweets, tweetsLoading, tweetsError]) => {
        console.log('Campaign Detail Component: Received data:', { campaign, tweets, tweetsLoading, tweetsError });
        
        // Handle campaign data
        if (!campaign) {
          console.log('No campaign found in store for ID:', campaignId);
          this.error.set(`Campaign with ID "${campaignId}" not found`);
          this.loading.set(false);
        } else {
          this.campaign.set(campaign);
          this.loading.set(false);

          // Auto-start scraping if conditions are met
          const shouldAutoScrape =
            autoStartScraping ||
            (campaign.dataSources?.includes('twitter') && this.isRecentlyCreated(campaign));

          if (shouldAutoScrape) {
            setTimeout(() => this.runScraping(), 1000);
          }
        }

        // Handle tweets data
        this.tweets.set(tweets);
        this.tweetsLoading.set(tweetsLoading);
        this.tweetsError.set(tweetsError);
        
        // Calculate campaign statistics and update charts when tweets are available
        if (tweets && tweets.length > 0) {
          this.calculateCampaignAnalytics(tweets);
        } else {
          // Clear analytics when no tweets
          this.campaignStats.set(null);
          this.tweetsWithCalculatedFields.set([]);
        }
      }),
      catchError((err) => {
        console.error('Error loading campaign or tweets:', err);
        this.error.set(`Failed to load data: ${err.message || 'Unknown error'}`);
        this.loading.set(false);
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(() => this.cdr.markForCheck());

    // Load tweets for this campaign
    console.log('Loading tweets for campaign:', campaignId);
    this.tweetFacade.loadTweets(campaignId, { page: 1, limit: 20 });

    // Subscribe to scraping progress
    this.scrapingService.scrapingProgress$.pipe(takeUntil(this.destroy$)).subscribe((progress) => {
      this.scrapingProgress.set(progress);
      this.cdr.markForCheck();
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
   */
  runScraping(): void {
    const campaign = this.campaign();
    if (!campaign || this.isScrapingRunning()) {
      return;
    }

    this.snackBar.open('Starting scraping process...', 'Close', { duration: 2000 });

    this.scrapingDispatchService
      .dispatchScraping(campaign)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          this.snackBar.open(`Error running scraping: ${err.message || 'Unknown error'}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar',
          });
        },
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
   * Get text description of current scraping status
   */
  getScrapingStatusText(): string {
    const progress = this.scrapingProgress();
    if (!progress) {
      return 'No scraping data yet';
    }

    switch (progress.status) {
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

  // Helper methods for display using constants
  getStatusIcon(status: string): string {
    return STATUS_ICONS[status] || 'help';
  }

  getTypeIcon(type: string): string {
    return TYPE_ICONS[type] || 'campaign';
  }

  getTypeLabel(type: string): string {
    return TYPE_LABELS[type] || type;
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  /**
   * Handle tweet table row click
   */
  onTweetRowClick(tweet: Tweet): void {
    console.log('Tweet clicked:', tweet);
    this.tweetFacade.selectTweet(tweet._id);
  }

  /**
   * Handle tweet table action click
   */
  onTweetAction(event: { action: TableAction<Tweet>; item: Tweet }): void {
    const { action, item } = event;
    
    switch (action.label.toLowerCase()) {
      case 'view':
        this.viewTweetDetails(item);
        break;
      case 'open tweet':
        this.openTweetInNewTab(item);
        break;
      default:
        console.log('Unknown action:', action.label);
    }
  }

  /**
   * View tweet details (could open a dialog or navigate to detail view)
   */
  private viewTweetDetails(tweet: Tweet): void {
    console.log('Viewing tweet details:', tweet);
    this.snackBar.open(`Viewing tweet: ${tweet.content.substring(0, 50)}...`, 'Close', {
      duration: 3000
    });
  }

  /**
   * Open original tweet in new tab
   */
  private openTweetInNewTab(tweet: Tweet): void {
    const tweetUrl = `https://twitter.com/i/web/status/${tweet.tweetId}`;
    window.open(tweetUrl, '_blank');
  }

  /**
   * Handle pagination change for tweets
   */
  onTweetPageChange(event: any): void {
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (campaignId) {
      this.tweetFacade.loadTweets(campaignId, { 
        page: event.pageIndex + 1, 
        limit: event.pageSize 
      });
    }
  }

  /**
   * Refresh tweets data
   */
  refreshTweets(): void {
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (campaignId) {
      console.log('Refreshing tweets for campaign:', campaignId);
      this.tweetFacade.loadTweets(campaignId, { page: 1, limit: 20 });
    }
  }

  /**
   * Calculate comprehensive campaign analytics from tweets data
   */
  private calculateCampaignAnalytics(tweets: Tweet[]): void {
    try {
      // Calculate campaign statistics
      const stats = computeCampaignStats(tweets);
      this.campaignStats.set(stats);

      // Create tweets with calculated fields
      const tweetsWithCalculated: TweetWithCalculatedFields[] = tweets.map(tweet => {
        const engagement = tweet.metrics.engagement !== undefined 
          ? tweet.metrics.engagement 
          : (tweet.metrics.likes || 0) + (tweet.metrics.retweets || 0) + 
            (tweet.metrics.replies || 0) + (tweet.metrics.quotes || 0) + (tweet.metrics.bookmarks || 0);
        
        const engagementRate = tweet.metrics.views > 0 
          ? safeDivide(engagement * 100, tweet.metrics.views, 2)
          : 0;

        return {
          ...tweet,
          calculatedEngagement: engagement,
          calculatedEngagementRate: engagementRate
        };
      });

      this.tweetsWithCalculatedFields.set(tweetsWithCalculated);

      // Update charts
      this.updateSentimentChart(stats);
      this.updateHashtagsChart(stats);
      this.updateTimelineChart(stats);

      console.log('Campaign analytics calculated:', stats);
    } catch (error) {
      console.error('Error calculating campaign analytics:', error);
    }
  }

  /**
   * Update sentiment distribution chart
   */
  private updateSentimentChart(stats: CampaignStats): void {
    const { sentimentCounts } = stats;
    this.sentimentChartConfig.data.datasets[0].data = [
      sentimentCounts.positive,
      sentimentCounts.negative,
      sentimentCounts.neutral,
      sentimentCounts.unknown
    ];
  }

  /**
   * Update hashtags frequency chart
   */
  private updateHashtagsChart(stats: CampaignStats): void {
    const topHashtags = stats.topHashtags.slice(0, 10);
    this.hashtagsChartConfig.data.labels = topHashtags.map(h => `#${h.hashtag}`);
    this.hashtagsChartConfig.data.datasets[0].data = topHashtags.map(h => h.count);
  }

  /**
   * Update tweets timeline chart
   */
  private updateTimelineChart(stats: CampaignStats): void {
    const tweetsByDay = stats.tweetsByDay;
    const sortedDates = Object.keys(tweetsByDay).sort();
    
    // Only show timeline if we have more than one day of data
    if (sortedDates.length > 1) {
      this.tweetsTimelineChartConfig.data.labels = sortedDates;
      this.tweetsTimelineChartConfig.data.datasets[0].data = sortedDates.map(date => tweetsByDay[date]);
    } else {
      // Clear chart for single day data
      this.tweetsTimelineChartConfig.data.labels = [];
      this.tweetsTimelineChartConfig.data.datasets[0].data = [];
    }
  }

  /**
   * Get sentiment color for badges
   */
  getSentimentColor(sentiment: string): string {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'primary';
      case 'negative': return 'warn';
      case 'neutral': return 'accent';
      default: return 'accent';
    }
  }

  /**
   * Format number with appropriate suffix (K, M, etc.)
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Get whether timeline chart should be shown
   */
  shouldShowTimelineChart(): boolean {
    const stats = this.campaignStats();
    if (!stats) return false;
    
    const dates = Object.keys(stats.tweetsByDay);
    return dates.length > 1;
  }
}
