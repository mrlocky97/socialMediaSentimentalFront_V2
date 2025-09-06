/**
 * Tweet Service - API calls for tweet data
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Tweet, TweetFilter, TweetsResponse } from '../interfaces/tweet.interface';

@Injectable({
  providedIn: 'root'
})
export class TweetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly apiVersion = environment.apiVersion || 'v1';

  /**
   * Get tweets for a specific campaign
   */
  getTweetsByCampaign(
    campaignId: string, 
    filter: TweetFilter = { page: 1, limit: 20 }
  ): Observable<TweetsResponse> {
    let params = new HttpParams();
    
    // Add pagination
    if (filter.page) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.limit) {
      params = params.set('limit', filter.limit.toString());
    }
    
    // Add optional filters
    if (filter.sentiment) {
      params = params.set('sentiment', filter.sentiment);
    }
    if (filter.language) {
      params = params.set('language', filter.language);
    }
    if (filter.isRetweet !== undefined) {
      params = params.set('isRetweet', filter.isRetweet.toString());
    }
    if (filter.dateFrom) {
      params = params.set('dateFrom', filter.dateFrom);
    }
    if (filter.dateTo) {
      params = params.set('dateTo', filter.dateTo);
    }

    const url = `${this.baseUrl}/api/${this.apiVersion}/campaigns/${campaignId}/tweets`;
    
    return this.http.get<TweetsResponse>(url, { params });
  }

  /**
   * Get a specific tweet by ID
   */
  getTweetById(tweetId: string): Observable<Tweet> {
    const url = `${this.baseUrl}/api/${this.apiVersion}/tweets/${tweetId}`;
    return this.http.get<Tweet>(url);
  }

  /**
   * Search tweets across all campaigns
   */
  searchTweets(
    query: string, 
    filter: TweetFilter = { page: 1, limit: 20 }
  ): Observable<TweetsResponse> {
    let params = new HttpParams();
    params = params.set('q', query);
    
    if (filter.page) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.limit) {
      params = params.set('limit', filter.limit.toString());
    }

    const url = `${this.baseUrl}/api/${this.apiVersion}/tweets/search`;
    return this.http.get<TweetsResponse>(url, { params });
  }

  /**
   * Get tweet analytics for a campaign
   */
  getTweetAnalytics(campaignId: string): Observable<any> {
    const url = `${this.baseUrl}/api/${this.apiVersion}/campaigns/${campaignId}/tweets/analytics`;
    return this.http.get(url);
  }
}
