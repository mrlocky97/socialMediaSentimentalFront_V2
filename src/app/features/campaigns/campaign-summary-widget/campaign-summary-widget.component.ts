/* =====================================
   CAMPAIGN SUMMARY WIDGET COMPONENT
   Dashboard widget showing campaign overview
   ===================================== */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';

import { CampaignService } from '../../../core/services/campaign.service';
import { Campaign } from '../../../core/state/app.state';

interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
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
    MatChipsModule
  ],
  templateUrl: './campaign-summary-widget.component.html',
  styleUrls: ['./campaign-summary-widget.component.css']
})
export class CampaignSummaryWidgetComponent implements OnInit, OnDestroy {
  private readonly campaignService = inject(CampaignService);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state
  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(true);

  // Computed properties
  summary = computed<CampaignSummary>(() => {
  const allCampaigns = this.campaigns() || [];

  if (!allCampaigns || allCampaigns.length === 0) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalBudget: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalConversions: 0,
        averageCTR: 0,
        averageROAS: 0
      };
    }

    const activeCampaigns = allCampaigns.filter(c => c.status === 'active');
    
    // Using simplified calculations since the core Campaign model doesn't have budget/metrics
    const totalBudget = allCampaigns.length * 1000; // Mock budget
    const totalSpent = allCampaigns.length * 750; // Mock spent  
    const totalImpressions = allCampaigns.length * 1000; // Mock impressions
    const totalConversions = allCampaigns.length * 50; // Mock conversions

    const avgCTR = allCampaigns.length > 0 ? 2.5 : 0; // Mock average CTR
    const avgROAS = allCampaigns.length > 0 ? 3.2 : 0; // Mock average ROAS

    return {
      totalCampaigns: allCampaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalBudget,
      totalSpent,
      totalImpressions,
      totalConversions,
      averageCTR: avgCTR,
      averageROAS: avgROAS
    };
  });

  recentCampaigns = computed<Campaign[]>(() => {
    const list = this.campaigns() || [];
    return list
      .slice() // copy to avoid mutating original
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.loadCampaignSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCampaignSummary(): void {
    this.loading.set(true);

    // Load campaigns using the consolidated service
    this.campaignService.getAll({}, 1, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response && response.success && response.data) {
          // Some backends return the list directly or inside `data.data`.
          const list = (response.data as any).data ?? (response.data as any).campaigns ?? response.data;
          this.campaigns.set(Array.isArray(list) ? list : []);
        } else {
          this.campaigns.set([]);
        }
        this.loading.set(false);
      });
  }

  getBudgetPercentage(): number {
    const summary = this.summary();
    if (summary.totalBudget === 0) return 0;
    return Math.round((summary.totalSpent / summary.totalBudget) * 100);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'active': 'success',
      'paused': 'warning',
      'completed': 'primary',
      'cancelled': 'danger',
      'draft': 'secondary',
      'scheduled': 'info'
    };
    return colors[status] || 'secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
}
