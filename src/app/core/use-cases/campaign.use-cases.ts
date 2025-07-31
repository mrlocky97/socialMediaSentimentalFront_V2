/**
 * Use Cases - Application Business Logic
 * Following Clean Architecture principles and Single Responsibility
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { ICampaignRepository } from '../interfaces/repositories.interface';
import { CampaignService } from '../services/campaign.service';
import { Campaign, PaginatedResponse } from '../types';

/**
 * Base Use Case abstract class
 * Provides common functionality for all use cases
 */
export abstract class BaseUseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Observable<TResponse>;
}

/**
 * Get Campaigns Use Case
 * Single responsibility: Retrieve and filter campaigns
 */
@Injectable({
  providedIn: 'root'
})
export class GetCampaignsUseCase extends BaseUseCase<GetCampaignsRequest, Campaign[]> {
  private campaignRepository = inject(CampaignService) as ICampaignRepository;

  execute(request: GetCampaignsRequest): Observable<Campaign[]> {
    return this.campaignRepository.getAll(request.filter, request.page, request.pageSize)
      .pipe(
        map(response => response.data.data),
        catchError(error => {
          console.error('Error loading campaigns:', error);
          return of([]);
        })
      );
  }
}

/**
 * Create Campaign Use Case
 * Single responsibility: Campaign creation business logic
 */
@Injectable({
  providedIn: 'root'
})
export class CreateCampaignUseCase extends BaseUseCase<CreateCampaignRequest, Campaign | null> {
  private campaignRepository = inject(CampaignService) as ICampaignRepository;

  execute(request: CreateCampaignRequest): Observable<Campaign | null> {
    // Business rules validation
    if (!this.validateCampaignData(request)) {
      return of(null);
    }

    return this.campaignRepository.create(request)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error creating campaign:', error);
          return of(null);
        })
      );
  }

  private validateCampaignData(data: CreateCampaignRequest): boolean {
    return !!(data.name && 
             data.type && 
             data.startDate && 
             data.endDate &&
             new Date(data.endDate) > new Date(data.startDate));
  }
}

/**
 * Start Campaign Use Case
 * Single responsibility: Campaign activation business logic
 */
@Injectable({
  providedIn: 'root'
})
export class StartCampaignUseCase extends BaseUseCase<string, boolean> {
  private campaignRepository = inject(CampaignService) as ICampaignRepository;

  execute(campaignId: string): Observable<boolean> {
    return this.campaignRepository.start(campaignId)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error starting campaign:', error);
          return of(false);
        })
      );
  }
}

/**
 * Stop Campaign Use Case
 * Single responsibility: Campaign deactivation business logic
 */
@Injectable({
  providedIn: 'root'
})
export class StopCampaignUseCase extends BaseUseCase<string, boolean> {
  private campaignRepository = inject(CampaignService) as ICampaignRepository;

  execute(campaignId: string): Observable<boolean> {
    return this.campaignRepository.stop(campaignId)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error stopping campaign:', error);
          return of(false);
        })
      );
  }
}

// Request/Response interfaces for use cases
export interface GetCampaignsRequest {
  filter?: any;
  page?: number;
  pageSize?: number;
}

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
