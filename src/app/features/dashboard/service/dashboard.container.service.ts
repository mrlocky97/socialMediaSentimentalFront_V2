import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { DataManagerService } from '../../../core/services/data-manager.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly dataManager = inject(DataManagerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Estado expuesto
  public readonly isLoading = this.dataManager.isLoading;
  public readonly campaigns = this.dataManager.campaigns;
  public readonly isOnline = this.dataManager.isOnline;
  public readonly metrics = this.dataManager.dashboardMetrics;
  public readonly activeCampaigns = this.dataManager.activeCampaigns;
  public readonly totalTweets = this.dataManager.totalTweets;
  public readonly overallSentiment = this.dataManager.overallSentiment;

  // Métodos de servicio de datos
  loadDashboardData(): Observable<any> {
    return this.dataManager.loadDashboardData();
  }

  refreshData(): void {
    this.dataManager.refresh();
  }

  // Notificaciones
  showNotification(message: string, type: 'success' | 'error' = 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'success' ? 3000 : 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  // Navegación
  async navigateTo(route: string): Promise<boolean> {
    try {
      return await this.router.navigate([route]);
    } catch (error) {
      console.error(`Error navigating to ${route}:`, error);
      this.showNotification('Error de navegación');
      return false;
    }
  }

  // Sentiment metrics
  getSentimentMetrics() {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return null;

    return {
      avgSentiment:
        campaigns.reduce((acc, c) => acc + (c.stats?.averageSentiment || 0), 0) / campaigns.length,
      totalEngagement: campaigns.reduce((acc, c) => acc + (c.stats?.engagementRate || 0), 0),
      positive:
        campaigns.reduce((acc, c) => acc + (c.stats?.sentimentDistribution?.positive || 0), 0) /
        campaigns.length,
      neutral:
        campaigns.reduce((acc, c) => acc + (c.stats?.sentimentDistribution?.neutral || 0), 0) /
        campaigns.length,
      negative:
        campaigns.reduce((acc, c) => acc + (c.stats?.sentimentDistribution?.negative || 0), 0) /
        campaigns.length,
    };
  }
}
