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

    return this.campaignService.getCampaigns(filter).pipe(
      map(response => {
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

    return this.campaignService.createCampaign(campaignData).pipe(
      map(response => {
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

    return this.campaignService.updateCampaign(id, updateData).pipe(
      map(response => {
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
    
    return this.campaignService.getCampaignById(campaignId).pipe(
      map(response => {
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
    
    return this.campaignService.startCampaign(campaignId).pipe(
      map(response => {
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
    
    return this.campaignService.stopCampaign(campaignId).pipe(
      map(response => {
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
   * Clear all errors
   */
  clearError(): void {
    this.appState.clearError();
  }
}
