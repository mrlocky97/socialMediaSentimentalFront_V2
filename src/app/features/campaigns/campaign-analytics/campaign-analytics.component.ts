import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { CampaignFacade } from '../../../core/facades/campaign.facade';
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

  campaignFacade = inject(CampaignFacade);

  private campaignId = signal<string>('');

  // Computed properties for template
  isLoading = computed(() => false); // TODO: Connect to actual loading state
  currentCampaign = signal<Campaign | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.campaignId.set(id);
      this.campaignFacade.selectCampaign(id).subscribe((campaign) => {
        this.currentCampaign.set(campaign);
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/campaigns', this.campaignId()]);
  }

  // Utility methods for template
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      draft: 'Draft',
      cancelled: 'Cancelled',
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
}
