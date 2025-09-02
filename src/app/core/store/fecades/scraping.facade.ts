/**
 * Scraping Facade - NgRx facade for scraping operations
 * Provides a simplified interface to the NgRx store for scraping operations
 */
import { Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { ScrapingProgress } from '../../services/scraping.service';
import { Campaign } from '../../state/app.state';
import * as ScrapingActions from '../actions/scraping.actions';
import * as ScrapingSelectors from '../selectors/scraping.selectors';

@Injectable({
  providedIn: 'root',
})
export class ScrapingFacade {
  // Selectors as observables
  readonly error$: Observable<string | null>;
  readonly loading$: Observable<boolean>;
  readonly hasActiveScrapings$: Observable<boolean>;
  readonly activeScrapingIds$: Observable<string[]>;

  constructor(private store: Store, private actions$: Actions) {
    // Initialize selectors
    this.error$ = this.store.select(ScrapingSelectors.selectScrapingError);
    this.loading$ = this.store.select(ScrapingSelectors.selectScrapingLoading);
    this.hasActiveScrapings$ = this.store.select(ScrapingSelectors.selectHasActiveScrapings);
    this.activeScrapingIds$ = this.store.select(ScrapingSelectors.selectActiveScrapingIds);
  }

  /**
   * Get scraping data for a specific campaign
   * @param campaignId - Campaign ID to select scraping data for
   * @returns Observable with scraping data for the campaign
   */
  selectScraping(campaignId: string): Observable<any> {
    return this.store.select(ScrapingSelectors.selectCampaignScraping(campaignId));
  }

  /**
   * Start hashtag scraping for a campaign result
   * @param result - Campaign result object with payload containing campaign data
   * @returns Observable that completes when the action is processed
   */
  startHashtagScraping(result: any): Observable<any> {
    if (!result || !result.id || !result.payload) {
      console.error('Invalid result for hashtag scraping', result);
      return this.handleInvalidResult();
    }

    const campaign: Campaign = {
      id: result.id,
      ...result.payload,
    };

    this.store.dispatch(ScrapingActions.hashtagScraping({ campaign }));

    return this.actions$.pipe(
      ofType(ScrapingActions.hashtagScrapingSuccess, ScrapingActions.hashtagScrapingFailure),
      take(1)
    );
  }

  /**
   * Start keyword scraping for a campaign result
   * @param result - Campaign result object with payload containing campaign data
   * @returns Observable that completes when the action is processed
   */
  startKeywordScraping(result: any): Observable<any> {
    if (!result || !result.id || !result.payload) {
      console.error('Invalid result for keyword scraping', result);
      return this.handleInvalidResult();
    }
    const campaign: Campaign = {
      id: result.id,
      ...result.payload,
    };
    this.store.dispatch(ScrapingActions.keywordScraping({ campaign }));
    return this.actions$.pipe(
      ofType(ScrapingActions.keywordScrapingSuccess, ScrapingActions.keywordScrapingFailure),
      take(1)
    );
  }

  /**
   * Start user scraping for a campaign result
   * @param result - Campaign result object with payload containing campaign data
   * @returns Observable that completes when the action is processed
   */
  startUserScraping(result: any): Observable<any> {
    if (!result || !result.id || !result.payload) {
      console.error('Invalid result for user scraping', result);
      return this.handleInvalidResult();
    }

    const campaign: Campaign = {
      id: result.id,
      ...result.payload,
    };

    this.store.dispatch(ScrapingActions.userScraping({ campaign }));

    return this.actions$.pipe(
      ofType(ScrapingActions.userScrapingSuccess, ScrapingActions.userScrapingFailure),
      take(1)
    );
  }

  /**
   * Start mention scraping for a campaign result
   * @param result - Campaign result object with payload containing campaign data
   * @returns Observable that completes when the action is processed
   */
  startMentionScraping(result: any): Observable<any> {
    if (!result || !result.id || !result.payload) {
      console.error('Invalid result for mention scraping', result);
      return this.handleInvalidResult();
    }

    const campaign: Campaign = {
      id: result.id,
      ...result.payload,
    };

    this.store.dispatch(ScrapingActions.mentionScraping({ campaign }));

    return this.actions$.pipe(
      ofType(ScrapingActions.mentionScrapingSuccess, ScrapingActions.mentionScrapingFailure),
      take(1)
    );
  }

  /**
   * Handle invalid result object
   * @returns Observable that emits an error action
   * @private
   */
  private handleInvalidResult(): Observable<any> {
    const error = new Error('Invalid campaign result object');
    
    // Dispatch the error action
    this.store.dispatch(ScrapingActions.scrapingFailure({ error }));
    
    // Return an observable with the error action
    return new Observable(subscriber => {
      subscriber.next({ type: '[Scraping] Generic Scraping Failure', error });
      subscriber.complete();
    });
  }
  
  /**
   * Check if scraping is active for a campaign
   * @param campaignId - ID of the campaign to check
   * @returns Observable boolean indicating if scraping is active
   */
  isScrapingActive(campaignId: string): Observable<boolean> {
    return this.store.select((state: any) => {
      return state?.scraping?.activeScraping?.[campaignId] || false;
    });
  }
  
  /**
   * Get current scraping progress for a campaign
   * @param campaignId - ID of the campaign to get progress for
   * @returns Observable of scraping progress
   */
  getScrapingProgress(campaignId: string): Observable<ScrapingProgress | null> {
    return this.store.select((state: any) => {
      return state?.scraping?.progress?.[campaignId] || null;
    });
  }
  
  /**
   * Get the latest scraped tweets for a campaign
   * @param campaignId - ID of the campaign to get tweets for
   * @returns Observable of scraped tweets
   */
  getScrapedTweets(campaignId: string): Observable<any[]> {
    return this.store.select((state: any) => {
      return state?.scraping?.scrapedTweets?.[campaignId] || [];
    });
  }
}
