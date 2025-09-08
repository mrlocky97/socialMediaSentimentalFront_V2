/**
 * Campaign Detail Component
 * Clean, maintainable component with separated concerns
 */

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
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subject, catchError, combineLatest, of, takeUntil, tap } from 'rxjs';

// Core interfaces and services
import {
  CampaignStats,
  Tweet,
  TweetWithCalculatedFields,
} from '../../../core/interfaces/tweet.interface';
import { ScrapingDispatchService } from '../../../core/services/scraping-dispatch.service';
import { ScrapingProgress, ScrapingService } from '../../../core/services/scraping.service';
import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';
import { TweetFacade } from '../../../core/store/fecades/tweet.facade';

// UI Components and services
import { SolidDataTableRxjsComponent } from '../../../shared/components/solid-data-table/solid-data-table.component';

// Business logic services
import { TableAction } from '../../../shared/components/solid-data-table/interfaces/solid-data-table.interface';
import { AIInsight } from './interfaces/campaign-detail-insight.interface';
import { CampaignAnalyticsService } from './services/campaign-detail-analytic.service';
import { CampaignAIService } from './services/campaign-detail-insight.service';
import { CampaignUIService } from './services/campaign-detail-iu.service';

// Register Chart.js components
Chart.register(...registerables);

interface ComponentState {
  readonly campaign: Campaign | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly scrapingProgress: ScrapingProgress | null;
  readonly tweets: readonly Tweet[];
  readonly tweetsLoading: boolean;
  readonly tweetsError: string | null;
  readonly campaignStats: CampaignStats | null;
  readonly tweetsWithCalculatedFields: readonly TweetWithCalculatedFields[];
  readonly aiAnalyzing: boolean;
  readonly aiError: string | null;
}

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
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatTableModule,
    BaseChartDirective,
    SolidDataTableRxjsComponent,
  ],
  templateUrl: './campaign-detail.component.html',
  styleUrls: ['./campaign-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetailComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly route = inject(ActivatedRoute);
  private readonly campaignFacade = inject(CampaignFacade);
  private readonly tweetFacade = inject(TweetFacade);
  private readonly scrapingService = inject(ScrapingService);
  private readonly scrapingDispatchService = inject(ScrapingDispatchService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  // Business logic services
  private readonly analyticsService = inject(CampaignAnalyticsService);
  private readonly uiService = inject(CampaignUIService);
  private readonly aiService = inject(CampaignAIService);

  // Component state using signals
  private readonly state = signal<ComponentState>({
    campaign: null,
    loading: true,
    error: null,
    scrapingProgress: null,
    tweets: [],
    tweetsLoading: false,
    tweetsError: null,
    campaignStats: null,
    tweetsWithCalculatedFields: [],
    aiAnalyzing: false,
    aiError: null,
  });

  // Computed properties for template access
  readonly campaign = computed(() => this.state().campaign);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly scrapingProgress = computed(() => this.state().scrapingProgress);
  readonly tweets = computed(() => this.state().tweets);
  readonly tweetsLoading = computed(() => this.state().tweetsLoading);
  readonly tweetsError = computed(() => this.state().tweetsError);
  readonly campaignStats = computed(() => this.state().campaignStats);
  readonly tweetsWithCalculatedFields = computed(() => this.state().tweetsWithCalculatedFields);
  readonly mutableTweetsForTable = computed(() => [...this.state().tweetsWithCalculatedFields]);

  // AI Insights computed properties
  readonly intelligence = computed(() => this.aiService.intelligence());
  readonly aiAnalyzing = computed(() => this.aiService.analyzing());
  readonly aiError = computed(() => this.aiService.error());
  readonly highPriorityInsightsCount = computed(() => {
    const intelligence = this.intelligence();
    if (!intelligence) return 0;
    return intelligence.insights.filter((i: AIInsight) => i.priority === 'critical' || i.priority === 'high').length;
  });

  // UI computed properties
  readonly isScrapingRunning = computed(() => this.scrapingProgress()?.status === 'running');
  readonly hasScrapingMetrics = computed(() => {
    const progress = this.scrapingProgress();
    if (!progress) return false;
    const { totalScraped, saved, errors } = progress.metrics;
    return totalScraped > 0 || saved > 0 || errors > 0;
  });
  readonly hasTweetsData = computed(() => this.tweets().length > 0);
  readonly shouldShowTimelineChart = computed(() =>
    this.analyticsService.shouldShowTimelineChart(this.campaignStats())
  );

  // Chart configurations - lazy loaded
  readonly sentimentChartConfig = computed(() => {
    const stats = this.campaignStats();
    return stats ? this.analyticsService.createSentimentChartConfig(stats) : null;
  });

  readonly hashtagsChartConfig = computed(() => {
    const stats = this.campaignStats();
    return stats ? this.analyticsService.createHashtagsChartConfig(stats) : null;
  });

  readonly tweetsTimelineChartConfig = computed(() => {
    const stats = this.campaignStats();
    return stats ? this.analyticsService.createTimelineChartConfig(stats) : null;
  });

  // Table configuration
  private readonly tableSetup = this.uiService.createTweetTableConfig();
  readonly tweetTableColumns = this.tableSetup.columns;
  readonly tweetTableConfig = this.tableSetup.config;
  readonly tweetTableActions = this.tableSetup.actions;

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const campaignId = this.extractCampaignId();
    if (!campaignId) {
      this.updateState({ error: 'Campaign ID not found in URL', loading: false });
      return;
    }

    this.initializeComponent(campaignId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Public methods for template
  runScraping(): void {
    const campaign = this.campaign();
    if (!campaign || this.isScrapingRunning()) return;

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

  onTweetRowClick(tweet: Tweet): void {
    this.tweetFacade.selectTweet(tweet._id);
  }

  onTweetAction(event: { action: TableAction<Tweet>; item: Tweet }): void {
    const { action, item } = event;

    switch (action.label.toLowerCase()) {
      case 'view':
        this.showTweetDetails(item);
        break;
      case 'open tweet':
        this.openTweetInNewTab(item);
        break;
    }
  }

  onTweetPageChange(event: any): void {
    const campaignId = this.extractCampaignId();
    if (campaignId) {
      this.tweetFacade.loadTweets(campaignId, {
        page: event.pageIndex + 1,
        limit: event.pageSize,
      });
    }
  }

  refreshTweets(): void {
    const campaignId = this.extractCampaignId();
    if (campaignId) {
      this.tweetFacade.loadTweets(campaignId, { page: 1, limit: 20 });
    }
  }

  // UI helper methods - delegated to UI service
  getStatusIcon = (status: string) => this.uiService.getStatusIcon(status);
  getTypeIcon = (type: string) => this.uiService.getTypeIcon(type);
  getStatusLabel = (status: string) => this.uiService.getStatusLabel(status);
  getTypeLabel = (type: string) => this.uiService.getTypeLabel(type);
  getProgressPercent = (completed: number, total: number) =>
    this.uiService.getProgressPercent(completed, total);
  getScrapingStatusText = () =>
    this.uiService.getScrapingStatusText(this.scrapingProgress()?.status || null);
  getSentimentColor = (sentiment: string) => this.analyticsService.getSentimentColor(sentiment);
  formatNumber = (num: number) => this.analyticsService.formatNumber(num);

  // Private implementation methods
  private extractCampaignId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  private shouldAutoStartScraping(): boolean {
    return (
      this.route.snapshot.queryParamMap.has('autoScrape') ||
      new URLSearchParams(window.location.search).has('autoScrape')
    );
  }

  private initializeComponent(campaignId: string): void {
    console.log('Campaign Detail Component: Loading campaign with ID:', campaignId);

    const autoStartScraping = this.shouldAutoStartScraping();

    // Load initial data
    this.campaignFacade.loadCampaigns();
    this.tweetFacade.loadTweets(campaignId, { page: 1, limit: 20 });

    // Setup data subscriptions
    this.setupDataSubscriptions(campaignId, autoStartScraping);
    this.setupScrapingProgressSubscription();
  }

  private setupDataSubscriptions(campaignId: string, autoStartScraping: boolean): void {
    combineLatest([
      this.campaignFacade.selectCampaign(campaignId),
      this.tweetFacade.getTweetsByCampaign(campaignId),
      this.tweetFacade.loading$,
      this.tweetFacade.error$,
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([campaign, tweets, tweetsLoading, tweetsError]) => {
          this.handleDataUpdate(
            campaign,
            tweets,
            tweetsLoading,
            tweetsError,
            campaignId,
            autoStartScraping
          );
        }),
        catchError((err) => {
          console.error('Error loading campaign or tweets:', err);
          this.updateState({
            error: `Failed to load data: ${err.message || 'Unknown error'}`,
            loading: false,
          });
          return of(null);
        })
      )
      .subscribe(() => this.cdr.markForCheck());
  }

  private handleDataUpdate(
    campaign: Campaign | null,
    tweets: Tweet[],
    tweetsLoading: boolean,
    tweetsError: string | null,
    campaignId: string,
    autoStartScraping: boolean
  ): void {
    // Handle campaign data
    if (!campaign) {
      this.updateState({
        error: `Campaign with ID "${campaignId}" not found`,
        loading: false,
      });
      return;
    }

    // Update campaign state
    this.updateState({
      campaign,
      loading: false,
      tweets,
      tweetsLoading,
      tweetsError,
    });

    // Auto-start scraping if needed
    if (autoStartScraping || this.uiService.isRecentlyCreated(campaign)) {
      setTimeout(() => this.runScraping(), 1000);
    }

    // Update analytics
    this.updateAnalytics(tweets);
  }

  private updateAnalytics(tweets: Tweet[]): void {
    if (tweets.length > 0) {
      const { stats, tweetsWithCalculatedFields } =
        this.analyticsService.calculateAnalytics(tweets);
      this.updateState({ campaignStats: stats, tweetsWithCalculatedFields });
      
      // Generate AI insights when we have campaign data and stats
      const campaign = this.campaign();
      if (campaign && stats) {
        this.aiService.generateIntelligence(campaign, stats);
      }
    } else {
      this.updateState({ campaignStats: null, tweetsWithCalculatedFields: [] });
    }
  }

  private setupScrapingProgressSubscription(): void {
    this.scrapingService.scrapingProgress$.pipe(takeUntil(this.destroy$)).subscribe((progress) => {
      this.updateState({ scrapingProgress: progress });
      this.cdr.markForCheck();
    });
  }

  private showTweetDetails(tweet: Tweet): void {
    const truncatedContent = this.uiService.truncateText(tweet.content, 50);
    this.snackBar.open(`Viewing tweet: ${truncatedContent}`, 'Close', { duration: 3000 });
  }

  private openTweetInNewTab(tweet: Tweet): void {
    const tweetUrl = this.uiService.generateTweetUrl(tweet.tweetId);
    window.open(tweetUrl, '_blank');
  }

  // AI Insights methods
  async refreshAiAnalysis(): Promise<void> {
    const campaign = this.campaign();
    const stats = this.campaignStats();

    if (campaign && stats) {
      await this.aiService.refreshIntelligence(campaign, stats);
    }
  }

  async applyRecommendation(insightId: string): Promise<void> {
    await this.aiService.applyRecommendation(insightId);
    this.snackBar.open('Recommendation applied successfully', 'Close', { duration: 2000 });
  }

  getInsightsByCategory(category: string): AIInsight[] {
    const intelligence = this.intelligence();
    return intelligence?.insights.filter(insight => insight.category === category) || [];
  }

  private updateState(updates: Partial<ComponentState>): void {
    this.state.update((current) => ({ ...current, ...updates }));
  }
}
