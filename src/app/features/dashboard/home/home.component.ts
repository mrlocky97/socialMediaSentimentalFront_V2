import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

import { AuthService } from '../../../core/auth/services/auth.service';
import { CampaignsStore } from '../../../core/state/campaigns.store';

import { CampaignSummaryWidgetComponent } from '../../campaigns/campaign-summary-widget/campaign-summary-widget.component';
import { DashboardFeatureService } from '../service/dashboard.feature.service';
import { HomeService } from './service/home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatGridListModule,
    MatDividerModule,
    MatTooltipModule,
    CampaignSummaryWidgetComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // Servicios
  public readonly authService = inject(AuthService);
  public readonly dashboardService = inject(DashboardFeatureService);
  public readonly homeService = inject(HomeService);
  public readonly campaignsStore = inject(CampaignsStore);
  private readonly router = inject(Router);

  // Estado computado
  public readonly recentCampaigns = computed(() =>
    this.dashboardService
      .campaigns()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  public readonly sentimentMetrics = computed(() => this.dashboardService.getSentimentMetrics());

  public readonly sentimentColor = computed(() => {
    const sentiment = this.dashboardService.overallSentiment();
    if (sentiment > 0.3) return 'primary';
    if (sentiment > -0.3) return 'accent';
    return 'warn';
  });

  public readonly systemStatus = computed(() => {
    if (!this.dashboardService.isOnline()) return '📴 Offline Mode';
    if (this.dashboardService.isLoading()) return '⏳ Loading...';
    return '✅ Online';
  });

  // Permisos
  public readonly currentUser = this.authService.currentUser;
  public readonly canManageCampaigns = computed(() =>
    ['admin', 'manager', 'analyst'].includes(this.currentUser()?.role || '')
  );

  public readonly canViewAnalytics = computed(() =>
    ['admin', 'manager', 'analyst', 'onlyView'].includes(this.currentUser()?.role || '')
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Métodos de acción
  public async handleNavigation(route: string): Promise<void> {
    await this.dashboardService.navigateTo(route);
  }

  public loadDashboardData(): void {
    this.dashboardService.loadDashboardData().subscribe({
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.dashboardService.showNotification('Error cargando datos del dashboard');
      },
    });
  }

  // Métodos de template
  public getSentimentClass(score: number): string {
    if (score > 0.3) return 'positive';
    if (score > -0.3) return 'neutral';
    return 'negative';
  }

  // Métodos para Analytics Preview Widget usando datos reales de campaignsStore
  public getTotalTweetsFromCampaigns(): number {
    const campaigns = this.campaignsStore.list();
    return campaigns.reduce(
      (total: number, campaign: any) => total + (campaign.totalTweets || 0),
      0
    );
  }

  public getAverageSentiment(): number {
    const campaigns = this.campaignsStore.list();
    if (campaigns.length === 0) return 0;

    const totalSentiment = campaigns.reduce(
      (sum: number, campaign: any) => sum + (campaign.averageSentiment || 0),
      0
    );
    return totalSentiment / campaigns.length;
  }

  public getActiveCampaignsCount(): number {
    const campaigns = this.campaignsStore.list();
    return campaigns.filter((campaign: any) => campaign.status === 'active').length;
  }

  public getEstimatedEngagement(): number {
    const campaigns = this.campaignsStore.list();
    return campaigns.reduce((total: number, campaign: any) => {
      // Estimación basada en tweets y engagement promedio por tweet
      const tweetCount = campaign.totalTweets || 0;
      const engagementRate = 0.03; // 3% engagement rate promedio
      return total + tweetCount * engagementRate * 10; // Factor multiplicativo para visualización
    }, 0);
  }

  // Métodos para Sentiment Analysis Widget
  public getSentimentLabel(sentiment: number): string {
    if (sentiment > 0.3) return 'Positivo';
    if (sentiment > -0.3) return 'Neutral';
    return 'Negativo';
  }

  public getPositiveSentimentCount(): number {
    const campaigns = this.campaignsStore.list();
    return campaigns.filter((campaign: any) => (campaign.averageSentiment || 0) > 0.3).length;
  }

  public getNeutralSentimentCount(): number {
    const campaigns = this.campaignsStore.list();
    return campaigns.filter((campaign: any) => {
      const sentiment = campaign.averageSentiment || 0;
      return sentiment >= -0.3 && sentiment <= 0.3;
    }).length;
  }

  public getNegativeSentimentCount(): number {
    const campaigns = this.campaignsStore.list();
    return campaigns.filter((campaign: any) => (campaign.averageSentiment || 0) < -0.3).length;
  }

  public getPositiveSentimentPercentage(): number {
    const campaigns = this.campaignsStore.list();
    if (campaigns.length === 0) return 0;
    return this.getPositiveSentimentCount() / campaigns.length;
  }

  public getNeutralSentimentPercentage(): number {
    const campaigns = this.campaignsStore.list();
    if (campaigns.length === 0) return 0;
    return this.getNeutralSentimentCount() / campaigns.length;
  }

  public getNegativeSentimentPercentage(): number {
    const campaigns = this.campaignsStore.list();
    if (campaigns.length === 0) return 0;
    return this.getNegativeSentimentCount() / campaigns.length;
  }

  public getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Ahora';
    if (hours === 1) return 'Hace 1 hora';
    if (hours < 24) return `Hace ${hours} horas`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  }
}
