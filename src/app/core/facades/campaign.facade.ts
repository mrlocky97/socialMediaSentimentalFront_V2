/**
 * Campaign Facade - Coordinates between services and state
 * Simplifies component interaction following the Facade pattern from NextJS project
 */
import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { CampaignService, CreateCampaignRequest, UpdateCampaignRequest, CampaignFilter, ApiResponse, PaginatedResponse } from '../services/campaign.service';
import { AppStateService, Campaign } from '../state/app.state';

@Injectable({
  providedIn: 'root'
})
export class CampaignFacade {
  private campaignService = inject(CampaignService);
  private appState = inject(AppStateService);

  // Expose state selectors
  readonly campaigns$ = this.appState.campaigns;
  readonly selectedCampaign$ = this.appState.selectedCampaign;
  readonly activeCampaigns$ = this.appState.activeCampaigns;
  readonly loading$ = this.appState.loading;
  readonly error$ = this.appState.error;

  /**
   * Load campaigns from API and update state
   */
  loadCampaigns(filter: CampaignFilter = {}): Observable<Campaign[]> {
    this.appState.setLoading(true);
    this.appState.clearError();

    return this.campaignService.getAll(filter).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.setCampaigns(response.data.data);
          return response.data.data;
        }
        return [];
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error loading campaigns: ' + error.message);
        this.appState.setLoading(false);
        return of([]);
      })
    );
  }

  /**
   * Create new campaign
   */
  createCampaign(campaignData: CreateCampaignRequest): Observable<Campaign | null> {
    this.appState.setLoading(true);
    this.appState.clearError();

    // Convert CreateCampaignRequest to Partial<Campaign>
    const campaignPayload: Partial<Campaign> = {
      name: campaignData.name,
      description: campaignData.description,
      type: campaignData.type,
      hashtags: campaignData.hashtags,
      keywords: campaignData.keywords,
      mentions: campaignData.mentions,
      startDate: new Date(campaignData.startDate),
      endDate: new Date(campaignData.endDate),
      maxTweets: campaignData.maxTweets,
      sentimentAnalysis: campaignData.sentimentAnalysis
    };

    return this.campaignService.create(campaignPayload).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.addCampaign(response.data);
          return response.data;
        }
        return null;
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error creating campaign: ' + error.message);
        this.appState.setLoading(false);
        return of(null);
      })
    );
  }

  /**
   * Update existing campaign
   */
  updateCampaign(id: string, updateData: UpdateCampaignRequest): Observable<Campaign | null> {
    this.appState.setLoading(true);
    this.appState.clearError();

    // Convert UpdateCampaignRequest to Partial<Campaign>
    const campaignPayload: Partial<Campaign> = {
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.description && { description: updateData.description }),
      ...(updateData.hashtags && { hashtags: updateData.hashtags }),
      ...(updateData.keywords && { keywords: updateData.keywords }),
      ...(updateData.mentions && { mentions: updateData.mentions }),
      ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
      ...(updateData.maxTweets && { maxTweets: updateData.maxTweets }),
      ...(updateData.sentimentAnalysis !== undefined && { sentimentAnalysis: updateData.sentimentAnalysis })
    };

    return this.campaignService.update(id, campaignPayload).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.updateCampaign(response.data);
          return response.data;
        }
        return null;
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error updating campaign: ' + error.message);
        this.appState.setLoading(false);
        return of(null);
      })
    );
  }

  /**
   * Select campaign for detailed view
   */
  selectCampaign(campaignId: string): Observable<Campaign | null> {
    this.appState.setLoading(true);
    
    return this.campaignService.getById(campaignId).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.setSelectedCampaign(response.data);
          return response.data;
        }
        return null;
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error loading campaign details: ' + error.message);
        this.appState.setLoading(false);
        return of(null);
      })
    );
  }

  /**
   * Clear selected campaign
   */
  clearSelectedCampaign(): void {
    this.appState.setSelectedCampaign(null);
  }

  /**
   * Start campaign data collection
   */
  startCampaign(campaignId: string): Observable<boolean> {
    this.appState.setLoading(true);
    
    return this.campaignService.start(campaignId).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.updateCampaign(response.data);
          return true;
        }
        return false;
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error starting campaign: ' + error.message);
        this.appState.setLoading(false);
        return of(false);
      })
    );
  }

  /**
   * Stop campaign data collection
   */
  stopCampaign(campaignId: string): Observable<boolean> {
    this.appState.setLoading(true);
    
    return this.campaignService.stop(campaignId).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.updateCampaign(response.data);
          return true;
        }
        return false;
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error stopping campaign: ' + error.message);
        this.appState.setLoading(false);
        return of(false);
      })
    );
  }

  /**
   * Delete campaign (soft delete)
   */
  deleteCampaign(campaignId: string): Observable<boolean> {
    this.appState.setLoading(true);
    
    return this.campaignService.delete(campaignId).pipe(
      map((response: any) => {
        if (response.success) {
          this.appState.removeCampaign(campaignId);
          return true;
        }
        return false;
      }),
      tap(() => this.appState.setLoading(false)),
      catchError(error => {
        this.appState.setError('Error deleting campaign: ' + error.message);
        this.appState.setLoading(false);
        return of(false);
      })
    );
  }

  /**
   * Clear all errors
   */
  clearError(): void {
    this.appState.clearError();
  }
}
