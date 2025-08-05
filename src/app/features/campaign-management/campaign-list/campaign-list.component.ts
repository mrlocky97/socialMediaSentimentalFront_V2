/* =====================================
   CAMPAIGN LIST COMPONENT
   Enterprise data table with advanced filtering
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
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import {
  Campaign,
  CampaignFilters,
  CampaignSortOptions,
  CampaignStatus,
  CampaignType,
  SocialPlatform
} from '../models/campaign.model';
import { CampaignService } from '../services/campaign.service';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslocoModule,
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
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css']
})
export class CampaignListComponent implements OnInit, OnDestroy {
  private readonly campaignService = inject(CampaignService);
  private readonly translocoService = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state management
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
    'platforms',
    'budget',
    'performance',
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

  // Enum references for template
  CampaignStatus = CampaignStatus;
  CampaignType = CampaignType;
  SocialPlatform = SocialPlatform;

  constructor() {
    // Initialize filter form
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      type: [[]],
      platforms: [[]],
      dateRange: [null]
    });

    // Setup search debouncing
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.applyFilters());

    // Setup other filter changes
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  ngOnInit(): void {
    this.loadCampaigns();
    this.subscribeToUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load campaigns with current filters and pagination
   */
  loadCampaigns(): void {
    const filters = this.buildFilters();
    const sort: CampaignSortOptions = {
      field: 'updatedAt',
      direction: 'desc'
    };

    this.campaignService.getCampaigns(
      this.currentPage() + 1,
      this.pageSize(),
      filters,
      sort
    ).pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.campaigns.set(response.campaigns);
        this.totalCount.set(response.totalCount);
        this.selectedCampaigns.set(new Set());
      });
  }

  /**
   * Subscribe to service state updates
   */
  private subscribeToUpdates(): void {
    this.campaignService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading.set(loading));

    this.campaignService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error.set(error));
  }

  /**
   * Build filters from form values
   */
  private buildFilters(): CampaignFilters {
    const formValue = this.filterForm.value;
    const filters: CampaignFilters = {};

    if (formValue.search?.trim()) {
      filters.search = formValue.search.trim();
    }

    if (formValue.status?.length) {
      filters.status = formValue.status;
    }

    if (formValue.type?.length) {
      filters.type = formValue.type;
    }

    if (formValue.platforms?.length) {
      filters.platforms = formValue.platforms;
    }

    if (formValue.dateRange) {
      filters.dateRange = formValue.dateRange;
    }

    return filters;
  }

  /**
   * Apply current filters
   */
  applyFilters(): void {
    this.currentPage.set(0);
    this.loadCampaigns();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: [],
      type: [],
      platforms: [],
      dateRange: null
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCampaigns();
  }

  /**
   * Handle sort change
   */
  onSortChange(sort: Sort): void {
    // Implement sorting logic
    console.log('Sort changed:', sort);
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
      const allIds = new Set(this.campaigns().map(c => c.id));
      this.selectedCampaigns.set(allIds);
    }
  }

  /**
   * Update campaign status
   */
  updateCampaignStatus(campaignId: string, status: CampaignStatus): void {
    this.campaignService.updateCampaignStatus(campaignId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          // Status updated successfully
          console.log('Campaign status updated');
        }
      });
  }

  /**
   * Bulk update status for selected campaigns
   */
  bulkUpdateStatus(status: CampaignStatus): void {
    const selectedIds = Array.from(this.selectedCampaigns());
    if (selectedIds.length === 0) return;

    this.campaignService.bulkUpdateStatus(selectedIds, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          this.selectedCampaigns.set(new Set());
          console.log('Bulk status update completed');
        }
      });
  }

  /**
   * Delete campaign
   */
  deleteCampaign(campaignId: string): void {
    // Add confirmation dialog here
    this.campaignService.deleteCampaign(campaignId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          console.log('Campaign deleted');
        }
      });
  }

  /**
   * Duplicate campaign
   */
  duplicateCampaign(campaign: Campaign): void {
    const newName = `${campaign.name} (Copy)`;
    this.campaignService.duplicateCampaign(campaign.id, newName)
      .pipe(takeUntil(this.destroy$))
      .subscribe(duplicated => {
        if (duplicated) {
          console.log('Campaign duplicated');
        }
      });
  }

  /**
   * Get status color for display
   */
  getStatusColor(status: CampaignStatus): string {
    const colors = {
      [CampaignStatus.ACTIVE]: 'success',
      [CampaignStatus.PAUSED]: 'warning',
      [CampaignStatus.COMPLETED]: 'primary',
      [CampaignStatus.CANCELLED]: 'danger',
      [CampaignStatus.DRAFT]: 'secondary',
      [CampaignStatus.SCHEDULED]: 'info'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Get platform icon
   */
  getPlatformIcon(platform: SocialPlatform): string {
    const icons = {
      [SocialPlatform.TWITTER]: 'twitter',
      [SocialPlatform.FACEBOOK]: 'facebook',
      [SocialPlatform.INSTAGRAM]: 'instagram',
      [SocialPlatform.LINKEDIN]: 'linkedin',
      [SocialPlatform.TIKTOK]: 'music_note',
      [SocialPlatform.YOUTUBE]: 'play_circle'
    };
    return icons[platform] || 'public';
  }
}
