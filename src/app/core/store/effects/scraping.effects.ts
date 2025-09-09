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
          return of(
            ScrapingActions.hashtagScrapingFailure({
              error: new Error('Campaign has no hashtags defined'),
            })
          );
        }

        // Preparar el payload completo de la campaña para el endpoint
        const scrapingPayload = {
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          dataSources: campaign.dataSources || ['twitter'],
          hashtags: campaign.hashtags,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          maxTweets: campaign.maxTweets || 10,
          collectImages: campaign.collectImages !== undefined ? campaign.collectImages : true,
          collectReplies: campaign.collectReplies !== undefined ? campaign.collectReplies : false,
          collectRetweets: campaign.collectRetweets !== undefined ? campaign.collectRetweets : true,
          collectVideos: campaign.collectVideos !== undefined ? campaign.collectVideos : true,
          languages: campaign.languages || 'en',
          sentimentAnalysis:
            campaign.sentimentAnalysis !== undefined ? campaign.sentimentAnalysis : true,
          emotionAnalysis:
            campaign.emotionAnalysis !== undefined ? campaign.emotionAnalysis : false,
          topicsAnalysis: campaign.topicsAnalysis !== undefined ? campaign.topicsAnalysis : false,
          influencerAnalysis:
            campaign.influencerAnalysis !== undefined ? campaign.influencerAnalysis : false,
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
        };

        console.log('Sending hashtag scraping payload:', scrapingPayload);

        // Pasar el payload completo en lugar de solo los hashtags
        return this.apiService.scrapeHashtags(scrapingPayload).pipe(
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
