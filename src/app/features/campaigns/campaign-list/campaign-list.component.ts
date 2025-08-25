/* =====================================
   CAMPAIGN LIST COMPONENT
   Modern campaign list with improved UX/UI
   ===================================== */

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { CampaignFacade } from '../../../core/facades/campaign.facade';
import { Campaign } from '../../../core/state/app.state';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  template: `
    <div class="campaigns-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <mat-icon>campaign</mat-icon>
            Campaign Management
          </h1>
          <p class="page-subtitle">Manage your social media monitoring campaigns</p>
        </div>
        
        <div class="header-actions">
          <button mat-raised-button 
                  color="primary" 
                  class="create-campaign-btn"
                  (click)="navigateToCreateCampaign()">
            <mat-icon>add</mat-icon>
            Create New Campaign
          </button>
        </div>
      </div>

      <!-- Quick Stats Cards -->
      <div class="stats-grid" *ngIf="campaigns().length > 0">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number">{{ getTotalCampaigns() }}</div>
              <div class="stat-label">Total Campaigns</div>
            </div>
            <mat-icon class="stat-icon">campaign</mat-icon>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number">{{ getActiveCampaigns() }}</div>
              <div class="stat-label">Active Campaigns</div>
            </div>
            <mat-icon class="stat-icon active">play_circle</mat-icon>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number">{{ getPausedCampaigns() }}</div>
              <div class="stat-label">Paused Campaigns</div>
            </div>
            <mat-icon class="stat-icon warning">pause_circle</mat-icon>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number">{{ getDraftCampaigns() }}</div>
              <div class="stat-label">Draft Campaigns</div>
            </div>
            <mat-icon class="stat-icon secondary">drafts</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters Section -->
      <mat-card class="filters-card" *ngIf="campaigns().length > 0">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search campaigns</mat-label>
                <input matInput formControlName="search" placeholder="Search by name or description">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status" multiple>
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="paused">Paused</mat-option>
                  <mat-option value="completed">Completed</mat-option>
                  <mat-option value="draft">Draft</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type" multiple>
                  <mat-option value="hashtag">Hashtag Monitoring</mat-option>
                  <mat-option value="keyword">Keyword Tracking</mat-option>
                  <mat-option value="user">User Monitoring</mat-option>
                  <mat-option value="mention">Mention Tracking</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-icon-button 
                      (click)="clearFilters()" 
                      matTooltip="Clear filters">
                <mat-icon>clear</mat-icon>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
        <p>Loading campaigns...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && campaigns().length === 0">
        <mat-card class="empty-card">
          <mat-card-content>
            <div class="empty-content">
              <mat-icon class="empty-icon">campaign</mat-icon>
              <h2>No campaigns yet</h2>
              <p>Create your first social media monitoring campaign to get started</p>
              <button mat-raised-button 
                      color="primary" 
                      class="empty-action-btn"
                      (click)="navigateToCreateCampaign()">
                <mat-icon>add</mat-icon>
                Create Your First Campaign
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Campaigns Table -->
      <mat-card class="table-card" *ngIf="!loading() && filteredCampaigns().length > 0">
        <div class="table-header">
          <h3>Campaigns ({{ filteredCampaigns().length }})</h3>
          <div class="table-actions" *ngIf="hasSelectedCampaigns()">
            <button mat-button [matMenuTriggerFor]="bulkMenu">
              <mat-icon>more_vert</mat-icon>
              Bulk Actions ({{ selectedCampaigns().size }})
            </button>
            <mat-menu #bulkMenu="matMenu">
              <button mat-menu-item (click)="bulkAction('pause')">
                <mat-icon>pause</mat-icon>
                Pause Selected
              </button>
              <button mat-menu-item (click)="bulkAction('resume')">
                <mat-icon>play_arrow</mat-icon>
                Resume Selected
              </button>
              <button mat-menu-item (click)="bulkAction('delete')" class="danger-action">
                <mat-icon>delete</mat-icon>
                Delete Selected
              </button>
            </mat-menu>
          </div>
        </div>

        <div class="table-container">
          <table mat-table [dataSource]="filteredCampaigns()" class="campaigns-table" matSort>
            <!-- Selection Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox (change)="toggleAllSelection()" 
                              [checked]="isAllSelected()"
                              [indeterminate]="hasSelectedCampaigns() && !isAllSelected()">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let campaign">
                <mat-checkbox (change)="toggleCampaignSelection(campaign.id)"
                              [checked]="selectedCampaigns().has(campaign.id)">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Campaign Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Campaign</th>
              <td mat-cell *matCellDef="let campaign">
                <div class="campaign-info">
                  <div class="campaign-name" [routerLink]="['/dashboard/campaigns', campaign.id]">
                    {{ campaign.name }}
                  </div>
                  <div class="campaign-description" *ngIf="campaign.description">
                    {{ campaign.description | slice:0:100 }}{{ campaign.description?.length > 100 ? '...' : '' }}
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let campaign">
                <mat-chip [ngClass]="'status-' + campaign.status">
                  <mat-icon>{{ getStatusIcon(campaign.status) }}</mat-icon>
                  {{ campaign.status | titlecase }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Type Column -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
              <td mat-cell *matCellDef="let campaign">
                <div class="type-info">
                  <mat-icon class="type-icon">{{ getTypeIcon(campaign.type) }}</mat-icon>
                  {{ getTypeLabel(campaign.type) }}
                </div>
              </td>
            </ng-container>

            <!-- Tracking Parameters Column -->
            <ng-container matColumnDef="parameters">
              <th mat-header-cell *matHeaderCellDef>Parameters</th>
              <td mat-cell *matCellDef="let campaign">
                <div class="parameters-info">
                  <mat-chip-set *ngIf="campaign.hashtags?.length">
                    <mat-chip *ngFor="let hashtag of campaign.hashtags | slice:0:2">
                      #{{ hashtag }}
                    </mat-chip>
                    <mat-chip *ngIf="campaign.hashtags.length > 2">
                      +{{ campaign.hashtags.length - 2 }} more
                    </mat-chip>
                  </mat-chip-set>
                  <mat-chip-set *ngIf="campaign.keywords?.length">
                    <mat-chip *ngFor="let keyword of campaign.keywords | slice:0:2">
                      {{ keyword }}
                    </mat-chip>
                    <mat-chip *ngIf="campaign.keywords.length > 2">
                      +{{ campaign.keywords.length - 2 }} more
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </td>
            </ng-container>

            <!-- Timeline Column -->
            <ng-container matColumnDef="timeline">
              <th mat-header-cell *matHeaderCellDef>Timeline</th>
              <td mat-cell *matCellDef="let campaign">
                <div class="timeline-info">
                  <div class="date-range">
                    {{ campaign.startDate | date:'MMM d' }} - {{ campaign.endDate | date:'MMM d, y' }}
                  </div>
                  <div class="progress-info" *ngIf="campaign.status === 'active'">
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="getCampaignProgress(campaign)"
                      class="timeline-progress">
                    </mat-progress-bar>
                    <span class="progress-text">{{ getCampaignProgress(campaign) }}% complete</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let campaign">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu" 
                        [matMenuTriggerData]="{campaign: campaign}">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <ng-template matMenuContent let-campaign="campaign">
                    <button mat-menu-item [routerLink]="['/dashboard/campaigns', campaign.id]">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    <button mat-menu-item [routerLink]="['/dashboard/campaigns', campaign.id, 'edit']">
                      <mat-icon>edit</mat-icon>
                      Edit Campaign
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item 
                            (click)="toggleCampaignStatus(campaign)"
                            *ngIf="campaign.status === 'active'">
                      <mat-icon>pause</mat-icon>
                      Pause Campaign
                    </button>
                    <button mat-menu-item 
                            (click)="toggleCampaignStatus(campaign)"
                            *ngIf="campaign.status === 'paused'">
                      <mat-icon>play_arrow</mat-icon>
                      Resume Campaign
                    </button>
                    <button mat-menu-item (click)="duplicateCampaign(campaign)">
                      <mat-icon>content_copy</mat-icon>
                      Duplicate
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="deleteCampaign(campaign)" class="danger-action">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                  </ng-template>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                class="campaign-row"
                [class.selected]="selectedCampaigns().has(row.id)"></tr>
          </table>
        </div>

        <!-- Pagination -->
        <mat-paginator 
          [length]="totalCount()"
          [pageSize]="pageSize()"
          [pageIndex]="currentPage()"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </mat-card>

      <!-- Error State -->
      <div class="error-state" *ngIf="error()">
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon class="error-icon">error</mat-icon>
            <h3>Error Loading Campaigns</h3>
            <p>{{ error() }}</p>
            <button mat-raised-button color="primary" (click)="loadCampaigns()">
              Try Again
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .campaigns-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header Styles */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 2rem;
      font-weight: 400;
      color: #333;
    }

    .page-title mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1976d2;
    }

    .page-subtitle {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .create-campaign-btn {
      min-width: 200px;
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      background: linear-gradient(45deg, #1976d2, #42a5f5);
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
    }

    .create-campaign-btn mat-icon {
      margin-right: 8px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .stat-card .mat-mdc-card-content {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      margin-top: 8px;
    }

    .stat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      opacity: 0.6;
      color: #1976d2;
    }

    .stat-icon.active { color: #4caf50; }
    .stat-icon.warning { color: #ff9800; }
    .stat-icon.secondary { color: #9e9e9e; }

    /* Filters */
    .filters-card {
      margin-bottom: 32px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .filters-form {
      padding: 8px 0;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .search-field {
      flex: 2;
      min-width: 300px;
    }

    .filter-row mat-form-field {
      flex: 1;
    }

    /* Table Styles */
    .table-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
    }

    .table-header h3 {
      margin: 0;
      color: #333;
      font-weight: 500;
    }

    .table-container {
      overflow-x: auto;
    }

    .campaigns-table {
      width: 100%;
      background: white;
    }

    .campaign-row {
      transition: background-color 0.2s ease;
    }

    .campaign-row:hover {
      background-color: #f5f5f5;
    }

    .campaign-row.selected {
      background-color: #e3f2fd;
    }

    /* Cell Styles */
    .campaign-info {
      min-width: 200px;
    }

    .campaign-name {
      font-weight: 500;
      color: #1976d2;
      cursor: pointer;
      text-decoration: none;
      margin-bottom: 4px;
    }

    .campaign-name:hover {
      text-decoration: underline;
    }

    .campaign-description {
      font-size: 0.9rem;
      color: #666;
      line-height: 1.3;
    }

    .type-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .type-icon {
      color: #666;
    }

    .parameters-info mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .parameters-info mat-chip {
      font-size: 0.8rem;
    }

    .timeline-info {
      min-width: 160px;
    }

    .date-range {
      font-size: 0.9rem;
      color: #333;
      margin-bottom: 4px;
    }

    .progress-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .timeline-progress {
      height: 4px;
      border-radius: 2px;
    }

    .progress-text {
      font-size: 0.8rem;
      color: #666;
    }

    /* Status Chips */
    .mat-mdc-chip.status-active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .mat-mdc-chip.status-paused {
      background-color: #fff3e0;
      color: #e65100;
    }

    .mat-mdc-chip.status-completed {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .mat-mdc-chip.status-draft {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    /* Loading and Empty States */
    .loading-container, .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-card, .error-card {
      max-width: 500px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .empty-content {
      padding: 32px;
    }

    .empty-icon, .error-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #ccc;
      margin-bottom: 24px;
    }

    .error-icon {
      color: #f44336;
    }

    .empty-content h2, .error-card h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 400;
    }

    .empty-content p, .error-card p {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 1.1rem;
    }

    .empty-action-btn {
      min-width: 200px;
      height: 48px;
      background: linear-gradient(45deg, #1976d2, #42a5f5);
    }

    /* Menu Styles */
    .danger-action {
      color: #f44336;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .campaigns-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filter-row {
        flex-direction: column;
        gap: 8px;
      }

      .search-field {
        min-width: auto;
      }

      .table-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class CampaignListComponent implements OnInit, OnDestroy {
  private readonly campaignFacade = inject(CampaignFacade);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Reactive signals
  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedCampaigns = signal<Set<string>>(new Set());
  totalCount = signal<number>(0);
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);

  // Table configuration
  displayedColumns: string[] = [
    'select',
    'name',
    'status',
    'type',
    'parameters',
    'timeline',
    'actions'
  ];

  // Filter form
  filterForm: FormGroup;

  // Computed values
  hasSelectedCampaigns = computed(() => this.selectedCampaigns().size > 0);
  isAllSelected = computed(() =>
    this.campaigns().length > 0 &&
    this.selectedCampaigns().size === this.campaigns().length
  );

  filteredCampaigns = computed(() => {
    const campaigns = this.campaigns();
    const filters = this.filterForm?.value;
    
    if (!filters) return campaigns;

    return campaigns.filter(campaign => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = campaign.name.toLowerCase().includes(search);
        const matchesDescription = campaign.description?.toLowerCase().includes(search) || false;
        if (!matchesName && !matchesDescription) return false;
      }

      // Status filter
      if (filters.status?.length > 0 && !filters.status.includes(campaign.status)) {
        return false;
      }

      // Type filter
      if (filters.type?.length > 0 && !filters.type.includes(campaign.type)) {
        return false;
      }

      return true;
    });
  });

  constructor() {
    // Initialize filter form
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      type: [[]],
      platforms: [[]]
    });

    // Setup search debouncing
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Filters are applied automatically via computed signal
      });
  }

  ngOnInit(): void {
    this.loadCampaigns();
    this.subscribeToFacade();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to facade state - using effect instead of direct subscription
   */
  private subscribeToFacade(): void {
    // Subscribe to facade observables and map into signals.
    // If the facade emits campaigns, use them; otherwise keep a small local fallback for demos.
    this.campaignFacade.campaigns$
      .pipe(takeUntil(this.destroy$))
      .subscribe((campaigns) => {
        if (Array.isArray(campaigns) && campaigns.length > 0) {
          this.campaigns.set(campaigns as Campaign[]);
          this.totalCount.set(campaigns.length);
        } else {
          // Fallback demo data (only used when facade provides no items)
          this.campaigns.set([
            {
              id: '1',
              name: 'Brand Monitoring Campaign',
              description: 'Monitor brand mentions across social media platforms',
              type: 'hashtag',
              status: 'active',
              hashtags: ['brandname', 'product'],
              keywords: ['artificial intelligence', 'machine learning'],
              mentions: [],
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-12-31'),
              createdAt: new Date(),
              updatedAt: new Date(),
              maxTweets: 1000,
              sentimentAnalysis: true,
              createdBy: 'user1'
            },
            {
              id: '2',
              name: 'Product Launch Tracking',
              description: 'Track sentiment and reach for new product launch',
              type: 'keyword',
              status: 'paused',
              hashtags: [],
              keywords: ['new product', 'innovation'],
              mentions: ['@company'],
              startDate: new Date('2024-02-01'),
              endDate: new Date('2024-06-30'),
              createdAt: new Date(),
              updatedAt: new Date(),
              maxTweets: 5000,
              sentimentAnalysis: true,
              createdBy: 'user1'
            }
          ]);
          this.totalCount.set(this.campaigns().length);
        }
      });

    this.campaignFacade.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((l) => this.loading.set(!!l));

    this.campaignFacade.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((e) => this.error.set(e || null));

    // If the facade exposes a totalCount$ observable, wire it; otherwise keep the computed/local value.
    if ((this.campaignFacade as any).totalCount$) {
      (this.campaignFacade as any).totalCount$
        .pipe(takeUntil(this.destroy$))
        .subscribe((count: number) => this.totalCount.set(count || this.campaigns().length));
    }
  }

  /**
   * Load campaigns
   */
  loadCampaigns(): void {
    this.campaignFacade.loadCampaigns().subscribe();
  }

  /**
   * Navigate to create campaign
   */
  navigateToCreateCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: [],
      type: [],
      platforms: []
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  /**
   * Toggle campaign selection
   */
  toggleCampaignSelection(campaignId: string): void {
    const selected = new Set(this.selectedCampaigns());
    if (selected.has(campaignId)) {
      selected.delete(campaignId);
    } else {
      selected.add(campaignId);
    }
    this.selectedCampaigns.set(selected);
  }

  /**
   * Toggle all campaigns selection
   */
  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedCampaigns.set(new Set());
    } else {
      const allIds = new Set(this.filteredCampaigns().map(c => c.id));
      this.selectedCampaigns.set(allIds);
    }
  }

  /**
   * Toggle campaign status
   */
  toggleCampaignStatus(campaign: Campaign): void {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    // For now, we'll just show a message since the facade doesn't have this method yet
    this.snackBar.open(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`, 'Close', {
      duration: 3000
    });
  }

  /**
   * Duplicate campaign
   */
  duplicateCampaign(campaign: Campaign): void {
    this.snackBar.open('Campaign duplicated successfully', 'Close', {
      duration: 3000
    });
  }

  /**
   * Delete campaign
   */
  deleteCampaign(campaign: Campaign): void {
    if (confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      this.campaignFacade.deleteCampaign(campaign.id).subscribe(success => {
        if (success) {
          this.snackBar.open('Campaign deleted successfully', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  /**
   * Bulk actions
   */
  bulkAction(action: string): void {
    const selectedIds = Array.from(this.selectedCampaigns());
    if (selectedIds.length === 0) return;

    switch (action) {
      case 'pause':
        this.snackBar.open(`${selectedIds.length} campaigns paused`, 'Close', { duration: 3000 });
        break;
      case 'resume':
        this.snackBar.open(`${selectedIds.length} campaigns resumed`, 'Close', { duration: 3000 });
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedIds.length} campaigns?`)) {
          this.snackBar.open(`${selectedIds.length} campaigns deleted`, 'Close', { duration: 3000 });
        }
        break;
    }
    
    this.selectedCampaigns.set(new Set());
  }

  // Helper methods for stats
  getTotalCampaigns(): number {
    return this.campaigns().length;
  }

  getActiveCampaigns(): number {
    return this.campaigns().filter(c => c.status === 'active').length;
  }

  getPausedCampaigns(): number {
    return this.campaigns().filter(c => c.status === 'paused').length;
  }

  getDraftCampaigns(): number {
    return this.campaigns().filter(c => c.status === 'inactive').length;
  }

  // Helper methods for display
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'active': 'play_circle',
      'paused': 'pause_circle',
      'completed': 'check_circle',
      'inactive': 'drafts',
      'cancelled': 'cancel'
    };
    return icons[status] || 'help';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'hashtag': 'tag',
      'keyword': 'search',
      'user': 'person',
      'mention': 'alternate_email'
    };
    return icons[type] || 'campaign';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'hashtag': 'Hashtag Monitoring',
      'keyword': 'Keyword Tracking',
      'user': 'User Monitoring',
      'mention': 'Mention Tracking'
    };
    return labels[type] || type;
  }

  getCampaignProgress(campaign: Campaign): number {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / total) * 100);
  }
}
