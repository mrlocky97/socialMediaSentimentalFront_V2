/**
 * Scraping Dispatch Service
 * Handles dispatching scraping operations based on campaign type
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Campaign as AppStateCampaign } from '../state/app.state';
import { Campaign as DataManagerCampaign } from './data-manager.service';
import { ScrapingService } from './scraping.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ScrapingDispatchService {
  private readonly scrapingService = inject(ScrapingService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Convert AppStateCampaign to DataManagerCampaign format
   * This is needed because the scraping service expects the DataManager format
   */
  private convertToDataManagerCampaign(campaign: AppStateCampaign): DataManagerCampaign {
    // Create a compatible campaign object for scraping service
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || '', // Ensure description is not undefined
      type: this.mapCampaignType(campaign.type),
      status: this.mapCampaignStatus(campaign.status),
      hashtags: campaign.hashtags,
      keywords: campaign.keywords,
      mentions: campaign.mentions || [],
      startDate: new Date(campaign.startDate),
      endDate: new Date(campaign.endDate),
      organizationId: campaign.organizationId,
      dataSources: campaign.dataSources || ['twitter'],
      languages: campaign.languages || ['es'],
      stats: {
        totalTweets: campaign.stats?.totalTweets || 0,
        averageSentiment: campaign.stats?.avgSentiment || 0,
        sentimentDistribution: {
          positive: campaign.stats?.sentimentDistribution?.positive || 0,
          negative: campaign.stats?.sentimentDistribution?.negative || 0,
          neutral: campaign.stats?.sentimentDistribution?.neutral || 0
        },
        engagementRate: 0,
        reachEstimate: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date(campaign.createdAt)
    };
  }
  
  /**
   * Map AppState campaign type to DataManager campaign type
   */
  private mapCampaignType(type: string): 'brand-monitoring' | 'competitor-analysis' | 'market-research' {
    switch (type) {
      case 'hashtag':
      case 'brand-monitoring':
        return 'brand-monitoring';
      case 'keyword':
      case 'competitor-analysis':
        return 'competitor-analysis';
      case 'user':
      case 'mention':
      case 'market-research':
        return 'market-research';
      default:
        return 'brand-monitoring';
    }
  }
  
  /**
   * Map AppState campaign status to DataManager campaign status
   */
  private mapCampaignStatus(status: string): 'draft' | 'active' | 'paused' | 'completed' {
    switch (status) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'draft';
      case 'paused':
        return 'paused';
      case 'completed':
        return 'completed';
      default:
        return 'draft';
    }
  }

  /**
   * Dispatch scraping based on campaign type
   * @param campaign - Campaign to scrape data for
   * @returns Observable that completes when scraping is done
   */
  public dispatchScraping(campaign: AppStateCampaign): Observable<boolean> {
    // Log the scraping dispatch
    console.log(`Dispatching scraping for campaign type: ${campaign.type}`);
    
    // Show notification to user
    this.snackBar.open(`Starting scraping for ${campaign.name}...`, 'Close', { duration: 3000 });
    
    // Convert campaign to the format expected by ScrapingService
    const convertedCampaign = this.convertToDataManagerCampaign(campaign);
    
    // Dispatch based on campaign type
    switch (campaign.type) {
      case 'hashtag':
        return this.scrapingService.startScraping(convertedCampaign);
      
      case 'user':
      case 'mention':
        return this.dispatchUserScraping(convertedCampaign);
      
      case 'keyword':
        return this.dispatchKeywordScraping(convertedCampaign);
      
      // For types defined in data-manager.service.ts
      case 'brand-monitoring':
        return this.dispatchBrandMonitoringScraping(convertedCampaign);
        
      case 'competitor-analysis':
        return this.dispatchCompetitorAnalysisScraping(convertedCampaign);
        
      case 'market-research':
        return this.dispatchMarketResearchScraping(convertedCampaign);
        
      default:
        // Default to standard scraping for unknown types
        console.warn(`Unknown campaign type: ${campaign.type}, using default scraping method`);
        return this.scrapingService.startScraping(convertedCampaign);
    }
  }
  
  /**
   * Specialized scraping for user/mention based campaigns
   * Prioritizes user/mention data over other fields
   */
  private dispatchUserScraping(campaign: DataManagerCampaign): Observable<boolean> {
    console.log('Dispatching user/mention focused scraping');
    // Currently using the same implementation but can be extended
    return this.scrapingService.startScraping(campaign);
  }
  
  /**
   * Specialized scraping for keyword based campaigns
   * Prioritizes keyword searches over hashtags
   */
  private dispatchKeywordScraping(campaign: DataManagerCampaign): Observable<boolean> {
    console.log('Dispatching keyword focused scraping');
    // Currently using the same implementation but can be extended
    return this.scrapingService.startScraping(campaign);
  }
  
  /**
   * Specialized scraping for brand monitoring campaigns
   */
  private dispatchBrandMonitoringScraping(campaign: DataManagerCampaign): Observable<boolean> {
    console.log('Dispatching brand monitoring scraping');
    // Currently using the same implementation but can be extended
    return this.scrapingService.startScraping(campaign);
  }
  
  /**
   * Specialized scraping for competitor analysis campaigns
   */
  private dispatchCompetitorAnalysisScraping(campaign: DataManagerCampaign): Observable<boolean> {
    console.log('Dispatching competitor analysis scraping');
    // Currently using the same implementation but can be extended
    return this.scrapingService.startScraping(campaign);
  }
  
  /**
   * Specialized scraping for market research campaigns
   */
  private dispatchMarketResearchScraping(campaign: DataManagerCampaign): Observable<boolean> {
    console.log('Dispatching market research scraping');
    // Currently using the same implementation but can be extended
    return this.scrapingService.startScraping(campaign);
  }
}
