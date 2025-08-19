import { Component, signal, computed, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

export interface CampaignStatus {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  tweetsCollected: number;
  sentimentScore: number;
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface ScrapingMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalTweets: number;
  averageSentiment: number;
}

@Component({
  selector: 'app-scraping-monitor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule
  ],
  template: `
    <div class="scraping-monitor-container">
      <!-- Header -->
      <div class="monitor-header">
        <h1>
          <mat-icon>monitor</mat-icon>
          Scraping Monitor
        </h1>
        <p>Real-time monitoring of your data collection campaigns</p>
      </div>

      <!-- Metrics Overview -->
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon total">campaign</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ metrics().totalCampaigns }}</span>
                <span class="metric-label">Total Campaigns</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon active">play_circle</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ metrics().activeCampaigns }}</span>
                <span class="metric-label">Active Now</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon tweets">trending_up</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ formatNumber(metrics().totalTweets) }}</span>
                <span class="metric-label">Tweets Collected</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon sentiment">sentiment_satisfied</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ formatSentiment(metrics().averageSentiment) }}</span>
                <span class="metric-label">Avg Sentiment</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Active Campaigns -->
      <mat-card class="campaigns-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>list</mat-icon>
            Active Campaigns
          </mat-card-title>
          <div class="header-actions">
            <button mat-icon-button [disabled]="isRefreshing()" (click)="refreshData()">
              <mat-icon [class.spinning]="isRefreshing()">refresh</mat-icon>
            </button>
            <button mat-raised-button color="primary" (click)="startNewCampaign()">
              <mat-icon>add</mat-icon>
              New Campaign
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          @if (campaigns().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <h3>No Active Campaigns</h3>
              <p>Start a new campaign to begin monitoring social media data</p>
              <button mat-raised-button color="primary" (click)="startNewCampaign()">
                Create Campaign
              </button>
            </div>
          } @else {
            <div class="campaigns-list">
              @for (campaign of campaigns(); track campaign.id) {
                <div class="campaign-item">
                  <div class="campaign-info">
                    <div class="campaign-header">
                      <h3>{{ campaign.name }}</h3>
                      <mat-chip [class]="'status-' + campaign.status">
                        {{ getStatusLabel(campaign.status) }}
                      </mat-chip>
                    </div>
                    
                    <div class="campaign-details">
                      <span class="detail-item">
                        <mat-icon>schedule</mat-icon>
                        Started: {{ formatTime(campaign.startTime) }}
                      </span>
                      
                      @if (campaign.estimatedCompletion) {
                        <span class="detail-item">
                          <mat-icon>timer</mat-icon>
                          ETA: {{ formatTime(campaign.estimatedCompletion) }}
                        </span>
                      }
                      
                      <span class="detail-item">
                        <mat-icon>trending_up</mat-icon>
                        {{ formatNumber(campaign.tweetsCollected) }} tweets
                      </span>
                      
                      <span class="detail-item">
                        <mat-icon>sentiment_satisfied</mat-icon>
                        {{ formatSentiment(campaign.sentimentScore) }}
                      </span>
                    </div>
                  </div>

                  <div class="campaign-progress">
                    <div class="progress-info">
                      <span class="progress-label">Progress</span>
                      <span class="progress-value">{{ campaign.progress }}%</span>
                    </div>
                    <mat-progress-bar 
                      [value]="campaign.progress" 
                      [color]="getProgressColor(campaign.status)"
                      mode="determinate">
                    </mat-progress-bar>
                  </div>

                  <div class="campaign-actions">
                    @if (campaign.status === 'running') {
                      <button mat-icon-button color="warn" (click)="pauseCampaign(campaign.id)" title="Pause">
                        <mat-icon>pause</mat-icon>
                      </button>
                    } @else if (campaign.status === 'paused') {
                      <button mat-icon-button color="primary" (click)="resumeCampaign(campaign.id)" title="Resume">
                        <mat-icon>play_arrow</mat-icon>
                      </button>
                    }
                    
                    <button mat-icon-button (click)="viewCampaignDetails(campaign.id)" title="View Details">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    
                    <button mat-icon-button color="warn" (click)="stopCampaign(campaign.id)" title="Stop">
                      <mat-icon>stop</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Real-time Updates -->
      @if (hasActiveCampaigns()) {
        <mat-card class="updates-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>update</mat-icon>
              Live Updates
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="live-indicator">
              <div class="pulse-dot"></div>
              <span>Monitoring {{ activeCampaignsCount() }} active campaigns</span>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .scraping-monitor-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .monitor-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .monitor-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      transition: transform 0.2s ease-in-out;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .metric-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      padding: 12px;
    }

    .metric-icon.total {
      background: #e3f2fd;
      color: #1976d2;
    }

    .metric-icon.active {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .metric-icon.tweets {
      background: #fff3e0;
      color: #f57c00;
    }

    .metric-icon.sentiment {
      background: #fce4ec;
      color: #c2185b;
    }

    .metric-data {
      display: flex;
      flex-direction: column;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .metric-label {
      font-size: 14px;
      color: #666;
    }

    .campaigns-card {
      margin-bottom: 24px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .campaigns-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .campaign-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .campaign-info {
      flex: 1;
    }

    .campaign-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .campaign-header h3 {
      margin: 0;
      color: #333;
    }

    .campaign-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #666;
    }

    .detail-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .campaign-progress {
      min-width: 200px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .campaign-actions {
      display: flex;
      gap: 4px;
    }

    .status-running {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .status-paused {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-completed {
      background: #e1f5fe;
      color: #0277bd;
    }

    .status-error {
      background: #ffebee;
      color: #d32f2f;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bbb;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: #666;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #999;
      margin-bottom: 24px;
    }

    .updates-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pulse-dot {
      width: 12px;
      height: 12px;
      background: #4caf50;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      }
      
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
      }
      
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .scraping-monitor-container {
        padding: 16px;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .campaign-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .campaign-details {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class ScrapingMonitorComponent implements OnInit, OnDestroy {
  // Reactive state
  campaigns = signal<CampaignStatus[]>([]);
  metrics = signal<ScrapingMetrics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalTweets: 0,
    averageSentiment: 0
  });
  isRefreshing = signal(false);

  // Computed properties
  hasActiveCampaigns = computed(() => this.campaigns().some(c => c.status === 'running'));
  activeCampaignsCount = computed(() => this.campaigns().filter(c => c.status === 'running').length);

  private updateInterval?: number;

  ngOnInit(): void {
    this.loadInitialData();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private loadInitialData(): void {
    // Simulate loading campaign data
    const mockCampaigns: CampaignStatus[] = [
      {
        id: '1',
        name: 'AI Trends Campaign',
        status: 'running',
        progress: 65,
        tweetsCollected: 2543,
        sentimentScore: 0.7,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        estimatedCompletion: new Date(Date.now() + 1 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Brand Monitoring',
        status: 'paused',
        progress: 30,
        tweetsCollected: 892,
        sentimentScore: 0.5,
        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ];

    this.campaigns.set(mockCampaigns);
    this.updateMetrics();
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateCampaignProgress();
    }, 3000);
  }

  private updateCampaignProgress(): void {
    this.campaigns.update(campaigns => 
      campaigns.map(campaign => {
        if (campaign.status === 'running' && campaign.progress < 100) {
          return {
            ...campaign,
            progress: Math.min(campaign.progress + Math.random() * 5, 100),
            tweetsCollected: campaign.tweetsCollected + Math.floor(Math.random() * 10)
          };
        }
        return campaign;
      })
    );
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const campaigns = this.campaigns();
    this.metrics.set({
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'running').length,
      totalTweets: campaigns.reduce((sum, c) => sum + c.tweetsCollected, 0),
      averageSentiment: campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + c.sentimentScore, 0) / campaigns.length 
        : 0
    });
  }

  // Public methods
  refreshData(): void {
    this.isRefreshing.set(true);
    setTimeout(() => {
      this.loadInitialData();
      this.isRefreshing.set(false);
    }, 1000);
  }

  startNewCampaign(): void {
    console.log('Starting new campaign...');
  }

  pauseCampaign(campaignId: string): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === campaignId ? { ...c, status: 'paused' as const } : c)
    );
    this.updateMetrics();
  }

  resumeCampaign(campaignId: string): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === campaignId ? { ...c, status: 'running' as const } : c)
    );
    this.updateMetrics();
  }

  stopCampaign(campaignId: string): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === campaignId ? { ...c, status: 'completed' as const, progress: 100 } : c)
    );
    this.updateMetrics();
  }

  viewCampaignDetails(campaignId: string): void {
    console.log('Viewing campaign details:', campaignId);
  }

  // Helper methods
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  formatSentiment(score: number): string {
    return (score * 100).toFixed(1) + '%';
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'running': 'Running',
      'paused': 'Paused',
      'completed': 'Completed',
      'error': 'Error'
    };
    return labels[status] || status;
  }

  getProgressColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'running': return 'primary';
      case 'paused': return 'accent';
      case 'error': return 'warn';
      default: return 'primary';
    }
  }
}
