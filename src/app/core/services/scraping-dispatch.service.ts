/**
 * Scraping Dispatch Service
 * Handles dispatching scraping operations based on campaign type using NgRx
 */

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { Campaign as AppStateCampaign } from '../state/app.state';
import { ScrapingFacade } from '../store/fecades/scraping.facade';

@Injectable({
  providedIn: 'root',
})
export class ScrapingDispatchService {
  private readonly scrapingFacade = inject(ScrapingFacade);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Dispatch scraping based on campaign type using NgRx
   * @param campaign - Campaign to scrape data for
   * @returns Observable that completes when scraping is done
   */
  public dispatchScraping(campaign: AppStateCampaign): Observable<boolean> {
    // Show notification to user
    this.snackBar.open(`Starting scraping for ${campaign.name}...`, 'Close', { duration: 3000 });

    // Dispatch based on campaign type using NgRx facade
    switch (campaign.type) {
      case 'hashtag':
        if (campaign.hashtags && campaign.hashtags.length > 0) {
          // Crear objeto compatible con la validación del facade
          const campaignResult = {
            id: campaign.id,
            payload: campaign,
          };
          this.scrapingFacade.startHashtagScraping(campaignResult);
        }
        break;

      case 'user':
      case 'mention':
        if (campaign.mentions && campaign.mentions.length > 0) {
          // Crear objeto compatible con la validación del facade
          const campaignResult = {
            id: campaign.id,
            payload: campaign,
          };
          this.scrapingFacade.startUserScraping(campaignResult);
        }
        break;

      case 'keyword':
        if (campaign.keywords && campaign.keywords.length > 0) {
          // Crear objeto compatible con la validación del facade
          const campaignResult = {
            id: campaign.id,
            payload: campaign,
          };
          this.scrapingFacade.startKeywordScraping(campaignResult);
        }
        break;

      default:
        if (campaign.hashtags && campaign.hashtags.length > 0) {
          this.scrapingFacade.startHashtagScraping(campaign.hashtags);
        }
        break;
    }

    // Return success observable since NgRx handles the async operations
    return of(true);
  }
}
