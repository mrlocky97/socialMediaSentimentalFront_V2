import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CampaignFacade } from '../../../core/facades/campaign.facade';

@Component({
  selector: 'app-campaign-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <div class="header-content">
          <div class="title-section">
            <button mat-icon-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1>Campaign Analytics</h1>
          </div>
          
          <div class="actions">
            <button mat-button (click)="exportData()">
              <mat-icon>download</mat-icon>
              Export Data
            </button>
            <button mat-button (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>
        </div>
      </div>

      @if (campaignFacade.loading$()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      }

      @if (selectedCampaign()) {
        <div class="campaign-info">
          <h2>{{ selectedCampaign()!.name }}</h2>
          <p>{{ selectedCampaign()!.description }}</p>
        </div>

        <mat-tab-group class="analytics-tabs">
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="metrics-grid">
                <!-- Key Metrics -->
                @if (selectedCampaign()!.stats) {
                  <mat-card class="metric-card">
                    <mat-card-content>
                      <div class="metric-item">
                        <div class="metric-icon">
                          <mat-icon>bar_chart</mat-icon>
                        </div>
                        <div class="metric-info">
                          <div class="metric-value">{{ selectedCampaign()!.stats!.totalTweets | number }}</div>
                          <div class="metric-label">Total Tweets</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="metric-card">
                    <mat-card-content>
                      <div class="metric-item">
                        <div class="metric-icon">
                          <mat-icon>thumb_up</mat-icon>
                        </div>
                        <div class="metric-info">
                          <div class="metric-value">{{ selectedCampaign()!.stats!.totalEngagement | number }}</div>
                          <div class="metric-label">Total Engagement</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="metric-card">
                    <mat-card-content>
                      <div class="metric-item">
                        <div class="metric-icon">
                          <mat-icon>sentiment_satisfied</mat-icon>
                        </div>
                        <div class="metric-info">
                          <div class="metric-value">{{ selectedCampaign()!.stats!.avgSentiment | number:'1.2-2' }}</div>
                          <div class="metric-label">Avg Sentiment</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Sentiment Distribution -->
                  <mat-card class="chart-card full-width">
                    <mat-card-header>
                      <mat-card-title>Sentiment Distribution</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="sentiment-chart">
                        <div class="sentiment-bar">
                          <div class="bar-section positive" 
                               [style.width.%]="getSentimentPercentage('positive')">
                            <span class="bar-label">Positive ({{ selectedCampaign()!.stats!.sentimentDistribution.positive }})</span>
                          </div>
                          <div class="bar-section neutral" 
                               [style.width.%]="getSentimentPercentage('neutral')">
                            <span class="bar-label">Neutral ({{ selectedCampaign()!.stats!.sentimentDistribution.neutral }})</span>
                          </div>
                          <div class="bar-section negative" 
                               [style.width.%]="getSentimentPercentage('negative')">
                            <span class="bar-label">Negative ({{ selectedCampaign()!.stats!.sentimentDistribution.negative }})</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                } @else {
                  <mat-card class="no-data-card full-width">
                    <mat-card-content>
                      <div class="no-data">
                        <mat-icon>analytics</mat-icon>
                        <h3>No Analytics Data Available</h3>
                        <p>Start the campaign to begin collecting analytics data.</p>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Hashtags">
            <div class="tab-content">
              @if (selectedCampaign()!.stats?.topHashtags?.length) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Top Hashtags</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="hashtag-list">
                      @for (hashtag of selectedCampaign()!.stats!.topHashtags; track hashtag.tag) {
                        <div class="hashtag-item">
                          <span class="hashtag-tag">#{{ hashtag.tag }}</span>
                          <span class="hashtag-count">{{ hashtag.count | number }}</span>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              } @else {
                <div class="no-data">
                  <mat-icon>tag</mat-icon>
                  <h3>No Hashtag Data</h3>
                  <p>Hashtag analytics will appear here once data is collected.</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Mentions">
            <div class="tab-content">
              @if (selectedCampaign()!.stats?.topMentions?.length) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Top Mentions</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="mention-list">
                      @for (mention of selectedCampaign()!.stats!.topMentions; track mention.mention) {
                        <div class="mention-item">
                          <span class="mention-tag">{{ '@' + mention.mention }}</span>
                          <span class="mention-count">{{ mention.count | number }}</span>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              } @else {
                <div class="no-data">
                  <mat-icon>alternate_email</mat-icon>
                  <h3>No Mention Data</h3>
                  <p>Mention analytics will appear here once data is collected.</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Reports">
            <div class="tab-content">
              <div class="reports-section">
                <h3>Available Reports</h3>
                <div class="reports-grid">
                  <mat-card class="report-card">
                    <mat-card-content>
                      <mat-icon>timeline</mat-icon>
                      <h4>Sentiment Trend Report</h4>
                      <p>Track sentiment changes over time</p>
                      <button mat-button color="primary">Generate</button>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="report-card">
                    <mat-card-content>
                      <mat-icon>people</mat-icon>
                      <h4>Influencer Report</h4>
                      <p>Identify key influencers in your campaign</p>
                      <button mat-button color="primary">Generate</button>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="report-card">
                    <mat-card-content>
                      <mat-icon>insights</mat-icon>
                      <h4>Engagement Analysis</h4>
                      <p>Detailed engagement metrics and patterns</p>
                      <button mat-button color="primary">Generate</button>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .analytics-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .campaign-info {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .campaign-info h2 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .campaign-info p {
      margin: 0;
      color: #666;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .metric-card {
      height: fit-content;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .metric-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 500;
      color: #1976d2;
      line-height: 1;
    }

    .metric-label {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }

    .chart-card {
      min-height: 200px;
    }

    .sentiment-chart {
      padding: 20px 0;
    }

    .sentiment-bar {
      display: flex;
      height: 40px;
      border-radius: 20px;
      overflow: hidden;
      background-color: #f5f5f5;
    }

    .bar-section {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .bar-section.positive {
      background-color: #4caf50;
    }

    .bar-section.neutral {
      background-color: #ff9800;
    }

    .bar-section.negative {
      background-color: #f44336;
    }

    .hashtag-list,
    .mention-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .hashtag-item,
    .mention-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .hashtag-tag,
    .mention-tag {
      font-weight: 500;
      color: #1976d2;
    }

    .hashtag-count,
    .mention-count {
      font-weight: 500;
      color: #666;
    }

    .reports-section h3 {
      margin-bottom: 24px;
      color: #424242;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .report-card {
      text-align: center;
    }

    .report-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .report-card h4 {
      margin: 0 0 8px 0;
      color: #424242;
    }

    .report-card p {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }

    .no-data {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .no-data h3 {
      margin: 16px 0 8px;
      color: #666;
    }

    .no-data p {
      margin: 0;
      color: #999;
    }

    .no-data-card {
      grid-column: 1 / -1;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .actions {
        justify-content: stretch;
      }

      .actions button {
        flex: 1;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .sentiment-bar {
        flex-direction: column;
        height: auto;
      }

      .bar-section {
        height: 40px;
        justify-content: space-between;
        padding: 0 16px;
      }
    }
  `]
})
export class CampaignAnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  campaignFacade = inject(CampaignFacade);
  selectedCampaign = this.campaignFacade.selectedCampaign$;
  
  private campaignId = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.campaignId.set(id);
      this.campaignFacade.selectCampaign(id).subscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/campaigns', this.campaignId()]);
  }

  exportData(): void {
    // TODO: Implement data export functionality
    console.log('Export data for campaign:', this.campaignId());
  }

  refreshData(): void {
    this.campaignFacade.selectCampaign(this.campaignId()).subscribe();
  }

  getSentimentPercentage(type: 'positive' | 'negative' | 'neutral'): number {
    const campaign = this.selectedCampaign();
    if (!campaign?.stats?.sentimentDistribution) return 0;
    
    const dist = campaign.stats.sentimentDistribution;
    const total = dist.positive + dist.negative + dist.neutral;
    
    if (total === 0) return 0;
    
    return (dist[type] / total) * 100;
  }
}
