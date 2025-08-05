/* =====================================
   CAMPAIGN MANAGEMENT SERVICE
   Enterprise-grade API service with RxJS
   ===================================== */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, delay, map, of, tap } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import {
  Campaign,
  CampaignFilters,
  CampaignListResponse,
  CampaignMetrics,
  CampaignSortOptions,
  CampaignStatus,
  CreateCampaignRequest,
  UpdateCampaignRequest
} from '../models/campaign.model';
import { mockCampaigns } from './campaign-mock.data';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campaigns`;

  // State management with signals pattern
  private readonly campaignsSubject = new BehaviorSubject<Campaign[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public readonly campaigns$ = this.campaignsSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  /**
   * Get paginated list of campaigns with filters and sorting
   */
  getCampaigns(
    page: number = 1,
    pageSize: number = 10,
    filters?: CampaignFilters,
    sort?: CampaignSortOptions
  ): Observable<CampaignListResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // For development: Use mock data
    return of(mockCampaigns).pipe(
      delay(800), // Simulate network delay
      map(campaigns => {
        // Apply filters
        let filteredCampaigns = campaigns;

        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(searchTerm) ||
            campaign.description.toLowerCase().includes(searchTerm) ||
            campaign.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }

        if (filters?.status?.length) {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            filters.status!.includes(campaign.status)
          );
        }

        if (filters?.type?.length) {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            filters.type!.includes(campaign.type)
          );
        }

        if (filters?.platforms?.length) {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            campaign.platforms.some(platform => filters.platforms!.includes(platform))
          );
        }

        // Apply sorting
        if (sort) {
          filteredCampaigns.sort((a, b) => {
            const aValue = a[sort.field] as any;
            const bValue = b[sort.field] as any;

            let comparison = 0;
            if (aValue > bValue) comparison = 1;
            if (aValue < bValue) comparison = -1;

            return sort.direction === 'desc' ? -comparison : comparison;
          });
        }

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

        const response: CampaignListResponse = {
          campaigns: paginatedCampaigns,
          totalCount: filteredCampaigns.length,
          page,
          pageSize,
          hasNext: endIndex < filteredCampaigns.length
        };

        return response;
      }),
      tap(response => {
        this.campaignsSubject.next(response.campaigns);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.handleError('Error loading campaigns', error);
        return of({
          campaigns: [],
          totalCount: 0,
          page,
          pageSize,
          hasNext: false
        });
      })
    );

    /* TODO: Uncomment when backend is ready
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Apply filters
    if (filters) {
      if (filters.status?.length) {
        params = params.set('status', filters.status.join(','));
      }
      if (filters.type?.length) {
        params = params.set('type', filters.type.join(','));
      }
      if (filters.platforms?.length) {
        params = params.set('platforms', filters.platforms.join(','));
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString());
        params = params.set('endDate', filters.dateRange.end.toISOString());
      }
      if (filters.tags?.length) {
        params = params.set('tags', filters.tags.join(','));
      }
    }

    // Apply sorting
    if (sort) {
      params = params.set('sortBy', sort.field.toString())
                   .set('sortDirection', sort.direction);
    }

    return this.http.get<CampaignListResponse>(`${this.baseUrl}`, { params })
      .pipe(
        tap(response => {
          this.campaignsSubject.next(response.campaigns);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.handleError('Error loading campaigns', error);
          return of({
            campaigns: [],
            totalCount: 0,
            page,
            pageSize,
            hasNext: false
          });
        })
      );
    */
  }

  /**
   * Get single campaign by ID
   */
  getCampaignById(id: string): Observable<Campaign | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<Campaign>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.handleError(`Error loading campaign ${id}`, error);
          return of(null);
        })
      );
  }

  /**
   * Create new campaign
   */
  createCampaign(campaignData: CreateCampaignRequest): Observable<Campaign | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<Campaign>(`${this.baseUrl}`, campaignData)
      .pipe(
        tap(newCampaign => {
          if (newCampaign) {
            const currentCampaigns = this.campaignsSubject.value;
            this.campaignsSubject.next([newCampaign, ...currentCampaigns]);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.handleError('Error creating campaign', error);
          return of(null);
        })
      );
  }

  /**
   * Update existing campaign
   */
  updateCampaign(campaignData: UpdateCampaignRequest): Observable<Campaign | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<Campaign>(`${this.baseUrl}/${campaignData.id}`, campaignData)
      .pipe(
        tap(updatedCampaign => {
          if (updatedCampaign) {
            const currentCampaigns = this.campaignsSubject.value;
            const index = currentCampaigns.findIndex(c => c.id === updatedCampaign.id);
            if (index !== -1) {
              currentCampaigns[index] = updatedCampaign;
              this.campaignsSubject.next([...currentCampaigns]);
            }
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.handleError('Error updating campaign', error);
          return of(null);
        })
      );
  }

  /**
   * Update campaign status
   */
  updateCampaignStatus(id: string, status: CampaignStatus): Observable<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch<Campaign>(`${this.baseUrl}/${id}/status`, { status })
      .pipe(
        map(updatedCampaign => {
          if (updatedCampaign) {
            const currentCampaigns = this.campaignsSubject.value;
            const index = currentCampaigns.findIndex(c => c.id === id);
            if (index !== -1) {
              currentCampaigns[index] = updatedCampaign;
              this.campaignsSubject.next([...currentCampaigns]);
            }
            this.loadingSubject.next(false);
            return true;
          }
          return false;
        }),
        catchError(error => {
          this.handleError('Error updating campaign status', error);
          return of(false);
        })
      );
  }

  /**
   * Delete campaign
   */
  deleteCampaign(id: string): Observable<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => {
          const currentCampaigns = this.campaignsSubject.value;
          const filteredCampaigns = currentCampaigns.filter(c => c.id !== id);
          this.campaignsSubject.next(filteredCampaigns);
          this.loadingSubject.next(false);
          return true;
        }),
        catchError(error => {
          this.handleError('Error deleting campaign', error);
          return of(false);
        })
      );
  }

  /**
   * Get real-time campaign metrics
   */
  getCampaignMetrics(id: string): Observable<CampaignMetrics | null> {
    return this.http.get<CampaignMetrics>(`${this.baseUrl}/${id}/metrics`)
      .pipe(
        catchError(error => {
          console.error('Error loading campaign metrics:', error);
          return of(null);
        })
      );
  }

  /**
   * Bulk operations
   */
  bulkUpdateStatus(campaignIds: string[], status: CampaignStatus): Observable<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch(`${this.baseUrl}/bulk/status`, {
      campaignIds,
      status
    }).pipe(
      map(() => {
        // Update local state
        const currentCampaigns = this.campaignsSubject.value;
        const updatedCampaigns = currentCampaigns.map(campaign =>
          campaignIds.includes(campaign.id)
            ? { ...campaign, status, updatedAt: new Date() }
            : campaign
        );
        this.campaignsSubject.next(updatedCampaigns);
        this.loadingSubject.next(false);
        return true;
      }),
      catchError(error => {
        this.handleError('Error bulk updating campaigns', error);
        return of(false);
      })
    );
  }

  /**
   * Duplicate campaign
   */
  duplicateCampaign(id: string, newName: string): Observable<Campaign | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<Campaign>(`${this.baseUrl}/${id}/duplicate`, { name: newName })
      .pipe(
        tap(duplicatedCampaign => {
          if (duplicatedCampaign) {
            const currentCampaigns = this.campaignsSubject.value;
            this.campaignsSubject.next([duplicatedCampaign, ...currentCampaigns]);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.handleError('Error duplicating campaign', error);
          return of(null);
        })
      );
  }

  /**
   * Clear current campaigns state
   */
  clearCampaigns(): void {
    this.campaignsSubject.next([]);
    this.errorSubject.next(null);
  }

  /**
   * Private error handler
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorSubject.next(message);
    this.loadingSubject.next(false);
  }
}
