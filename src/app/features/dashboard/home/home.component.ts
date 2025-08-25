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
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

import { AuthService } from '../../../core/auth/services/auth.service';

import { CampaignSummaryWidgetComponent } from '../../campaigns/campaign-summary-widget/campaign-summary-widget.component';
import { PendingTweetWidgetComponent } from '../../pending-tweet-widget/pending-tweet-widget.component';
import { DashboardService } from '../service/dashboard.container.service';
import { HomeService } from './service/home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
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
    PendingTweetWidgetComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // Servicios
  public readonly authService = inject(AuthService);
  public readonly dashboardService = inject(DashboardService);
  public readonly homeService = inject(HomeService);
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

  // Métodos de navegación mejorados para campañas
  public async navigateToCreateCampaign(): Promise<void> {
  await this.router.navigate(['/dashboard/campaigns/create']);
  }

  public async navigateToCampaigns(): Promise<void> {
  await this.router.navigate(['/dashboard/campaigns']);
  }

  public async navigateToSimpleForm(): Promise<void> {
  await this.router.navigate(['/dashboard/campaigns/create-simple']);
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
