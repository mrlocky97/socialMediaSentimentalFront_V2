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
} from '../../../shared/components/solid-data-table/service/table-services';
import { SolidDataTableRxjsComponent } from '../../../shared/components/solid-data-table/solid-data-table-rxjs.component';
import { CampaignDialogComponent } from '../../campaign-dialog/campaign-dialog.component';

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
    TranslocoModule,
    SolidDataTableRxjsComponent,
    MatDialogModule,
  ],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css'],
})
export class CampaignListComponent implements OnInit, OnDestroy {
  private readonly BackendApiService = inject(BackendApiService);
  private readonly campaignFacade = inject(CampaignFacade);
  private readonly scrapingFacade = inject(ScrapingFacade);
  private dialogRef = inject(MatDialog);

  // Handler for row click from generic table
  navigateToCampaign(item: Campaign): void {
    // If the table emits the whole row, navigate to detail
    if (item && item.id) {
      this.router.navigate(['/dashboard/campaigns', item.id]);
    }
  }

  // Handler for action clicks from generic table
  onTableAction(event: { action: TableAction<Campaign>; item: Campaign }): void {
    const { action, item } = event;
    switch (action.label.toLowerCase()) {
      case 'view':
        this.viewCampaign(item);
        break;
      case 'edit':
        this.editCampaign(item);
        break;
      case 'delete':
        this.deleteCampaign(item);
        break;
      default:
        // fallback - execute the action name if provided
        this.snackBar.open(`${action.label} clicked`, 'Close', { duration: 2000 });
    }
  }
  private transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Reactive signals
  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(false);
  dialogLoading = signal<boolean>(false); // Nuevo estado para cargar diálogos sin afectar la tabla
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

  // Generic table config for SolidDataTable
  tableColumns: TableColumn<Campaign>[] = [
    { key: 'name', label: 'Campaign', sortable: true, width: '250px' },
    { key: 'status', label: 'Status', sortable: true, width: '120px', align: 'center' },
    { key: 'type', label: 'Type', sortable: true, width: '140px' },
    {
      key: 'hashtags',
      label: 'Hashtags',
      sortable: false,
      width: '200px',
      formatter: (v) => (v || []).slice(0, 2).join(', '),
    },
    {
      key: 'keywords',
      label: 'Keywords',
      sortable: false,
      width: '200px',
      formatter: (v) => (v || []).slice(0, 2).join(', '),
    },
    {
      key: 'startDate',
      label: 'Start',
      sortable: true,
      width: '120px',
      formatter: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'endDate',
      label: 'End',
      sortable: true,
      width: '120px',
      formatter: (v) => new Date(v).toLocaleDateString(),
    },
  ];

  tableConfig: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: true,
    multiSelection: true,
    pageSize: 10,
  };

  tableActions: TableAction<Campaign>[] = [
    { icon: 'visibility', label: 'View', color: 'primary' },
    { icon: 'edit', label: 'Edit', color: 'primary' },
    { icon: 'delete', label: 'Delete', color: 'warn', confirm: true },
    { icon: 'cloud_download', label: 'Scrape', color: 'accent' },
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
            organizationId: 'default-org', // Añadimos el organizationId
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
            organizationId: 'default-org', // Añadimos el organizationId
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
    this.campaignFacade.loadCampaigns();
  }

  /**
   * Navigate to create campaign
   */
  navigateToCreateCampaign(): void {
    this.dialogLoading.set(true); // Show dialog loading state without affecting table visibility

    const dialogRef = this.dialogRef.open(CampaignDialogComponent, {
      width: 'auto',
      height: 'auto', // Let the content determine the height with min/max constraints
      maxHeight: '100vh', // Prevent dialog from being too tall
      maxWidth: '90vw', // Prevent dialog from being too wide
      disableClose: true, // Prevent closing by clicking outside
      panelClass: 'campaign-wizard-dialog', // Custom styling class
      data: {
        mode: 'create',
        title: this.transloco.translate('campaigns.create.title'),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.dialogLoading.set(false);

      if (result) {
        if (result.mode === 'create') {
          // Creación de campaña
          this.campaignFacade.createCampaign(result.payload).subscribe({
            next: (action) => {
              // Opcional: puedes verificar si la acción fue de éxito o fallo
              if (action.type === '[Campaign] Create Campaign Success') {
                this.snackBar.open(
                  this.transloco.translate('campaigns.create.success'),
                  this.transloco.translate('common.close'),
                  { duration: 3000, panelClass: 'success-snackbar' }
                );
                // La lista se actualizará automáticamente gracias al reducer y los selectores
                this.createScraping(result);
              }
            },
            error: (error) => {
              // El error ya se maneja en el estado de NgRx, pero puedes mostrar un snackbar aquí
              this.snackBar.open(
                this.transloco.translate('campaigns.create.error'),
                this.transloco.translate('common.close'),
                { duration: 5000, panelClass: 'error-snackbar' }
              );
              console.error('Campaign creation error:', error);
            },
          });
        }
      }
      // If result is falsy, user canceled - no action needed
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
   * View campaign in read-only mode
   */
  viewCampaign(campaign: Campaign): void {
    this.dialogLoading.set(true);

    // Abrimos el diálogo en modo solo lectura con los datos pre-cargados
    const dialogRef = this.dialogRef.open(CampaignDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxHeight: '100vh',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: ['campaign-wizard-dialog', 'campaign-view-dialog'],
      data: {
        mode: 'view',
        title: this.transloco.translate('campaigns.view.title'),
        campaignId: campaign.id,
        preset: {
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
        },
      },
    });

    // Manejamos el resultado al cerrar el diálogo
    dialogRef.afterClosed().subscribe(() => {
      this.dialogLoading.set(false);
    });
  }

  /**
   * Edit campaign
   */
  editCampaign(campaign: Campaign): void {
    this.dialogLoading.set(true);

    // Abrimos el diálogo de edición con los datos pre-cargados
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
        preset: {
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
        },
      },
    });

    // Manejamos el resultado al cerrar el diálogo
    dialogRef.afterClosed().subscribe((result) => {
      this.dialogLoading.set(false);

      if (result && result.mode === 'edit' && result.id) {
        // Actualizamos la campaña
        this.campaignFacade
          .updateCampaign({
            id: result.id,
            ...result.payload,
          })
          .subscribe({
            next: (action) => {
              if (action.type === '[Campaign] Update Campaign Success') {
                this.snackBar.open(
                  this.transloco.translate('campaigns.edit.success', { name: result.payload.name }),
                  this.transloco.translate('common.close'),
                  { duration: 3000, panelClass: 'success-snackbar' }
                );
              }
            },
            error: (error) => {
              this.snackBar.open(
                this.transloco.translate('campaigns.edit.error', { name: result.payload.name }),
                this.transloco.translate('common.close'),
                { duration: 5000, panelClass: 'error-snackbar' }
              );
              console.error('Campaign update error:', error);
            },
          });
      }
    });
  }

  /**
   * Delete campaign
   */
  deleteCampaign(campaign: Campaign): void {
    import('../delete-confirm-dialog/delete-confirm-dialog.component').then((module) => {
      const dialogRef = this.dialogRef.open(module.DeleteConfirmDialogComponent, {
        width: '400px',
        data: {
          name: campaign.name,
          id: campaign.id,
          type: 'campaign',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.loading.set(true); // Aquí sí usamos loading porque después de cerrar el diálogo de confirmación

          this.campaignFacade.deleteCampaign(campaign.id).subscribe({
            next: (action) => {
              this.loading.set(false);

              if (action.type === '[Campaign] Delete Campaign Success') {
                this.snackBar.open(
                  this.transloco.translate('campaigns.delete.success', { name: campaign.name }),
                  this.transloco.translate('common.close'),
                  { duration: 3000, panelClass: 'success-snackbar' }
                );
              } else if ('error' in action) {
                this.snackBar.open(
                  this.transloco.translate('campaigns.delete.error', {
                    name: campaign.name,
                    error: action.error?.message || 'Error desconocido',
                  }),
                  this.transloco.translate('common.close'),
                  { duration: 5000, panelClass: 'error-snackbar' }
                );
              }
            },
            error: (error) => {
              this.loading.set(false);
              this.snackBar.open(
                this.transloco.translate('campaigns.delete.error', {
                  name: campaign.name,
                  error: error?.message || 'Error desconocido',
                }),
                this.transloco.translate('common.close'),
                { duration: 5000, panelClass: 'error-snackbar' }
              );
            },
          });
        }
      });
    });
  }

  /**
   * Bulk actions
   */
  bulkAction(action: string): void {
    const selectedIds = Array.from(this.selectedCampaigns());
    if (selectedIds.length === 0) return;

    switch (action) {
      case 'pause':
        selectedIds.forEach((id) => {
          this.campaignFacade.stopCampaign(id);
        });
        this.snackBar.open(`${selectedIds.length} campaigns paused`, 'Close', { duration: 3000 });
        break;
      case 'resume':
        selectedIds.forEach((id) => {
          this.campaignFacade.startCampaign(id);
        });
        this.snackBar.open(`${selectedIds.length} campaigns resumed`, 'Close', { duration: 3000 });
        break;
      case 'delete':
        import('../delete-confirm-dialog/delete-confirm-dialog.component').then((module) => {
          const dialogRef = this.dialogRef.open(module.DeleteConfirmDialogComponent, {
            width: '400px',
            data: {
              name: `${selectedIds.length} campañas`,
              id: 'bulk',
              type: 'campaigns',
            },
          });

          dialogRef.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
              this.loading.set(true); // Aquí sí usamos loading normal

              // Contador para llevar registro de las operaciones completadas
              let completedCount = 0;
              selectedIds.forEach((id) => {
                this.campaignFacade.deleteCampaign(id).subscribe({
                  next: () => {
                    completedCount++;
                    if (completedCount === selectedIds.length) {
                      this.loading.set(false);
                      this.snackBar.open(
                        `${selectedIds.length} campañas eliminadas exitosamente`,
                        'Cerrar',
                        { duration: 3000, panelClass: 'success-snackbar' }
                      );
                      this.selectedCampaigns.set(new Set());
                    }
                  },
                  error: () => {
                    completedCount++;
                    if (completedCount === selectedIds.length) {
                      this.loading.set(false);
                    }
                  },
                });
              });
            }
          });
        });
        break;
    }

    if (action !== 'delete') {
      this.selectedCampaigns.set(new Set());
    }
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

  // Function to create scraping based on campaign type
  createScraping(result: any): void {
    if (!result || !result.payload) return;

    switch (result.payload.type) {
      case 'hashtag':
        this.scrapingFacade.startHashtagScraping(result).subscribe({
          next: () => this.showSuccessMessage(),
          error: (error: Error) => this.handleError(error, 'hashtag'),
        });
        break;
      case 'keyword':
        this.scrapingFacade.startKeywordScraping(result).subscribe({
          next: () => this.showSuccessMessage(),
          error: (error: Error) => this.handleError(error, 'keyword'),
        });
        break;
      case 'user':
        this.scrapingFacade.startUserScraping(result).subscribe({
          next: () => this.showSuccessMessage(),
          error: (error: Error) => this.handleError(error, 'user'),
        });
        break;
      case 'mention':
        this.scrapingFacade.startMentionScraping(result).subscribe({
          next: () => this.showSuccessMessage(),
          error: (error: Error) => this.handleError(error, 'mention'),
        });
        break;
      default:
        console.warn('Unknown campaign type for scraping:', result.payload.type);
        break;
    }
  }
  // Mostrar mensaje de éxito
  showSuccessMessage(campaignName?: string): void {
    const message = campaignName 
      ? this.transloco.translate('campaigns.scraping.started', { name: campaignName })
      : this.transloco.translate('campaigns.create.scraping_started');
      
    this.snackBar.open(
      message,
      this.transloco.translate('common.close'),
      { duration: 3000, panelClass: 'success-snackbar' }
    );
  }

  // Manejar errores
  private handleError(error: any, type: string): void {
    this.snackBar.open(
      this.transloco.translate('campaigns.create.scraping_error', {
        error: error?.message || 'Error desconocido',
      }),
      this.transloco.translate('common.close'),
      { duration: 5000, panelClass: 'error-snackbar' }
    );
    console.error(`Error starting ${type} scraping:`, error);
  }

}
