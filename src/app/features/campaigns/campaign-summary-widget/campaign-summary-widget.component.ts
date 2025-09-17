/* =====================================
   CAMPAIGN SUMMARY WIDGET COMPONENT
   Dashboard widget showing campaign overview with real data
   ===================================== */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject } from 'rxjs';

import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';

interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  completedCampaigns: number;
  totalTweets: number;
  totalHashtags: number;
  totalKeywords: number;
  averageSentiment: number;
  // Métricas ficticias para presupuesto y performance
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalConversions: number;
  averageCTR: number;
  averageROAS: number;
}

@Component({
  selector: 'app-campaign-summary-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './campaign-summary-widget.component.html',
  styleUrls: ['./campaign-summary-widget.component.css'],
})
export class CampaignSummaryWidgetComponent implements OnInit, OnDestroy {
  private readonly campaignFacade = inject(CampaignFacade);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    console.log('Campaign Widget - Constructor called');
  }

  // Signals para el estado del componente
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // NgRx Observables - reemplazando computed properties de CampaignsStore
  campaigns$ = this.campaignFacade.campaigns$;
  loading$ = this.campaignFacade.loading$;
  error$ = this.campaignFacade.error$;
  campaignSummary$ = this.campaignFacade.campaignSummary$;
  statusCounts$ = this.campaignFacade.statusCounts$;
  recentCampaigns$ = this.campaignFacade.recentCampaigns$;
  
  // Computed properties for template compatibility
  componentLoading = computed(() => false); // Will use loading$ | async in template
  componentError = computed(() => null as string | null); // Will use error$ | async in template  
  summary = computed(() => ({
    totalCampaigns: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    completedCampaigns: 0,
    totalTweets: 0,
    totalHashtags: 0,
    totalKeywords: 0,
    averageSentiment: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalConversions: 0,
    averageCTR: 0,
    averageROAS: 0,
  })); // Will use campaignSummary$ | async in template
  recentCampaigns = computed(() => [] as Campaign[]); // Will use recentCampaigns$ | async in template

  // Effects simplificados para NgRx
  private readonly errorEffect = effect(() => {
    // Los errores se manejarán directamente en template con async pipe
  });

  private readonly loadingEffect = effect(() => {
    // El loading se manejará directamente en template con async pipe
  });

  ngOnInit(): void {
    console.log('Campaign Widget - NgOnInit called');
    this.loadCampaigns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCampaigns(): void {
    console.log('Campaign Widget - Loading campaigns via NgRx...');
    this.campaignFacade.loadCampaigns();
  }

  getBudgetPercentage(): number {
    // Con NgRx usaremos async pipe en template para campaignSummary$
    return 75; // Placeholder hasta actualizar template
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'success',
      paused: 'warning',
      completed: 'primary',
      cancelled: 'danger',
      inactive: 'secondary',
      draft: 'secondary',
      scheduled: 'info',
    };
    return colors[status] || 'secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  trackByCampaignId(index: number, campaign: Campaign): string {
    return campaign.id;
  }

  // Métodos para refrescar datos con NgRx
  onRefresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.campaignFacade.loadCampaigns();
  }

  onRetry(): void {
    this.error.set(null);
    this.loadCampaigns();
  }
}
