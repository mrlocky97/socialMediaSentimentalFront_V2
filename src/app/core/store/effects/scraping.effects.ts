/**
 * Scraping Effects - NgRx effects for scraping operations
 */
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { BackendApiService } from '../../services/backend-api.service';
import { ScrapingDispatchService } from '../../services/scraping-dispatch.service';
import * as ScrapingActions from '../actions/scraping.actions';

@Injectable()
export class ScrapingEffects {
  constructor(
    private actions$: Actions,
    private scrapingDispatchService: ScrapingDispatchService,
    private apiService: BackendApiService
  ) {}

  // Start scraping effect
  startScraping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.startScraping),
      mergeMap(({ campaign }) =>
        this.scrapingDispatchService.dispatchScraping(campaign).pipe(
          map(() => ScrapingActions.startScrapingSuccess({ campaignId: campaign.id })),
          catchError(error => of(ScrapingActions.startScrapingFailure({ error })))
        )
      )
    )
  );

  // Cancel scraping effect
  cancelScraping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.cancelScraping),
      mergeMap(({ campaignId }) =>
        this.apiService.controlScraping(campaignId, 'stop').pipe(
          map(() => ScrapingActions.cancelScrapingSuccess({ campaignId })),
          catchError(error => of(ScrapingActions.cancelScrapingFailure({ error })))
        )
      )
    )
  );

  // Get scraping status effect
  getScrapingStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.getScrapingStatus),
      switchMap(({ campaignId }) =>
        this.apiService.getScrapingStatus().pipe(
          map(status => ScrapingActions.getScrapingStatusSuccess({ status })),
          catchError(error => of(ScrapingActions.getScrapingStatusFailure({ error })))
        )
      )
    )
  );

  // Fetch scraped tweets effect
  fetchScrapedTweets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScrapingActions.fetchScrapedTweets),
      mergeMap(({ campaignId, limit }) =>
        this.apiService.getCampaignTweets(campaignId, { limit }).pipe(
          map(tweets => ScrapingActions.fetchScrapedTweetsSuccess({ campaignId, tweets })),
          catchError(error => of(ScrapingActions.fetchScrapedTweetsFailure({ error })))
        )
      )
    )
  );
}
