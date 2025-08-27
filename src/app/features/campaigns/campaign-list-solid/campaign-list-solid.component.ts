/**
 * SOLID Campaign List Component
 * Demonstrates all SOLID principles in Angular component architecture
 *
 * S - Single Responsibility: Only handles UI coordination
 * O - Open/Closed: Extensible through service injection
 * L - Liskov Substitution: Services can be substituted
 * I - Interface Segregation: Uses focused service interfaces
 * D - Dependency Inversion: Depends on service abstractions
 */
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';
import {
  CampaignActionService,
  CampaignDisplayService,
  CampaignFilterService,
  CampaignSortService
} from '../services/campaign-presentation.services';

@Component({
  selector: 'app-campaign-list-solid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="campaign-list-container">
      <!-- Header -->
      <div class="header">
        <h2>Campaigns</h2>
        <button mat-raised-button color="primary" (click)="createCampaign()">
          <mat-icon>add</mat-icon>
          New Campaign
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search campaigns</mat-label>
          <input matInput
                 [value]="filterService.searchTerm()"
                 (input)="onSearchChange($event)"
                 placeholder="Search by name, description, hashtags...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [value]="filterService.statusFilter()"
                      (selectionChange)="onStatusFilterChange($event.value)">
            <mat-option value="all">All Statuses</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
            <mat-option value="completed">Completed</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select [value]="filterService.typeFilter()"
                      (selectionChange)="onTypeFilterChange($event.value)">
            <mat-option value="all">All Types</mat-option>
            <mat-option value="hashtag">Hashtag</mat-option>
            <mat-option value="keyword">Keyword</mat-option>
            <mat-option value="user">User</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-button (click)="clearFilters()">
          <mat-icon>clear</mat-icon>
          Clear Filters
        </button>
      </div>

      <!-- Sort Controls -->
      <div class="sort-section">
        <span class="sort-label">Sort by:</span>
        <button mat-button
                [class.active]="sortService.sortBy() === 'name'"
                (click)="sortBy('name')">
          Name
          @if (sortService.sortBy() === 'name') {
            <mat-icon>{{ sortService.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          }
        </button>
        <button mat-button
                [class.active]="sortService.sortBy() === 'startDate'"
                (click)="sortBy('startDate')">
          Start Date
          @if (sortService.sortBy() === 'startDate') {
            <mat-icon>{{ sortService.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          }
        </button>
        <button mat-button
                [class.active]="sortService.sortBy() === 'status'"
                (click)="sortBy('status')">
          Status
          @if (sortService.sortBy() === 'status') {
            <mat-icon>{{ sortService.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          }
        </button>
      </div>

      <!-- Loading State -->
      @if (campaignFacade.loading$()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading campaigns...</p>
        </div>
      }

      <!-- Error State -->
      @if (campaignFacade.error$() && !campaignFacade.loading$()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <span>{{ campaignFacade.error$() }}</span>
          <button mat-button (click)="campaignFacade.clearError()">Dismiss</button>
        </div>
      }

      <!-- Campaign Results Info -->
      @if (!campaignFacade.loading$() && filteredAndSortedCampaigns().length > 0) {
        <div class="results-info">
          Showing {{ filteredAndSortedCampaigns().length }} of {{ allCampaigns().length }} campaigns
        </div>
      }

      <!-- Campaigns Grid -->
      @if (filteredAndSortedCampaigns().length > 0 && !campaignFacade.loading$()) {
        <div class="campaigns-grid">
          @for (campaign of filteredAndSortedCampaigns(); track campaign.id) {
            <mat-card class="campaign-card" (click)="viewCampaign(campaign.id)">
              <mat-card-header>
                <mat-card-title>{{ campaign.name }}</mat-card-title>
                <mat-card-subtitle>{{ campaign.type | titlecase }}</mat-card-subtitle>
                <div class="status-container">
                  <mat-icon [class]="displayService.getStatusClass(campaign.status)">
                    {{ displayService.getStatusIcon(campaign.status) }}
                  </mat-icon>
                  <span [class]="displayService.getStatusClass(campaign.status)">
                    {{ campaign.status | titlecase }}
                  </span>
                </div>
              </mat-card-header>

              <mat-card-content>
                <p class="description">{{ campaign.description || 'No description available' }}</p>

                <div class="campaign-details">
                  <div class="detail-item">
                    <mat-icon>local_offer</mat-icon>
                    <span>{{ displayService.formatCount(campaign.hashtags.length, 'hashtags') }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>search</mat-icon>
                    <span>{{ displayService.formatCount(campaign.keywords.length, 'keywords') }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>timeline</mat-icon>
                    <span>{{ campaign.maxTweets }} max tweets</span>
                  </div>
                </div>

                <div class="date-range">
                  <small>{{ displayService.formatDateRange(campaign.startDate, campaign.endDate) }}</small>
                </div>
              </mat-card-content>

              <mat-card-actions>
                @for (action of getAvailableActions(campaign); track action) {
                  @switch (action) {
                    @case ('start') {
                      <button mat-button color="primary"
                              (click)="executeAction($event, campaign, 'start')">
                        <mat-icon>play_arrow</mat-icon>
                        Start
                      </button>
                    }
                    @case ('stop') {
                      <button mat-button color="warn"
                              (click)="executeAction($event, campaign, 'stop')">
                        <mat-icon>stop</mat-icon>
                        Stop
                      </button>
                    }
                    @case ('edit') {
                      <button mat-button
                              (click)="executeAction($event, campaign, 'edit')">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                    }
                  }
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      <!-- Empty State -->
      @if (filteredAndSortedCampaigns().length === 0 && !campaignFacade.loading$()) {
        <div class="empty-state">
          @if (allCampaigns().length === 0) {
            <mat-icon>campaign</mat-icon>
            <h3>No campaigns found</h3>
            <p>Create your first campaign to start monitoring social media sentiment.</p>
            <button mat-raised-button color="primary" (click)="createCampaign()">
              Create Campaign
            </button>
          } @else {
            <mat-icon>filter_list_off</mat-icon>
            <h3>No campaigns match your filters</h3>
            <p>Try adjusting your search criteria or clear the filters.</p>
            <button mat-button (click)="clearFilters()">
              Clear Filters
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .campaign-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .filters-section {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .sort-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .sort-label {
      font-weight: 500;
      color: #666;
    }

    .sort-section button.active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .results-info {
      margin-bottom: 16px;
      color: #666;
      font-size: 14px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
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
      height: fit-content;
    }

    .campaign-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .status-container {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-active {
      color: #2e7d32;
    }

    .status-inactive {
      color: #f57c00;
    }

    .status-completed {
      color: #1976d2;
    }

    .description {
      margin: 16px 0;
      color: #666;
      line-height: 1.4;
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
export class CampaignListSolidComponent implements OnInit {
  // Service Dependencies - Dependency Inversion Principle
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Domain Services - Single Responsibility
  campaignFacade = inject(CampaignFacade);
  displayService = inject(CampaignDisplayService);
  filterService = inject(CampaignFilterService);
  sortService = inject(CampaignSortService);
  actionService = inject(CampaignActionService);

  // Component State
  allCampaigns = this.campaignFacade.campaigns$;

  // Computed Properties - Reactive UI state
  readonly filteredAndSortedCampaigns = computed(() => {
    const campaigns = this.allCampaigns();
    const filtered = this.filterService.filterCampaigns(campaigns);
    return this.sortService.sortCampaigns(filtered);
  });

  ngOnInit(): void {
    // DESACTIVADO: No cargar campañas automáticamente para evitar errores 401
    console.log('Campaign List (Solid) - loadCampaigns DESACTIVADO para evitar errores 401');
    // this.loadCampaigns();
  }

  // Event Handlers - Delegating to appropriate services
  onSearchChange(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.filterService.setSearchTerm(term);
  }

  onStatusFilterChange(status: string): void {
    this.filterService.setStatusFilter(status);
  }

  onTypeFilterChange(type: string): void {
    this.filterService.setTypeFilter(type);
  }

  clearFilters(): void {
    this.filterService.clearFilters();
  }

  sortBy(field: keyof Campaign): void {
    this.sortService.setSorting(field);
  }

  // Campaign Actions - Using action service for validation
  getAvailableActions(campaign: Campaign): string[] {
    return this.actionService.getAvailableActions(campaign);
  }

  executeAction(event: Event, campaign: Campaign, action: string): void {
    event.stopPropagation();

    // Validate action before execution
    const validation = this.actionService.validateCampaignAction(campaign, action);
    if (!validation.valid) {
      this.snackBar.open(validation.reason || 'Action not allowed', 'Close', { duration: 3000 });
      return;
    }

    // Execute the action
    switch (action) {
      case 'start':
        this.startCampaign(campaign.id);
        break;
      case 'stop':
        this.stopCampaign(campaign.id);
        break;
      case 'edit':
        this.editCampaign(campaign.id);
        break;
      case 'delete':
        this.deleteCampaign(campaign.id);
        break;
    }
  }

  // Navigation Methods
  createCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
  }

  viewCampaign(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  editCampaign(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId, 'edit']);
  }

  // Campaign Operations - Delegating to facade
  private loadCampaigns(): void {
    this.campaignFacade.loadCampaigns().subscribe();
  }

  private startCampaign(campaignId: string): void {
    this.campaignFacade.startCampaign(campaignId).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign started successfully', 'Close', { duration: 3000 });
      }
    });
  }

  private stopCampaign(campaignId: string): void {
    this.campaignFacade.stopCampaign(campaignId).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign stopped successfully', 'Close', { duration: 3000 });
      }
    });
  }

  private deleteCampaign(campaignId: string): void {
    // In a real implementation, this would show a confirmation dialog first
    this.campaignFacade.deleteCampaign(campaignId).subscribe(success => {
      if (success) {
        this.snackBar.open('Campaign deleted successfully', 'Close', { duration: 3000 });
      }
    });
  }
}
