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

  // Effect to handle user scraping
  userScraping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.userScraping),
      switchMap(({ campaign }) => {
        // Verificar que la campaña tenga mentions (usuarios)
        if (!campaign.mentions || campaign.mentions.length === 0) {
          console.error('❌ Campaign has no mentions/users:', campaign);
          return of(
            ScrapingActions.userScrapingFailure({
              error: new Error('Campaign has no mentions/users defined'),
            })
          );
        }

        // Preparar el payload completo de la campaña para el endpoint
        const scrapingPayload = {
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          dataSources: campaign.dataSources || ['twitter'],
          mentions: campaign.mentions,
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
        // Usar el endpoint scrapeUsers para el scraping de usuarios
        return this.apiService
          .scrapeUsers(scrapingPayload.mentions, {
            ...scrapingPayload,
          })
          .pipe(
            map((response) => {
              return ScrapingActions.userScrapingSuccess({ campaignId: campaign.id });
            }),
            catchError((error) => {
              console.error('User scraping error:', error);
              return of(ScrapingActions.userScrapingFailure({ error }));
            })
          );
      })
    )
  );

  // Effect to handle mention scraping
  mentionScraping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.mentionScraping),
      switchMap(({ campaign }) => {
        // Verificar que la campaña tenga mentions
        if (!campaign.mentions || campaign.mentions.length === 0) {
          console.error('Campaign has no mentions:', campaign);
          return of(
            ScrapingActions.mentionScrapingFailure({
              error: new Error('Campaign has no mentions defined'),
            })
          );
        }

        // Preparar el payload completo de la campaña para el endpoint
        const scrapingPayload = {
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          dataSources: campaign.dataSources || ['twitter'],
          mentions: campaign.mentions,
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

        // Usar el endpoint scrapeUsers para menciones también, ya que son similares
        return this.apiService
          .scrapeUsers(scrapingPayload.mentions, {
            ...scrapingPayload,
          })
          .pipe(
            map((response) => {
              return ScrapingActions.mentionScrapingSuccess({ campaignId: campaign.id });
            }),
            catchError((error) => {
              console.error('Mention scraping error:', error);
              return of(ScrapingActions.mentionScrapingFailure({ error }));
            })
          );
      })
    )
  );

  // Effect to handle keyword scraping
  keywordScraping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.keywordScraping),
      switchMap(({ campaign }) => {
        // Verificar que la campaña tenga keywords
        if (!campaign.keywords || campaign.keywords.length === 0) {
          console.error('Campaign has no keywords:', campaign);
          return of(
            ScrapingActions.keywordScrapingFailure({
              error: new Error('Campaign has no keywords defined'),
            })
          );
        }

        // Preparar el payload completo de la campaña para el endpoint
        const scrapingPayload = {
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          dataSources: campaign.dataSources || ['twitter'],
          keywords: campaign.keywords,
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

        // Usar el endpoint scrapeSearch para keywords
        return this.apiService
          .scrapeSearch(scrapingPayload.keywords, {
            ...scrapingPayload,
          })
          .pipe(
            map((response) => {
              return ScrapingActions.keywordScrapingSuccess({ campaignId: campaign.id });
            }),
            catchError((error) => {
              console.error('Keyword scraping error:', error);
              return of(ScrapingActions.keywordScrapingFailure({ error }));
            })
          );
      })
    )
  );
}
