/**
 * Scraping Effects - NgRx effects for scraping operations
 */
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { BackendApiService } from '../../services/backend-api.service';
import { ScrapingDispatchService } from '../../services/scraping-dispatch.service';
import * as ScrapingActions from '../actions/scraping.actions';

@Injectable()
export class ScrapingEffects {
  private actions$ = inject(Actions);
  private apiService = inject(BackendApiService);
  private scrapingDispatchService = inject(ScrapingDispatchService);

  constructor() {}

  // Effect to handle hashtag scraping
  hashtagScraping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.hashtagScraping),
      switchMap(({ campaign }) => {
        console.log('ScrapingEffects: Processing hashtag scraping for campaign:', campaign);
        
        // Verificar que la campaña tenga hashtags
        if (!campaign.hashtags || campaign.hashtags.length === 0) {
          console.error('Campaign has no hashtags:', campaign);
          return of(ScrapingActions.hashtagScrapingFailure({ 
            error: new Error('Campaign has no hashtags defined') 
          }));
        }
        
        return this.apiService.scrapeHashtags(
          campaign.hashtags,
          {
            campaignId: campaign.id,
            analyzeSentiment: campaign.sentimentAnalysis || true,
            limit: campaign.maxTweets || 20,
            language: (campaign.languages && campaign.languages.length > 0) 
              ? campaign.languages[0] 
              : 'en'
          }
        ).pipe(
          map((response) => {
            console.log('Hashtag scraping success response:', response);
            return ScrapingActions.hashtagScrapingSuccess({ campaignId: campaign.id });
          }),
          catchError((error) => {
            console.error('Hashtag scraping error:', error);
            return of(ScrapingActions.hashtagScrapingFailure({ error }));
          })
        );
      })
    )
  );
}
