/**
 * Campaign Service - Business Logic Layer
 * Inspired by the service architecture from SentimentalSocialNextJS
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Campaign } from '../state/app.state';
import { ICampaignRepository } from '../interfaces/repositories.interface';
import { ApiResponse as CoreApiResponse, PaginatedResponse as CorePaginatedResponse } from '../types';

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
export class CampaignService implements ICampaignRepository {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/campaigns`;

  /**
   * Get campaign by ID - Implementation of IBaseRepository
   */
  getById(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.get<ApiResponse<Campaign>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new campaign - Implementation of IBaseRepository
   */
  create(campaignData: Partial<Campaign>): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.baseUrl, campaignData);
  }

  /**
   * Update existing campaign - Implementation of IBaseRepository
   */
  update(id: string, updateData: Partial<Campaign>): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.baseUrl}/${id}`, updateData);
  }

  /**
   * Delete campaign - Implementation of IBaseRepository
   */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get all campaigns with filtering and pagination - Implementation of ICampaignRepository
   */
  getAll(
    filter: CampaignFilter = {},
    page: number = 1,
    pageSize: number = 10
  ): Observable<ApiResponse<PaginatedResponse<Campaign>>> {
    const params: any = { page, pageSize, ...filter };
    return this.http.get<ApiResponse<PaginatedResponse<Campaign>>>(this.baseUrl, { params });
  }

  /**
   * Start campaign data collection - Implementation of ICampaignRepository
   */
  start(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(`${this.baseUrl}/${id}/start`, {});
  }

  /**
   * Stop campaign data collection - Implementation of ICampaignRepository
   */
  stop(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(`${this.baseUrl}/${id}/stop`, {});
  }

  /**
   * Get campaign statistics - Implementation of ICampaignRepository
   */
  getStats(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${id}/stats`);
  }
}
