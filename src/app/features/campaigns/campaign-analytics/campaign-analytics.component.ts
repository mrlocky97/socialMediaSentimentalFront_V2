import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { CampaignsStore } from '../../../core/state/campaigns.store';
import { TweetsStore } from '../../../core/state/tweets.store';
import { Campaign } from '../../../core/state/app.state';

@Component({
  selector: 'app-campaign-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './campaign-analytics.component.html',
  styleUrls: ['./campaign-analytics.component.css'],
})
export class CampaignAnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Inject stores instead of facade
  private campaignsStore = inject(CampaignsStore);
  private tweetsStore = inject(TweetsStore);

  private campaignId = signal<string>('');

  // Computed properties consuming signals from stores
  readonly isLoading = computed(() => this.campaignsStore.loading());
  readonly currentCampaign = computed(() => this.campaignsStore.selected());
  readonly error = computed(() => this.campaignsStore.error());
  
  // Tweet analytics from tweets store
  readonly campaignTweets = computed(() => this.tweetsStore.items());
  readonly tweetMetrics = computed(() => this.tweetsStore.sentimentCounts());
  readonly averageSentiment = computed(() => this.tweetsStore.averageSentiment());
  readonly topHashtags = computed(() => this.tweetsStore.topHashtags());
  readonly topMentions = computed(() => this.tweetsStore.topMentions());

  constructor() {
    // Effect to load tweets when campaign changes
    effect(() => {
      const campaign = this.currentCampaign();
      if (campaign) {
        // Load tweets for this campaign
        this.tweetsStore.loadTweets({ campaignId: campaign.id });
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.campaignId.set(id);
      // Action: Load campaign from store
      this.campaignsStore.loadCampaign(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/campaigns', this.campaignId()]);
  }

  // Action methods - emit actions to stores
  refreshData(): void {
    const campaignId = this.campaignId();
    if (campaignId) {
      this.campaignsStore.loadCampaign(campaignId);
      this.tweetsStore.loadTweets({ campaignId });
    }
  }

  clearError(): void {
    this.campaignsStore.clearError();
  }

  // Utility methods for template (pure functions)
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      inactive: 'Inactive',
    };
    return statusMap[status] || status;
  }

  getTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      hashtag: 'Hashtag Monitoring',
      keyword: 'Keyword Tracking',
      user: 'User Monitoring',
      mention: 'Mention Tracking',
    };
    return typeMap[type] || type;
  }

  getSentimentLabel(score: number): string {
    if (score > 0.1) return 'Positive';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  }

  getSentimentColor(score: number): string {
    if (score > 0.1) return '#4caf50';
    if (score < -0.1) return '#f44336';
    return '#ff9800';
  }
}
