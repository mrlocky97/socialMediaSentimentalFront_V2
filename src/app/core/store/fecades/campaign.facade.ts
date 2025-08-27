/**
 * Campaign Facade - Simplified delegation layer
 * Delegates to the consolidated CampaignService for all operations
 */
import { Injectable, inject } from '@angular/core';
import { ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, map, take, tap } from 'rxjs';
import { CampaignRequest } from '../../../features/campaign-dialog/interfaces/campaign-dialog.interface';
import {
  CampaignFilter,
  CampaignService,
  CampaignSortOptions,
  UpdateCampaignRequest
} from '../../services/campaign.service';
import { Campaign } from '../../state/app.state';

@Injectable({
  providedIn: 'root',
})
export class CampaignFacade {
  private readonly campaignService = inject(CampaignService);

  // Expose service observables directly
  readonly campaigns$ = this.campaignService.campaigns$;
  readonly loading$ = this.campaignService.loading$;
  readonly error$ = this.campaignService.error$;

  // Additional observables for backward compatibility
  readonly selectedCampaign$ = new BehaviorSubject<Campaign | null>(null);

  constructor(private store: Store) {}

  /**
   * Select campaign (for backward compatibility)
   */
  selectCampaign(campaignId: string): Observable<Campaign | null> {
    return this.getCampaignById(campaignId).pipe(
      tap((campaign: Campaign | null) => this.selectedCampaign$.next(campaign))
    );
  }

  /**
   * Load campaigns from API
   */
  loadCampaigns(
    filter: CampaignFilter = {},
    page: number = 1,
    pageSize: number = 10,
    sort?: CampaignSortOptions
  ): Observable<Campaign[]> {
    return this.campaignService
      .getAll(filter, page, pageSize, sort)
      .pipe(map((response) => (response.success ? response.data.data : [])));
  }

  /**
   * Despacha la acción para crear una campaña.
   * Devuelve un observable para que el componente pueda reaccionar al éxito o error.
   */
  createCampaign(campaign: CampaignRequest): Observable<any> {
    this.store.dispatch(CampaignActions.createCampaign({ campaign }));

    // Devuelve un observable que se completa cuando la acción de éxito o fallo es despachada
    return this.actions$.pipe(
      ofType(CampaignActions.createCampaignSuccess, CampaignActions.createCampaignFailure),
      take(1) // Solo nos interesa la primera respuesta
    );
  }

  /**
   * Update existing campaign
   */
  updateCampaign(updateData: UpdateCampaignRequest): Observable<Campaign | null> {
    const { id, ...data } = updateData;

    // Convert UpdateCampaignRequest to Partial<Campaign>
    const campaignPayload: Partial<Campaign> = {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.hashtags && { hashtags: data.hashtags }),
      ...(data.keywords && { keywords: data.keywords }),
      ...(data.mentions && { mentions: data.mentions }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.maxTweets && { maxTweets: data.maxTweets }),
      ...(data.sentimentAnalysis !== undefined && { sentimentAnalysis: data.sentimentAnalysis }),
    };

    return this.campaignService
      .update(id, campaignPayload)
      .pipe(map((response) => (response.success ? response.data : null)));
  }

  /**
   * Get campaign by ID
   */
  getCampaignById(id: string): Observable<Campaign | null> {
    return this.campaignService
      .getById(id)
      .pipe(map((response) => (response.success ? response.data : null)));
  }

  /**
   * Start campaign data collection
   */
  startCampaign(campaignId: string): Observable<boolean> {
    return this.campaignService.start(campaignId).pipe(map((response) => response.success));
  }

  /**
   * Stop campaign data collection
   */
  stopCampaign(campaignId: string): Observable<boolean> {
    return this.campaignService.stop(campaignId).pipe(map((response) => response.success));
  }

  /**
   * Delete campaign
   */
  deleteCampaign(campaignId: string): Observable<boolean> {
    return this.campaignService.delete(campaignId).pipe(map((response) => response.success));
  }

  /**
   * Update campaign status
   */
  updateCampaignStatus(id: string, status: string): Observable<boolean> {
    return this.campaignService.updateCampaignStatus(id, status);
  }

  /**
   * Bulk operations
   */
  bulkUpdateStatus(campaignIds: string[], status: string): Observable<boolean> {
    return this.campaignService.bulkUpdateStatus(campaignIds, status);
  }

  /**
   * Duplicate campaign
   */
  duplicateCampaign(id: string, newName: string): Observable<Campaign | null> {
    return this.campaignService.duplicateCampaign(id, newName);
  }

  /**
   * Get campaign metrics
   */
  getCampaignMetrics(id: string): Observable<any> {
    return this.campaignService.getCampaignMetrics(id);
  }

  /**
   * Clear campaigns state
   */
  clearCampaigns(): void {
    this.campaignService.clearCampaigns();
  }
}
