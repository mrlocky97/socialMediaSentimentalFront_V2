/**
 * Campaign Service - Consolidated Business Logic Layer
 * Unified service combining all campaign-related functionality
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL, ApiUrlBuilder } from '../api/api.config';
import { ICampaignRepository } from '../interfaces/repositories.interface';
import { Campaign } from '../state/app.state';
import { CampaignType } from '../types';

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: 'hashtag' | 'user' | 'keyword' | 'mention';
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: string;
  endDate: string;
  maxTweets: number;
  sentimentAnalysis: boolean;
  organizationId?: string;
  platforms?: string[];
  tags?: string[];
}

export interface UpdateCampaignRequest {
  id: string;
  name?: string;
  description?: string;
  hashtags?: string[];
  keywords?: string[];
  mentions?: string[];
  endDate?: string;
  maxTweets?: number;
  sentimentAnalysis?: boolean;
  platforms?: string[];
  tags?: string[];
}

export interface CampaignFilter {
  status?: ('active' | 'inactive' | 'completed' | 'paused' | 'draft')[];
  type?: ('hashtag' | 'user' | 'keyword' | 'mention')[];
  platforms?: string[];
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  organizationId?: string;
}

export interface CampaignSortOptions {
  field: keyof Campaign;
  direction: 'asc' | 'desc';
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface CampaignMetrics {
  totalTweets: number;
  positiveSentiment: number;
  negativeSentiment: number;
  neutralSentiment: number;
  engagementRate: number;
  reach: number;
  impressions: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService implements ICampaignRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL, { optional: true }) || 'http://localhost:3000';
  private readonly apiBuilder = new ApiUrlBuilder(this.baseUrl);

  // State management with RxJS BehaviorSubject
  private readonly campaignsSubject = new BehaviorSubject<Campaign[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public readonly campaigns$ = this.campaignsSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  /**
   * Get campaign by ID - Implementation of IBaseRepository
   */
  getById(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.get<ApiResponse<Campaign>>(this.apiBuilder.campaigns.byId(id));
  }

  /**
   * Create new campaign - Implementation of IBaseRepository
   */
  create(campaignData: Partial<Campaign>): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.apiBuilder.campaigns.create(), campaignData);
  }

  /**
   * Update existing campaign - Implementation of IBaseRepository
   */
  update(id: string, updateData: Partial<Campaign>): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(this.apiBuilder.campaigns.update(id), updateData);
  }

  /**
   * Delete campaign - Implementation of IBaseRepository
   */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(this.apiBuilder.campaigns.delete(id));
  }

  /**
   * Get all campaigns with filtering and pagination - Enhanced implementation
   */
  getAll(
    filter: CampaignFilter = {},
    page: number = 1,
    pageSize: number = 10,
    sort?: CampaignSortOptions
  ): Observable<ApiResponse<PaginatedResponse<Campaign>>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams()
  .set('page', page.toString())
  // Some backends expect the parameter name 'limit' instead of 'pageSize' (Postman example).
  // We set both to be compatible with either convention.
  .set('pageSize', pageSize.toString())
  .set('limit', pageSize.toString());

    // Apply filters
    if (filter.status?.length) {
      params = params.set('status', filter.status.join(','));
    }
    if (filter.type?.length) {
      params = params.set('type', filter.type.join(','));
    }
    if (filter.platforms?.length) {
      params = params.set('platforms', filter.platforms.join(','));
    }
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.dateRange) {
      params = params.set('startDate', filter.dateRange.start.toISOString());
      params = params.set('endDate', filter.dateRange.end.toISOString());
    }
    if (filter.tags?.length) {
      params = params.set('tags', filter.tags.join(','));
    }
    if (filter.organizationId) {
      params = params.set('organizationId', filter.organizationId);
    }

    // Apply sorting
    if (sort) {
      params = params.set('sortBy', sort.field.toString())
                   .set('sortDirection', sort.direction);
    }

    return this.http.get<ApiResponse<PaginatedResponse<Campaign>>>(this.apiBuilder.campaigns.list(), { params })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.campaignsSubject.next(response.data.data);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.handleError('Error loading campaigns', error);
          return of({
            success: false,
            data: {
              data: [],
              total: 0,
              page,
              pageSize,
              totalPages: 0
            }
          });
        })
      );
  }

  /**
   * Start campaign data collection - Implementation of ICampaignRepository
   */
  start(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.apiBuilder.campaigns.start(id), {});
  }

  /**
   * Stop campaign data collection - Implementation of ICampaignRepository
   */
  stop(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.apiBuilder.campaigns.stop(id), {});
  }

  /**
   * Get campaign statistics - Implementation of ICampaignRepository
   */
  getStats(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(this.apiBuilder.campaigns.stats(id));
  }

  /**
   * Get real-time campaign metrics
   */
  getCampaignMetrics(id: string): Observable<CampaignMetrics | null> {
    return this.http.get<CampaignMetrics>(this.apiBuilder.campaigns.metrics(id))
      .pipe(
        catchError(error => {
          console.error('Error loading campaign metrics:', error);
          return of(null);
        })
      );
  }

  /**
   * Update campaign status
   */
  updateCampaignStatus(id: string, status: string): Observable<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch<ApiResponse<Campaign>>(this.apiBuilder.campaigns.update(id), { status })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const currentCampaigns = this.campaignsSubject.value;
            const index = currentCampaigns.findIndex(c => c.id === id);
            if (index !== -1) {
              currentCampaigns[index] = response.data;
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
   * Bulk operations
   */
  bulkUpdateStatus(campaignIds: string[], status: string): Observable<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch(this.apiBuilder.campaigns.bulkStatus(), {
      campaignIds,
      status
    }).pipe(
      map(() => {
        // Update local state
        const currentCampaigns = this.campaignsSubject.value;
        const updatedCampaigns = currentCampaigns.map(campaign =>
          campaignIds.includes(campaign.id)
            ? { ...campaign, status: status as any, updatedAt: new Date() }
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

    return this.http.post<ApiResponse<Campaign>>(this.apiBuilder.campaigns.duplicate(id), { name: newName })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const currentCampaigns = this.campaignsSubject.value;
            this.campaignsSubject.next([response.data, ...currentCampaigns]);
            this.loadingSubject.next(false);
            return response.data;
          }
          return null;
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
