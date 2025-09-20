import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { BackendApiService } from '../../../core/services/backend-api.service';
import { Campaign } from '../../../core/state/app.state';
import { CampaignFacade } from '../../../core/store/fecades/campaign.facade';
import { ScrapingFacade } from '../../../core/store/fecades/scraping.facade';

import {
  TableAction,
  TableColumn,
  TableConfig,
} from '../../../shared/components/solid-data-table/interfaces/solid-data-table.interface';
import { SolidDataTableRxjsComponent } from '../../../shared/components/solid-data-table/solid-data-table.component';
import { CampaignDialogComponent } from '../../campaign-dialog/campaign-dialog.component';
import { CampaignRequest } from '../../campaign-dialog/interfaces/campaign-dialog.interface';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog.component';
import { BulkActionConfig, CampaignStats, StatConfig } from './interfaces/campaign-list.interface';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TranslocoModule,
    SolidDataTableRxjsComponent,
    MatDialogModule,
  ],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css'],
})
export class CampaignListComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  // Injected services - usando solo NgRx facade
  private readonly backendApiService = inject(BackendApiService);
  private readonly campaignFacade = inject(CampaignFacade);
  private readonly scrapingFacade = inject(ScrapingFacade);
  private readonly dialogRef = inject(MatDialog);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // NgRx Observables - reemplazando signals
  readonly campaigns$ = this.campaignFacade.campaigns$;
  readonly loading$ = this.campaignFacade.loading$;
  readonly error$ = this.campaignFacade.error$;
  readonly campaignStats$ = this.campaignFacade.campaignStats$;
  readonly totalCount$ = this.campaignFacade.totalCount$;
  readonly hasItems$ = this.campaignFacade.hasItems$;

  // Local signals para UI state
  readonly selectedCampaigns = signal<Set<string>>(new Set());
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(10);

  // Filter form
  readonly filterForm: FormGroup;

  // Configuration arrays for template iteration
  readonly statsConfig: StatConfig[] = [
    {
      key: 'total',
      icon: 'campaign',
      iconClass: '',
      labelKey: 'campaign_list.total_campaigns',
    },
    {
      key: 'active',
      icon: 'play_circle',
      iconClass: 'active',
      labelKey: 'campaign_list.campaign_actives',
    },
    {
      key: 'paused',
      icon: 'pause_circle',
      iconClass: 'warning',
      labelKey: 'campaign_list.campaigns_pause',
    },
    {
      key: 'draft',
      icon: 'drafts',
      iconClass: 'draft',
      labelKey: 'campaign_list.campaigns_draft',
    },
  ];

  readonly bulkActions: BulkActionConfig[] = [
    {
      key: 'pause',
      icon: 'pause',
      labelKey: 'campaign_list.pause',
    },
    {
      key: 'resume',
      icon: 'play_arrow',
      labelKey: 'campaign_list.resume',
    },
    {
      key: 'delete',
      icon: 'delete',
      labelKey: 'campaign_list.delete',
      cssClass: 'danger-action',
      requiresConfirmation: true,
    },
  ];

  // Generic table config for SolidDataTable
  readonly tableColumns: TableColumn<Campaign>[] = [
    { key: 'name', label: 'Campaign', sortable: true, width: '250px' },
    { key: 'status', label: 'Status', sortable: true, width: '150px' },
    { key: 'type', label: 'Type', sortable: true, width: '140px' },
    {
      key: 'hashtags',
      label: 'Hashtags',
      sortable: false,
      width: '200px',
      formatter: (v: string[]) => (v || []).slice(0, 2).join(', '),
    },
    {
      key: 'startDate',
      label: 'Start',
      sortable: true,
      width: '120px',
      formatter: (v: Date) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'endDate',
      label: 'End',
      sortable: true,
      width: '120px',
      formatter: (v: Date) => new Date(v).toLocaleDateString(),
    },
  ];

  readonly tableConfig: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: true,
    multiSelection: true,
    pageSize: 5,
  };

  readonly tableActions: TableAction<Campaign>[] = [
    { icon: 'visibility', label: 'View', color: 'primary' },
    { icon: 'edit', label: 'Edit', color: 'primary' },
    { icon: 'delete', label: 'Delete', color: 'warn', confirm: true },
  ];

  // Computed values con NgRx observables
  readonly hasSelectedCampaigns = computed(() => this.selectedCampaigns().size > 0);

  // For template compatibility - using signals for sync computed values
  readonly filteredCampaigns = computed(() => {
    // For now, return empty array.
    // This should be connected to actual filter logic and campaigns observable later
    // We'll use the async pipe in template for campaigns$ directly
    return [];
  });

  constructor() {
    // Initialize filter form
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      type: [[]],
      platforms: [[]],
    });

    // Setup search debouncing using effect
    effect(() => {
      this.filterForm
        .get('search')
        ?.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe();
    });
  }

  ngOnInit(): void {
    this.loadCampaigns();
    // Con NgRx no necesitamos subscribeToFacade ya que usamos observables directamente
  }

  ngOnDestroy(): void {}

  /**
   * Eliminamos subscribeToFacade ya que ahora usamos observables directamente en el template
   */

  /**
   * Get fallback demo data
   */
  private getFallbackCampaigns(): Campaign[] {
    return [
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
        organizationId: 'default-org',
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
        organizationId: 'default-org',
      },
    ];
  }

  /**
   * Get statistic value by key - ahora usando observable
   */
  getStatValue(key: keyof CampaignStats): number {
    // Para simplificar, usaremos fallback values hasta que el template use async pipe
    return 0; // TODO: Usar async pipe en template para campaignStats$
  }

  /**
   * Load campaigns
   */
  loadCampaigns(): void {
    this.campaignFacade.loadCampaigns();
  }

  /**
   * Navigate to create campaign
   */
  navigateToCreateCampaign(): void {
    const dialogRef = this.dialogRef.open(CampaignDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxHeight: '100vh',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'campaign-wizard-dialog',
      data: {
        mode: 'create',
        title: this.transloco.translate('campaigns.create.title'),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.mode === 'create') {
          this.handleCampaignCreation(result);
        }
      });
  }

  /**
   * Handle campaign creation
   */
  private handleCampaignCreation(result: {
    payload: CampaignRequest;
    mode: string;
    id: string | null;
  }): void {
    this.campaignFacade.createCampaign(result.payload).subscribe({
      next: (action) => {
        if (action.type === '[Campaign] Create Campaign Success') {
          this.showSuccessMessage('campaigns.create.success');
          const campaignId: string = action.campaign?.id;
          if (campaignId) {
            this.router.navigate(['/dashboard/campaigns/campaign-detail', campaignId]);
          } else {
            console.error('No campaign ID found after creation!');
          }
        }
      },
      error: (error) => {
        this.showErrorMessage('campaigns.create.error');
        console.error('Campaign creation error:', error);
      },
    });
  }

  /**
   * Handler for row click from generic table
   */
  navigateToCampaign(item: Campaign): void {
    if (item?.id) {
      this.router.navigate(['/dashboard/campaigns/campaign-detail', item.id]);
    }
  }

  /**
   * Handler for action clicks from generic table
   */
  onTableAction(event: { action: TableAction<Campaign>; item: Campaign }): void {
    const { action, item } = event;

    const actionHandlers: Record<string, (item: Campaign) => void> = {
      view: this.viewCampaign.bind(this),
      edit: this.editCampaign.bind(this),
      delete: this.deleteCampaign.bind(this),
    };

    const handler = actionHandlers[action.label.toLowerCase()];
    if (handler) {
      handler(item);
    } else {
      this.snackBar.open(`${action.label} clicked`, 'Close', { duration: 2000 });
    }
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
   * Toggle all campaigns selection - simplificado para NgRx
   */
  toggleAllSelection(): void {
    // Simplificado: limpiar selección o necesitaríamos subscribirnos a campaigns$
    this.selectedCampaigns.set(new Set());
  }

  /**
   * View campaign in read-only mode
   */
  viewCampaign(campaign: Campaign): void {
    this.navigateToCampaign(campaign);
  }

  /**
   * Edit campaign
   */
  editCampaign(campaign: Campaign): void {
    const dialogRef = this.dialogRef.open(CampaignDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxHeight: '100vh',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'campaign-wizard-dialog',
      data: {
        mode: 'edit',
        title: this.transloco.translate('campaigns.edit.title'),
        campaignId: campaign.id,
        preset: this.mapCampaignToPreset(campaign),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.mode === 'edit' && result.id) {
          this.handleCampaignUpdate(result);
        }
      });
  }

  /**
   * Map campaign to preset format
   */
  private mapCampaignToPreset(campaign: Campaign): Partial<Campaign> {
    return {
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      dataSources: campaign.dataSources,
      hashtags: campaign.hashtags,
      keywords: campaign.keywords,
      mentions: campaign.mentions,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      timezone: campaign.timezone,
      maxTweets: campaign.maxTweets,
      collectImages: campaign.collectImages,
      collectVideos: campaign.collectVideos,
      collectReplies: campaign.collectReplies,
      collectRetweets: campaign.collectRetweets,
      languages: campaign.languages,
      sentimentAnalysis: campaign.sentimentAnalysis,
      emotionAnalysis: campaign.emotionAnalysis,
      topicsAnalysis: campaign.topicsAnalysis,
      influencerAnalysis: campaign.influencerAnalysis,
      organizationId: campaign.organizationId,
    };
  }

  /**
   * Handle campaign update
   */
  private handleCampaignUpdate(result: any): void {
    this.campaignFacade
      .updateCampaign({
        id: result.id,
        ...result.payload,
      })
      .subscribe({
        next: (action) => {
          if (action.type === '[Campaign] Update Campaign Success') {
            this.showSuccessMessage('campaigns.edit.success', { name: result.payload.name });
          }
        },
        error: (error) => {
          this.showErrorMessage('campaigns.edit.error', { name: result.payload.name });
          console.error('Campaign update error:', error);
        },
      });
  }

  /**
   * Delete campaign
   */
  deleteCampaign(campaign: Campaign): void {
    const dialogRef = this.dialogRef.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: {
        name: campaign.name,
        id: campaign.id,
        type: 'campaign',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.handleCampaignDeletion(campaign);
        }
      });
  }

  /**
   * Handle campaign deletion - usando solo NgRx
   */
  private handleCampaignDeletion(campaign: Campaign): void {
    this.campaignFacade.deleteCampaign(campaign.id).subscribe({
      next: (action) => {
        if (action.type === '[Campaign] Delete Campaign Success') {
          this.showSuccessMessage('campaigns.delete.success', { name: campaign.name });
        } else if ('error' in action) {
          this.showErrorMessage('campaigns.delete.error', {
            name: campaign.name,
            error: action.error?.message || 'Unknown error',
          });
        }
      },
      error: (error) => {
        this.showErrorMessage('campaigns.delete.error', {
          name: campaign.name,
          error: error?.message || 'Unknown error',
        });
      },
    });
  }

  /**
   * Bulk actions
   */
  bulkAction(action: BulkActionConfig['key']): void {
    const selectedIds = Array.from(this.selectedCampaigns());
    if (selectedIds.length === 0) return;

    const actionHandlers: Record<BulkActionConfig['key'], (ids: string[]) => void> = {
      pause: this.handleBulkPause.bind(this),
      resume: this.handleBulkResume.bind(this),
      delete: this.handleBulkDelete.bind(this),
    };

    const handler = actionHandlers[action];
    if (handler) {
      handler(selectedIds);
    }
  }

  /**
   * Handle bulk pause
   */
  private handleBulkPause(selectedIds: string[]): void {
    selectedIds.forEach((id) => {
      this.campaignFacade.stopCampaign(id);
    });

    this.snackBar.open(`${selectedIds.length} campaigns paused`, 'Close', { duration: 3000 });
    this.selectedCampaigns.set(new Set());
  }

  /**
   * Handle bulk resume
   */
  private handleBulkResume(selectedIds: string[]): void {
    selectedIds.forEach((id) => {
      this.campaignFacade.startCampaign(id);
    });

    this.snackBar.open(`${selectedIds.length} campaigns resumed`, 'Close', { duration: 3000 });
    this.selectedCampaigns.set(new Set());
  }

  /**
   * Handle bulk delete
   */
  private handleBulkDelete(selectedIds: string[]): void {
    const dialogRef = this.dialogRef.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: {
        name: `${selectedIds.length} campaigns`,
        id: 'bulk',
        type: 'campaigns',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processBulkDeletion(selectedIds);
        }
      });
  }

  /**
   * Process bulk deletion - usando solo NgRx
   */
  private processBulkDeletion(selectedIds: string[]): void {
    let completedCount = 0;

    selectedIds.forEach((id) => {
      this.campaignFacade.deleteCampaign(id).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === selectedIds.length) {
            this.snackBar.open(`${selectedIds.length} campaigns deleted successfully`, 'Close', {
              duration: 3000,
              panelClass: 'success-snackbar',
            });
            this.selectedCampaigns.set(new Set());
          }
        },
        error: () => {
          completedCount++;
          if (completedCount === selectedIds.length) {
            // All operations completed (with some errors)
          }
        },
      });
    });
  }

  /**
   * Start scraping based on campaign type
   */
  private startScraping(result: any): void {
    if (!result?.payload?.type) {
      console.error('Invalid result structure for scraping');
      return;
    }

    const normalizedResult = this.normalizeScrapingResult(result);
    const scrapingHandlers: Record<string, (result: any) => void> = {
      hashtag: (r) =>
        this.handleScrapingAction(this.scrapingFacade.startHashtagScraping(r), 'hashtag'),
      keyword: (r) =>
        this.handleScrapingAction(this.scrapingFacade.startKeywordScraping(r), 'keyword'),
      user: (r) => this.handleScrapingAction(this.scrapingFacade.startUserScraping(r), 'user'),
      mention: (r) => {
        return this.handleScrapingAction(this.scrapingFacade.startUserScraping(r), 'user'); // Las campañas mention usan el scraper de usuarios
      },
    };

    const handler = scrapingHandlers[normalizedResult.payload.type];
    if (handler) {
      handler(normalizedResult);
    } else {
      console.warn('Unknown campaign type for scraping:', normalizedResult.payload.type);
    }
  }

  /**
   * Normalize scraping result structure
   */
  private normalizeScrapingResult(result: any): any {
    if (result.id && result.payload?.type) {
      return result;
    }

    if (result.payload?.id) {
      return {
        id: result.payload.id,
        payload: result.payload,
      };
    }

    return result;
  }

  /**
   * Handle scraping action
   */
  private handleScrapingAction(scrapingObservable: any, type: string): void {
    scrapingObservable.subscribe({
      next: (response: any) => {
        console.log(`${type} scraping started successfully:`, response);
        this.showSuccessMessage('campaigns.create.scraping_started');
      },
      error: (error: Error) => {
        console.error(`Error in ${type} scraping:`, error);
        this.handleScrapingError(error, type);
      },
    });
  }

  /**
   * Handle scraping errors
   */
  private handleScrapingError(error: any, type: string): void {
    this.showErrorMessage('campaigns.create.scraping_error', {
      error: error?.message || 'Unknown error',
    });
    console.error(`Error starting ${type} scraping:`, error);
  }

  // Helper methods for display
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      active: 'play_circle',
      paused: 'pause_circle',
      completed: 'check_circle',
      inactive: 'drafts',
      cancelled: 'cancel',
    };
    return icons[status] || 'help';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      hashtag: 'tag',
      keyword: 'search',
      user: 'person',
      mention: 'alternate_email',
    };
    return icons[type] || 'campaign';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
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

  // Legacy compatibility methods
  getTotalCampaigns(): number {
    return this.getStatValue('total');
  }

  getActiveCampaigns(): number {
    return this.getStatValue('active');
  }

  getPausedCampaigns(): number {
    return this.getStatValue('paused');
  }

  getDraftCampaigns(): number {
    return this.getStatValue('draft');
  }

  /**
   * Show success message
   */
  private showSuccessMessage(messageKey: string, params?: Record<string, any>): void {
    const message = this.transloco.translate(messageKey, params);
    this.snackBar.open(message, this.transloco.translate('common.close'), {
      duration: 3000,
      panelClass: 'success-snackbar',
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(messageKey: string, params?: Record<string, any>): void {
    const message = this.transloco.translate(messageKey, params);
    this.snackBar.open(message, this.transloco.translate('common.close'), {
      duration: 5000,
      panelClass: 'error-snackbar',
    });
  }
}
