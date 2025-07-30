/**
 * Campaign Service - Business Logic Layer
 * Inspired by the service architecture from SentimentalSocialNextJS
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Campaign } from '../state/app.state';

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: 'hashtag' | 'user' | 'keyword';
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: string;
  endDate: string;
  maxTweets: number;
  sentimentAnalysis: boolean;
  organizationId?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  hashtags?: string[];
  keywords?: string[];
  mentions?: string[];
  endDate?: string;
  maxTweets?: number;
  sentimentAnalysis?: boolean;
}

export interface CampaignFilter {
  status?: 'active' | 'inactive' | 'completed';
  type?: 'hashtag' | 'user' | 'keyword';
  organizationId?: string;
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
export class CampaignService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/campaigns`;

  /**
   * Get all campaigns with filtering and pagination
   */
  getCampaigns(
    filter: CampaignFilter = {},
    page: number = 1,
    pageSize: number = 10
  ): Observable<ApiResponse<PaginatedResponse<Campaign>>> {
    const params: any = { page, pageSize, ...filter };
    return this.http.get<ApiResponse<PaginatedResponse<Campaign>>>(this.baseUrl, { params });
  }

  /**
   * Get campaign by ID
   */
  getCampaignById(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.get<ApiResponse<Campaign>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new campaign
   */
  createCampaign(campaignData: CreateCampaignRequest): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.baseUrl, campaignData);
  }

  /**
   * Update existing campaign
   */
  updateCampaign(id: string, updateData: UpdateCampaignRequest): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.baseUrl}/${id}`, updateData);
  }

  /**
   * Delete campaign
   */
  deleteCampaign(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Start campaign data collection
   */
  startCampaign(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(`${this.baseUrl}/${id}/start`, {});
  }

  /**
   * Stop campaign data collection
   */
  stopCampaign(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(`${this.baseUrl}/${id}/stop`, {});
  }

  /**
   * Get campaign statistics
   */
  getCampaignStats(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${id}/stats`);
  }
}
