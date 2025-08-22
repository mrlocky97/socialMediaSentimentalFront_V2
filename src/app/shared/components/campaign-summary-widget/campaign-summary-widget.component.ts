import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CampaignsStore } from '../../../core/state/campaigns.store';

/**
 * Campaign Summary Widget - Presentational Component
 * 
 * This component demonstrates the new architecture:
 * - Consumes signals from CampaignsStore (computed)
 * - Emits actions to the store (method calls)
 * - No direct signal mutation
 * - Pure presentation logic
 */
@Component({
  selector: 'app-campaign-summary-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './campaign-summary-widget.component.html',
  styleUrls: ['./campaign-summary-widget.component.css'],
})
export class CampaignSummaryWidgetComponent {
  // Inject store - no facade layer needed
  private campaignsStore = inject(CampaignsStore);

  // Computed signals - consuming store state (readonly)
  readonly isLoading = computed(() => this.campaignsStore.loading());
  readonly error = computed(() => this.campaignsStore.error());
  readonly totalCount = computed(() => this.campaignsStore.totalCount());
  readonly statusCounts = computed(() => this.campaignsStore.statusCounts());
  readonly recentCampaigns = computed(() => this.campaignsStore.recentCampaigns().slice(0, 5));
  readonly summary = computed(() => this.campaignsStore.summary());

  // Action methods - emitting actions to store
  onRefresh(): void {
    this.campaignsStore.refresh();
  }

  onRetry(): void {
    this.campaignsStore.clearError();
    this.campaignsStore.loadCampaigns();
  }

  onCampaignSelect(campaign: any): void {
    this.campaignsStore.selectCampaign(campaign);
    // Could also navigate or emit event
  }

  onViewAll(): void {
    // Navigate to campaigns list or emit event
    // This is where you'd use Router if needed
  }

  // Pure utility methods for template
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'paused': 'Paused', 
      'completed': 'Completed',
      'inactive': 'Inactive'
    };
    return statusMap[status] || status;
  }

  getTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      'hashtag': 'Hashtag',
      'keyword': 'Keyword',
      'user': 'User',
      'mention': 'Mention'
    };
    return typeMap[type] || type;
  }
}
