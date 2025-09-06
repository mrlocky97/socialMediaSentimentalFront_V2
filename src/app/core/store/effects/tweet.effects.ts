/**
 * Tweet Effects - NgRx side effects for tweet operations
 */
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TweetService } from '../../services/tweet.service';
import * as TweetActions from '../actions/tweet.actions';

@Injectable()
export class TweetEffects {
  private actions$ = inject(Actions);
  private tweetService = inject(TweetService);

  /**
   * Load tweets effect
   */
  loadTweets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TweetActions.loadTweets),
      switchMap(action => {
        return this.tweetService.getTweetsByCampaign(action.campaignId, action.filter).pipe(
          map(response => {
            return TweetActions.loadTweetsSuccess({
              tweets: response.data,
              campaignId: action.campaignId,
              pagination: response.pagination
            });
          }),
          catchError(error => {
            return of(TweetActions.loadTweetsFailure({
              error: error.message || 'Error loading tweets',
              campaignId: action.campaignId
            }));
          })
        );
      })
    )
  );
}
