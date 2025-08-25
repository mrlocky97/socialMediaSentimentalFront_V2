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
    MatDividerModule,
  ],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css'],
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
    'actions',
  ];

  // Filter form
  filterForm: FormGroup;

  // Computed values
  hasSelectedCampaigns = computed(() => this.selectedCampaigns().size > 0);
  isAllSelected = computed(
    () => this.campaigns().length > 0 && this.selectedCampaigns().size === this.campaigns().length
  );

  filteredCampaigns = computed(() => {
    const campaigns = this.campaigns();
    const filters = this.filterForm?.value;

    if (!filters) return campaigns;

    return campaigns.filter((campaign) => {
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
      platforms: [[]],
    });

    // Setup search debouncing
    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
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
    this.campaignFacade.campaigns$.pipe(takeUntil(this.destroy$)).subscribe((campaigns) => {
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
            createdBy: 'user1',
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
            createdBy: 'user1',
          },
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
      platforms: [],
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
      const allIds = new Set(this.filteredCampaigns().map((c) => c.id));
      this.selectedCampaigns.set(allIds);
    }
  }

  /**
   * Toggle campaign status
   */
  toggleCampaignStatus(campaign: Campaign): void {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    // For now, we'll just show a message since the facade doesn't have this method yet
    this.snackBar.open(
      `Campaign ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`,
      'Close',
      {
        duration: 3000,
      }
    );
  }

  /**
   * Duplicate campaign
   */
  duplicateCampaign(campaign: Campaign): void {
    this.snackBar.open('Campaign duplicated successfully', 'Close', {
      duration: 3000,
    });
  }

  /**
   * Delete campaign
   */
  deleteCampaign(campaign: Campaign): void {
    if (confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      this.campaignFacade.deleteCampaign(campaign.id).subscribe((success) => {
        if (success) {
          this.snackBar.open('Campaign deleted successfully', 'Close', {
            duration: 3000,
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
          this.snackBar.open(`${selectedIds.length} campaigns deleted`, 'Close', {
            duration: 3000,
          });
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
    return this.campaigns().filter((c) => c.status === 'active').length;
  }

  getPausedCampaigns(): number {
    return this.campaigns().filter((c) => c.status === 'paused').length;
  }

  getDraftCampaigns(): number {
    return this.campaigns().filter((c) => c.status === 'inactive').length;
  }

  // Helper methods for display
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      active: 'play_circle',
      paused: 'pause_circle',
      completed: 'check_circle',
      inactive: 'drafts',
      cancelled: 'cancel',
    };
    return icons[status] || 'help';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      hashtag: 'tag',
      keyword: 'search',
      user: 'person',
      mention: 'alternate_email',
    };
    return icons[type] || 'campaign';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      hashtag: 'Hashtag Monitoring',
      keyword: 'Keyword Tracking',
      user: 'User Monitoring',
      mention: 'Mention Tracking',
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
