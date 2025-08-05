import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

import { AuthService, User } from '../../../core/auth/services/auth.service';
import { Campaign, MarketingInsights, ScrapingStatus, SentimentAnalysisService } from '../../../core/services/sentiment-analysis.service';
import { CampaignSummaryWidgetComponent } from '../../campaign-management/campaign-summary-widget/campaign-summary-widget.component';
import { PendingTweetWidgetComponent } from '../../pending-tweet-widget/pending-tweet-widget.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatGridListModule,
    MatDividerModule,
    CampaignSummaryWidgetComponent,
    PendingTweetWidgetComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private sentimentService = inject(SentimentAnalysisService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals para estado del componente
  private _isLoading = signal(false);
  private _campaigns = signal<Campaign[]>([]);
  private _scrapingStatus = signal<ScrapingStatus | null>(null);
  private _marketingInsights = signal<MarketingInsights | null>(null);
  private _currentUser = signal<User | null>(null);

  // Computed properties
  isLoading = computed(() => this._isLoading());
  campaigns = computed(() => this._campaigns());
  scrapingStatus = computed(() => this._scrapingStatus());
  marketingInsights = computed(() => this._marketingInsights());
  currentUser = computed(() => this._currentUser());

  // Dashboard metrics computed
  activeCampaigns = computed(() =>
    this.campaigns().filter(c => c.status === 'active').length
  );

  totalTweets = computed(() =>
    this.campaigns().reduce((total, campaign) => total + (campaign.stats?.totalTweets || 0), 0)
  );

  averageSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (campaigns.length === 0) return 0;
    const totalSentiment = campaigns.reduce((sum, c) => sum + (c.stats?.averageSentiment || 0), 0);
    return Math.round((totalSentiment / campaigns.length) * 100) / 100;
  });

  recentCampaigns = computed(() =>
    this.campaigns()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  // Role-based UI visibility
  canManageCampaigns = computed(() => {
    const user = this.currentUser();
    return user && ['admin', 'manager', 'analyst'].includes(user.role);
  });

  canViewAnalytics = computed(() => {
    const user = this.currentUser();
    return user && ['admin', 'manager', 'analyst', 'onlyView'].includes(user.role);
  });

  canManageUsers = computed(() => {
    const user = this.currentUser();
    return user && ['admin', 'manager'].includes(user.role);
  });

  // Additional computed properties for dashboard metrics
  avgSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) => acc + (campaign.stats?.averageSentiment || 0), 0);
    return sum / campaigns.length;
  });

  totalEngagement = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    return campaigns.reduce((acc, campaign) => acc + (campaign.stats?.totalEngagement || 0), 0);
  });

  positiveSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) =>
      acc + (campaign.stats?.sentimentDistribution?.positive || 0), 0);
    return sum / campaigns.length;
  });

  neutralSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) =>
      acc + (campaign.stats?.sentimentDistribution?.neutral || 0), 0);
    return sum / campaigns.length;
  });

  negativeSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) =>
      acc + (campaign.stats?.sentimentDistribution?.negative || 0), 0);
    return sum / campaigns.length;
  });

  constructor() {
    // Initialize effect in constructor (injection context)
    effect(() => {
      const user = this.authService.currentUser();
      this._currentUser.set(user);
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();

    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.refreshScrapingStatus();
    }, 30000);
  }

  private async loadDashboardData(): Promise<void> {
    this._isLoading.set(true);

    try {
      // Load data in parallel
      await Promise.all([
        this.loadCampaigns(),
        this.loadScrapingStatus(),
        this.loadMarketingInsights()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showError('Error cargando datos del dashboard');
    } finally {
      this._isLoading.set(false);
    }
  }

  private async loadCampaigns(): Promise<void> {
    try {
      // Load campaigns using the service's loadDashboardData method
      await this.sentimentService.loadDashboardData().toPromise();
      // Get campaigns from the service's signal
      const campaigns = this.sentimentService.campaigns();
      this._campaigns.set(campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  }

  private async loadScrapingStatus(): Promise<void> {
    try {
      // Load data first, then get status from signal
      await this.sentimentService.loadDashboardData().toPromise();
      const status = this.sentimentService.scrapingStatus();
      this._scrapingStatus.set(status);
    } catch (error) {
      console.error('Error loading scraping status:', error);
    }
  }

  private async loadMarketingInsights(): Promise<void> {
    if (!this.canViewAnalytics()) return;

    try {
      // Use dashboard metrics
      const dashboardData = await this.sentimentService.loadDashboardData().toPromise();
      if (!dashboardData) return;

      // Extract insights from dashboard data
      const insights: MarketingInsights = {
        campaignId: 'dashboard',
        period: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          to: new Date()
        },
        summary: {
          totalMentions: dashboardData.totalCampaigns,
          sentimentScore: dashboardData.overallSentiment,
          engagementRate: 0.05, // Default
          reachEstimate: dashboardData.totalUsers
        },
        trends: dashboardData.trendsData.map(trend => ({
          date: trend.date,
          sentiment: trend.sentiment,
          volume: trend.volume,
          engagement: 0.05 // Default engagement rate
        })),
        topInfluencers: [],
        recommendations: []
      };
      this._marketingInsights.set(insights);
    } catch (error) {
      console.error('Error loading marketing insights:', error);
    }
  }

  private async refreshScrapingStatus(): Promise<void> {
    try {
      // Refresh data and get updated status
      await this.sentimentService.loadDashboardData().toPromise();
      const status = this.sentimentService.scrapingStatus();
      this._scrapingStatus.set(status);
    } catch (error) {
      // Silent error for background refresh
      console.warn('Error refreshing scraping status:', error);
    }
  }

  // UI Action Methods
  async onCreateCampaign(): Promise<void> {
    try {
      // Navigate to campaign wizard
      await this.router.navigate(['/dashboard/campaigns/wizard']);
      this.showInfo('Navegando al creador de campañas...');
    } catch (error) {
      console.error('Error navigating to campaign wizard:', error);
      this.showError('Error al navegar al creador de campañas');
    }
  }

  async onRefreshData(): Promise<void> {
    await this.loadDashboardData();
    this.showSuccess('Datos actualizados');
  }

  getSentimentColor(score: number): string {
    if (score >= 0.6) return 'success';
    if (score >= 0.4) return 'accent';
    return 'warn';
  }

  getSentimentIcon(score: number): string {
    if (score >= 0.6) return 'sentiment_very_satisfied';
    if (score >= 0.4) return 'sentiment_neutral';
    return 'sentiment_very_dissatisfied';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'accent';
      case 'paused': return 'warn';
      default: return 'basic';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Notification methods
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  // Getters for template
  get welcomeMessage(): string {
    const user = this.currentUser();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    return `${greeting}, ${user?.displayName || 'Usuario'}`;
  }

  get userRoleDisplay(): string {
    const user = this.currentUser();
    if (!user) return '';

    const roleNames = {
      admin: 'Administrador',
      manager: 'Gerente',
      analyst: 'Analista',
      onlyView: 'Solo Lectura',
      client: 'Cliente'
    };

    return roleNames[user.role] || user.role;
  }
}
