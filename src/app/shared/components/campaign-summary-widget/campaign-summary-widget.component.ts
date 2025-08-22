import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
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
  template: `
    <mat-card class="summary-widget">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>campaign</mat-icon>
          Campaign Overview
        </mat-card-title>
        <button 
          mat-icon-button 
          (click)="onRefresh()" 
          [disabled]="isLoading()"
          class="refresh-button">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content>
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading campaigns...</p>
          </div>
        } @else if (error()) {
          <div class="error-container">
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="onRetry()">
              Retry
            </button>
          </div>
        } @else {
          <div class="metrics-grid">
            <!-- Total Campaigns -->
            <div class="metric-card">
              <div class="metric-value">{{ totalCount() }}</div>
              <div class="metric-label">Total Campaigns</div>
            </div>

            <!-- Active Campaigns -->
            <div class="metric-card active">
              <div class="metric-value">{{ statusCounts().active }}</div>
              <div class="metric-label">Active</div>
            </div>

            <!-- Paused Campaigns -->
            <div class="metric-card paused">
              <div class="metric-value">{{ statusCounts().paused }}</div>
              <div class="metric-label">Paused</div>
            </div>

            <!-- Completed Campaigns -->
            <div class="metric-card completed">
              <div class="metric-value">{{ statusCounts().completed }}</div>
              <div class="metric-label">Completed</div>
            </div>
          </div>

          <!-- Recent Campaigns -->
          @if (recentCampaigns().length > 0) {
            <div class="recent-section">
              <h3>Recent Campaigns</h3>
              <div class="recent-list">
                @for (campaign of recentCampaigns(); track campaign.id) {
                  <div class="recent-item" (click)="onCampaignSelect(campaign)">
                    <div class="campaign-info">
                      <span class="campaign-name">{{ campaign.name }}</span>
                      <span class="campaign-type">{{ getTypeText(campaign.type) }}</span>
                    </div>
                    <mat-chip 
                      [class]="'status-' + campaign.status"
                      class="status-chip">
                      {{ getStatusText(campaign.status) }}
                    </mat-chip>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Summary Stats -->
          @if (summary()) {
            <div class="summary-stats">
              <div class="stat">
                <mat-icon>tag</mat-icon>
                <span>{{ summary()!.totalHashtags }} Hashtags</span>
              </div>
              <div class="stat">
                <mat-icon>search</mat-icon>
                <span>{{ summary()!.totalKeywords }} Keywords</span>
              </div>
              <div class="stat">
                <mat-icon>article</mat-icon>
                <span>{{ summary()!.totalTweets }} Tweets</span>
              </div>
            </div>
          }
        }
      </mat-card-content>

      @if (!isLoading() && !error()) {
        <mat-card-actions align="end">
          <button mat-button color="primary" (click)="onViewAll()">
            View All Campaigns
          </button>
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: [`
    .summary-widget {
      margin: 16px 0;
    }

    .refresh-button {
      margin-left: auto;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      text-align: center;
    }

    .error-container mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      margin-bottom: 8px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      text-align: center;
      padding: 16px;
      border-radius: 8px;
      background: #f5f5f5;
      transition: transform 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-card.active {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .metric-card.paused {
      background: #fff3e0;
      color: #ef6c00;
    }

    .metric-card.completed {
      background: #e3f2fd;
      color: #1976d2;
    }

    .metric-value {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .recent-section h3 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 1rem;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-radius: 6px;
      background: #fafafa;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .recent-item:hover {
      background: #e0e0e0;
    }

    .campaign-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .campaign-name {
      font-weight: 500;
      color: #333;
    }

    .campaign-type {
      font-size: 0.875rem;
      color: #666;
    }

    .status-chip {
      font-size: 0.75rem;
    }

    .status-chip.status-active {
      background: #4caf50;
      color: white;
    }

    .status-chip.status-paused {
      background: #ff9800;
      color: white;
    }

    .status-chip.status-completed {
      background: #2196f3;
      color: white;
    }

    .summary-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: #666;
    }

    .stat mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
  `]
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
