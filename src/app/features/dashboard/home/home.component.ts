/**
 * ===== OPTIMIZED HOME DASHBOARD COMPONENT =====
 * Refactored to use DataManagerService unified approach
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
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

import { AuthService } from '../../../core/auth/services/auth.service';
import { DataManagerService } from '../../../core/services/data-manager.service';
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
  // ===== DEPENDENCY INJECTION =====
  public readonly authService = inject(AuthService);
  private readonly dataManager = inject(DataManagerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  // ===== COMPUTED STATE FROM DATA MANAGER (eliminates duplication) =====
  public readonly isLoading = this.dataManager.isLoading;
  public readonly campaigns = this.dataManager.campaigns;
  public readonly isOnline = this.dataManager.isOnline;
  public readonly metrics = this.dataManager.dashboardMetrics;
  
  // ===== COMPUTED DASHBOARD METRICS =====
  public readonly activeCampaigns = this.dataManager.activeCampaigns;
  public readonly totalTweets = this.dataManager.totalTweets;
  public readonly overallSentiment = this.dataManager.overallSentiment;

  // Additional computed values
  public readonly recentCampaigns = computed(() =>
    this.campaigns()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  public readonly sentimentColor = computed(() => {
    const sentiment = this.overallSentiment();
    if (sentiment > 0.3) return 'primary';
    if (sentiment > -0.3) return 'accent';
    return 'warn';
  });

  public readonly systemStatus = computed(() => {
    if (!this.isOnline()) return '📴 Offline Mode';
    if (this.isLoading()) return '⏳ Loading...';
    return '✅ Online';
  });

  // ===== ADDITIONAL COMPUTED METRICS FOR TEMPLATE =====
  
  public readonly avgSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) => acc + (campaign.stats?.averageSentiment || 0), 0);
    return sum / campaigns.length;
  });

  public readonly totalEngagement = computed(() => {
    const campaigns = this.campaigns();
    return campaigns.reduce((acc, campaign) => acc + (campaign.stats?.engagementRate || 0), 0);
  });

  public readonly positiveSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) =>
      acc + (campaign.stats?.sentimentDistribution?.positive || 0), 0);
    return sum / campaigns.length;
  });

  public readonly neutralSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) =>
      acc + (campaign.stats?.sentimentDistribution?.neutral || 0), 0);
    return sum / campaigns.length;
  });

  public readonly negativeSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (!campaigns || campaigns.length === 0) return 0;
    const sum = campaigns.reduce((acc, campaign) =>
      acc + (campaign.stats?.sentimentDistribution?.negative || 0), 0);
    return sum / campaigns.length;
  });

  // ===== PERMISSION-BASED UI =====
  public readonly currentUser = this.authService.currentUser;
  
  public readonly canManageCampaigns = computed(() => {
    const user = this.currentUser();
    return user && ['admin', 'manager', 'analyst'].includes(user.role);
  });

  public readonly canViewAnalytics = computed(() => {
    const user = this.currentUser();
    return user && ['admin', 'manager', 'analyst', 'onlyView'].includes(user.role);
  });

  public readonly canManageUsers = computed(() => {
    const user = this.currentUser();
    return user && ['admin', 'manager'].includes(user.role);
  });

  // ===== LIFECYCLE =====

  ngOnInit(): void {
    // Cargar datos iniciales
    this.loadDashboardData();
  }

  /**
   * Método público para cargar datos después del login exitoso
   */
  public initializeDashboardAfterAuth(): void {
    this.loadDashboardData();
  }

  // ===== PUBLIC METHODS (optimized) =====

  /**
   * Cargar todos los datos del dashboard
   */
  public loadDashboardData(): void {
    this.dataManager.loadDashboardData().subscribe({
      next: (data) => {
        console.log('✅ Dashboard data loaded:', data);
      },
      error: (error) => {
        console.error('❌ Error loading dashboard data:', error);
        this.showError('Error cargando datos del dashboard');
      }
    });
  }

  /**
   * Refrescar datos manualmente
   */
  public refreshDashboard(): void {
    this.dataManager.refresh();
  }

  /**
   * Refrescar datos (método alternativo para template)
   */
  public onRefreshData(): void {
    this.refreshDashboard();
  }

  /**
   * Crear nueva campaña
   */
  public async onCreateCampaign(): Promise<void> {
    if (!this.canManageCampaigns()) {
      this.showError('No tienes permisos para crear campañas');
      return;
    }

    try {
      await this.router.navigate(['/dashboard/campaigns/wizard']);
    } catch (error) {
      console.error('Error navegando a wizard:', error);
      this.showError('Error al navegar');
    }
  }

  /**
   * Ver todas las campañas
   */
  public async onViewAllCampaigns(): Promise<void> {
    try {
      await this.router.navigate(['/dashboard/campaigns']);
    } catch (error) {
      console.error('Error navegando a campañas:', error);
      this.showError('Error al navegar');
    }
  }

  /**
   * Ver analytics
   */
  public async onViewAnalytics(): Promise<void> {
    if (!this.canViewAnalytics()) {
      this.showError('No tienes permisos para ver analytics');
      return;
    }

    try {
      await this.router.navigate(['/dashboard/analytics']);
    } catch (error) {
      console.error('Error navegando a analytics:', error);
      this.showError('Error al navegar');
    }
  }

  /**
   * Ver configuración de usuario
   */
  public async onUserSettings(): Promise<void> {
    try {
      await this.router.navigate(['/dashboard/profile']);
    } catch (error) {
      console.error('Error navegando a perfil:', error);
      this.showError('Error al navegar');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Obtener clase CSS para sentiment score
   */
  public getSentimentClass(score: number): string {
    if (score > 0.3) return 'positive';
    if (score > -0.3) return 'neutral';
    return 'negative';
  }

  /**
   * Obtener color para sentiment score
   */
  public getSentimentColor(score: number): string {
    if (score > 0.3) return '#4caf50'; // Green
    if (score > -0.3) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  /**
   * Obtener icono para sentiment score
   */
  public getSentimentIcon(score: number): string {
    if (score > 0.3) return 'sentiment_very_satisfied';
    if (score > -0.3) return 'sentiment_neutral';
    return 'sentiment_very_dissatisfied';
  }

  /**
   * Formatear números para display
   */
  public formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Obtener tiempo relativo
   */
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

  // ===== TEMPLATE GETTERS =====

  public get welcomeMessage(): string {
    const user = this.currentUser();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    return `${greeting}, ${user?.displayName || 'Usuario'}`;
  }

  public get userRoleDisplay(): string {
    const user = this.currentUser();
    if (!user) return '';

    const roleNames = {
      admin: 'Administrador',
      manager: 'Gerente',
      analyst: 'Analista',
      onlyView: 'Solo Lectura',
      client: 'Cliente'
    };

    return roleNames[user.role as keyof typeof roleNames] || user.role;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Mostrar mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Mostrar mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
