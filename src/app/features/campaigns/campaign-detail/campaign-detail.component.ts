import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CampaignFacade } from '../../../core/facades/campaign.facade';
import { Campaign } from '../../../core/state/app.state';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="campaign-detail-container">
      @if (campaignFacade.loading$()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      }

      @if (selectedCampaign()) {
        <div class="campaign-header">
          <div class="header-content">
            <div class="title-section">
              <h1>{{ selectedCampaign()!.name }}</h1>
              <div class="status-badge" [class]="'status-' + selectedCampaign()!.status">
                {{ selectedCampaign()!.status | titlecase }}
              </div>
            </div>
            
            <div class="actions">
              @if (selectedCampaign()!.status === 'inactive') {
                <button mat-raised-button color="primary" (click)="startCampaign()">
                  <mat-icon>play_arrow</mat-icon>
                  Start Campaign
                </button>
              }
              @if (selectedCampaign()!.status === 'active') {
                <button mat-raised-button color="warn" (click)="stopCampaign()">
                  <mat-icon>stop</mat-icon>
                  Stop Campaign
                </button>
              }
              <button mat-button (click)="editCampaign()">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-button (click)="viewAnalytics()">
                <mat-icon>analytics</mat-icon>
                Analytics
              </button>
            </div>
          </div>
        </div>

        <mat-tab-group class="campaign-tabs">
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="overview-grid">
                <!-- Basic Information -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Basic Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Type:</span>
                      <span class="value">{{ selectedCampaign()!.type | titlecase }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Description:</span>
                      <span class="value">{{ selectedCampaign()!.description || 'No description' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Created:</span>
                      <span class="value">{{ formatDate(selectedCampaign()!.createdAt) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Last Collection:</span>
                      <span class="value">
                        {{ selectedCampaign()!.lastDataCollection ? formatDate(selectedCampaign()!.lastDataCollection!) : 'Never' }}
                      </span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Time Configuration -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Time Configuration</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Start Date:</span>
                      <span class="value">{{ formatDate(selectedCampaign()!.startDate) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">End Date:</span>
                      <span class="value">{{ formatDate(selectedCampaign()!.endDate) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Duration:</span>
                      <span class="value">{{ calculateDuration() }} days</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Max Tweets:</span>
                      <span class="value">{{ selectedCampaign()!.maxTweets | number }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Collection Settings -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Analysis Settings</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="settings-list">
                      <div class="setting-item">
                        <mat-icon [class.enabled]="selectedCampaign()!.sentimentAnalysis">
                          {{ selectedCampaign()!.sentimentAnalysis ? 'check_circle' : 'cancel' }}
                        </mat-icon>
                        <span>Sentiment Analysis</span>
                      </div>
                      <div class="setting-item">
                        <mat-icon [class.enabled]="selectedCampaign()!.emotionAnalysis">
                          {{ selectedCampaign()!.emotionAnalysis ? 'check_circle' : 'cancel' }}
                        </mat-icon>
                        <span>Emotion Analysis</span>
                      </div>
                      <div class="setting-item">
                        <mat-icon [class.enabled]="selectedCampaign()!.topicsAnalysis">
                          {{ selectedCampaign()!.topicsAnalysis ? 'check_circle' : 'cancel' }}
                        </mat-icon>
                        <span>Topics Analysis</span>
                      </div>
                      <div class="setting-item">
                        <mat-icon [class.enabled]="selectedCampaign()!.influencerAnalysis">
                          {{ selectedCampaign()!.influencerAnalysis ? 'check_circle' : 'cancel' }}
                        </mat-icon>
                        <span>Influencer Analysis</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Statistics -->
                @if (selectedCampaign()!.stats) {
                  <mat-card class="stats-card full-width">
                    <mat-card-header>
                      <mat-card-title>Campaign Statistics</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="stats-grid">
                        <div class="stat-item">
                          <div class="stat-number">{{ selectedCampaign()!.stats!.totalTweets | number }}</div>
                          <div class="stat-label">Total Tweets</div>
                        </div>
                        <div class="stat-item">
                          <div class="stat-number">{{ selectedCampaign()!.stats!.totalEngagement | number }}</div>
                          <div class="stat-label">Total Engagement</div>
                        </div>
                        <div class="stat-item">
                          <div class="stat-number">{{ selectedCampaign()!.stats!.avgSentiment | number:'1.2-2' }}</div>
                          <div class="stat-label">Avg Sentiment</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Tracking Parameters">
            <div class="tab-content">
              <div class="parameters-grid">
                <!-- Hashtags -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Hashtags ({{ selectedCampaign()!.hashtags.length }})</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (selectedCampaign()!.hashtags.length > 0) {
                      <mat-chip-set>
                        @for (hashtag of selectedCampaign()!.hashtags; track hashtag) {
                          <mat-chip>{{ hashtag }}</mat-chip>
                        }
                      </mat-chip-set>
                    } @else {
                      <p class="no-data">No hashtags configured</p>
                    }
                  </mat-card-content>
                </mat-card>

                <!-- Keywords -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Keywords ({{ selectedCampaign()!.keywords.length }})</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (selectedCampaign()!.keywords.length > 0) {
                      <mat-chip-set>
                        @for (keyword of selectedCampaign()!.keywords; track keyword) {
                          <mat-chip>{{ keyword }}</mat-chip>
                        }
                      </mat-chip-set>
                    } @else {
                      <p class="no-data">No keywords configured</p>
                    }
                  </mat-card-content>
                </mat-card>

                <!-- Mentions -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Mentions ({{ selectedCampaign()!.mentions.length }})</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (selectedCampaign()!.mentions.length > 0) {
                      <mat-chip-set>
                        @for (mention of selectedCampaign()!.mentions; track mention) {
                          <mat-chip>{{ mention }}</mat-chip>
                        }
                      </mat-chip-set>
                    } @else {
                      <p class="no-data">No mentions configured</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      }

      @if (campaignFacade.error$() && !campaignFacade.loading$()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <span>{{ campaignFacade.error$() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .campaign-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .campaign-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .title-section h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 500;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-inactive {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-completed {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-paused {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .campaign-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .parameters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .info-card {
      height: fit-content;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      align-items: center;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      text-align: right;
      flex: 1;
      margin-left: 16px;
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setting-item mat-icon {
      color: #ccc;
    }

    .setting-item mat-icon.enabled {
      color: #4caf50;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 24px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 500;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .no-data {
      color: #999;
      font-style: italic;
      margin: 0;
    }

    .error-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #ffebee;
      border-radius: 4px;
      color: #c62828;
      margin: 24px 0;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .title-section {
        flex-direction: column;
        align-items: flex-start;
      }

      .actions {
        justify-content: stretch;
      }

      .actions button {
        flex: 1;
      }

      .overview-grid,
      .parameters-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class CampaignDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
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

  startCampaign(): void {
    this.campaignFacade.startCampaign(this.campaignId()).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign started successfully', 'Close', { duration: 3000 });
      }
    });
  }

  stopCampaign(): void {
    this.campaignFacade.stopCampaign(this.campaignId()).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign stopped successfully', 'Close', { duration: 3000 });
      }
    });
  }

  editCampaign(): void {
    this.router.navigate(['/campaigns', this.campaignId(), 'edit']);
  }

  viewAnalytics(): void {
    this.router.navigate(['/campaigns', this.campaignId(), 'analytics']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  calculateDuration(): number {
    const campaign = this.selectedCampaign();
    if (!campaign) return 0;
    
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
