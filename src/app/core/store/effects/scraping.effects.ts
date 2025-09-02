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
      switchMap(({ campaign }) =>
        this.apiService.scrapeHashtags(campaign.hashtags).pipe(
          map(() => ScrapingActions.hashtagScrapingSuccess({ campaignId: campaign.id })),
          catchError((error) => of(ScrapingActions.hashtagScrapingFailure({ error })))
        )
      )
    )
  );
}
