/**
 * Scraping Effects - NgRx effects for scraping operations
 */
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdvancedScrapingService } from '../../services/advanced-scraping.service';
import { BackendApiService } from '../../services/backend-api.service';
import { ScrapingDispatchService } from '../../services/scraping-dispatch.service';
import * as ScrapingActions from '../actions/scraping.actions';

@Injectable()
export class ScrapingEffects {
  private actions$ = inject(Actions);
  private apiService = inject(BackendApiService);
  private scrapingDispatchService = inject(ScrapingDispatchService);
  private advancedScrapingService = inject(AdvancedScrapingService);

  constructor() {}

  // Effect to handle advanced job creation - POST /api/v1/scraping/advanced/job
  createAdvancedJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.createAdvancedJob),
      switchMap(({ jobData }) => {
        console.log('🔥 ScrapingEffects: Creating advanced job with data:', jobData);
        console.log('🔧 About to call advancedScrapingService.createJob()');

        return this.advancedScrapingService.createJob(jobData).pipe(
          map((response) => {
            console.log('✅ Advanced job creation success response:', response);
            const successAction = ScrapingActions.createAdvancedJobSuccess({ response, jobData });
            console.log('📨 Dispatching success action:', successAction.type, successAction);
            return successAction;
          }),
          catchError((error) => {
            console.error('💥 Advanced job creation error:', error);
            const failureAction = ScrapingActions.createAdvancedJobFailure({ error });
            console.log('📨 Dispatching failure action:', failureAction.type, failureAction);
            return of(failureAction);
          })
        );
      })
    )
  );

  // Effect to load jobs - GET /api/v1/scraping/advanced/jobs
  loadJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.loadJobs),
      switchMap(() => {
        console.log('ScrapingEffects: Loading jobs');

        return this.advancedScrapingService.loadJobs().pipe(
          map((response) => {
            console.log('Load jobs success response:', response);
            return ScrapingActions.loadJobsSuccess({ jobs: response.jobs });
          }),
          catchError((error) => {
            console.error('Load jobs error:', error);
            return of(ScrapingActions.loadJobsFailure({ error }));
          })
        );
      })
    )
  );

  // Effect to get job progress - GET /api/v1/scraping/advanced/job/{jobId}
  getJobProgress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.getJobProgress),
      switchMap(({ jobId }) => {
        console.log('ScrapingEffects: Getting job progress for:', jobId);

        return this.advancedScrapingService.getJobProgress(jobId).pipe(
          map((progress) => {
            console.log('Get job progress success response:', progress);
            return ScrapingActions.getJobProgressSuccess({ jobId, progress });
          }),
          catchError((error) => {
            console.error('Get job progress error:', error);
            return of(ScrapingActions.getJobProgressFailure({ jobId, error }));
          })
        );
      })
    )
  );

  // Effect to cancel job - POST /api/v1/scraping/advanced/job/{jobId}/cancel
  cancelJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.cancelJob),
      switchMap(({ jobId }) => {
        console.log('ScrapingEffects: Cancelling job:', jobId);

        return this.advancedScrapingService.cancelJob(jobId).pipe(
          map((result) => {
            console.log('Cancel job success response:', result);
            return ScrapingActions.cancelJobSuccess({ jobId });
          }),
          catchError((error) => {
            console.error('Cancel job error:', error);
            return of(ScrapingActions.cancelJobFailure({ jobId, error }));
          })
        );
      })
    )
  );

  // Effect to get system health - GET /api/v1/scraping/advanced/health
  getSystemHealth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.getSystemHealth),
      switchMap(() => {
        console.log('ScrapingEffects: Getting system health');

        // TODO: Add getSystemHealth method to AdvancedScrapingService
        // For now, we'll use getSystemStats as a placeholder
        return this.advancedScrapingService.getSystemStats().pipe(
          map((health) => {
            console.log('Get system health success response:', health);
            return ScrapingActions.getSystemHealthSuccess({ health });
          }),
          catchError((error) => {
            console.error('Get system health error:', error);
            return of(ScrapingActions.getSystemHealthFailure({ error }));
          })
        );
      })
    )
  );

  // Effect to get queue stats - GET /api/v1/scraping/advanced/stats
  getQueueStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.getQueueStats),
      switchMap(() => {
        console.log('ScrapingEffects: Getting queue stats');

        return this.advancedScrapingService.getSystemStats().pipe(
          map((stats) => {
            console.log('Get queue stats success response:', stats);
            return ScrapingActions.getQueueStatsSuccess({ stats });
          }),
          catchError((error) => {
            console.error('Get queue stats error:', error);
            return of(ScrapingActions.getQueueStatsFailure({ error }));
          })
        );
      })
    )
  );

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
