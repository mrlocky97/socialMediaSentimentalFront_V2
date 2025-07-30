/**
 * Campaign List Container Component
 * Smart component that handles business logic and state
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CampaignFacade } from '../../../core/facades/campaign.facade';
import { Campaign } from '../../../core/state/app.state';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="campaign-list-container">
      <div class="header">
        <h2>Campaigns</h2>
        <button mat-raised-button color="primary" (click)="createCampaign()">
          <mat-icon>add</mat-icon>
          New Campaign
        </button>
      </div>

      @if (campaignFacade.loading$()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      }

      @if (campaignFacade.error$() && !campaignFacade.loading$()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <span>{{ campaignFacade.error$() }}</span>
          <button mat-button (click)="campaignFacade.clearError()">Dismiss</button>
        </div>
      }

      @if (campaigns().length > 0 && !campaignFacade.loading$()) {
        <div class="campaigns-grid">
          @for (campaign of campaigns(); track campaign.id) {
            <mat-card class="campaign-card" (click)="selectCampaign(campaign.id)">
              <mat-card-header>
                <mat-card-title>{{ campaign.name }}</mat-card-title>
                <mat-card-subtitle>{{ campaign.type | titlecase }}</mat-card-subtitle>
                <div class="status-badge" [class]="'status-' + campaign.status">
                  {{ campaign.status | titlecase }}
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <p>{{ campaign.description || 'No description available' }}</p>
                
                <div class="campaign-details">
                  <div class="detail-item">
                    <mat-icon>local_offer</mat-icon>
                    <span>{{ campaign.hashtags.length }} hashtags</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>search</mat-icon>
                    <span>{{ campaign.keywords.length }} keywords</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>timeline</mat-icon>
                    <span>{{ campaign.maxTweets }} max tweets</span>
                  </div>
                </div>

                <div class="date-range">
                  <small>{{ formatDate(campaign.startDate) }} - {{ formatDate(campaign.endDate) }}</small>
                </div>
              </mat-card-content>

              <mat-card-actions>
                @if (campaign.status === 'inactive') {
                  <button mat-button color="primary" (click)="startCampaign($event, campaign.id)">
                    <mat-icon>play_arrow</mat-icon>
                    Start
                  </button>
                }
                @if (campaign.status === 'active') {
                  <button mat-button color="warn" (click)="stopCampaign($event, campaign.id)">
                    <mat-icon>stop</mat-icon>
                    Stop
                  </button>
                }
                <button mat-button (click)="editCampaign($event, campaign.id)">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      @if (campaigns().length === 0 && !campaignFacade.loading$()) {
        <div class="empty-state">
          <mat-icon>campaign</mat-icon>
          <h3>No campaigns found</h3>
          <p>Create your first campaign to start monitoring social media sentiment.</p>
          <button mat-raised-button color="primary" (click)="createCampaign()">
            Create Campaign
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .campaign-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .error-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #ffebee;
      border-radius: 4px;
      color: #c62828;
      margin-bottom: 24px;
    }

    .campaigns-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .campaign-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .campaign-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .campaign-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 16px 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .detail-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
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

    .date-range {
      margin-top: 16px;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 16px 0 8px;
      color: #666;
    }

    .empty-state p {
      color: #999;
      margin-bottom: 24px;
    }

    mat-card-actions {
      display: flex;
      gap: 8px;
    }
  `]
})
export class CampaignListComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  campaignFacade = inject(CampaignFacade);
  campaigns = this.campaignFacade.campaigns$;

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignFacade.loadCampaigns().subscribe();
  }

  createCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
  }

  selectCampaign(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  editCampaign(event: Event, campaignId: string): void {
    event.stopPropagation();
    this.router.navigate(['/dashboard/campaigns', campaignId, 'edit']);
  }

  startCampaign(event: Event, campaignId: string): void {
    event.stopPropagation();
    this.campaignFacade.startCampaign(campaignId).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign started successfully', 'Close', { duration: 3000 });
      }
    });
  }

  stopCampaign(event: Event, campaignId: string): void {
    event.stopPropagation();
    this.campaignFacade.stopCampaign(campaignId).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign stopped successfully', 'Close', { duration: 3000 });
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
