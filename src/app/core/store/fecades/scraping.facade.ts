/**
 * Scraping Facade - NgRx facade for scraping operations
 * Provides a simplified interface to the NgRx store for scraping operations
 */
import { Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, Observable, take } from 'rxjs';
import { ScrapingProgress } from '../../services/scraping.service';
import { Campaign } from '../../state/app.state';
import * as ScrapingActions from '../actions/scraping.actions';
import * as ScrapingSelectors from '../selectors/scraping.selectors';

@Injectable({
  providedIn: 'root',
})
export class ScrapingFacade {
  // Selectors as observables
  readonly loading$: Observable<boolean>;
  readonly error$: Observable<string | null>;
  readonly hasActiveScrapings$: Observable<boolean>;
  readonly activeScrapingIds$: Observable<string[]>;

  constructor(
    private store: Store,
    private actions$: Actions
  ) {
    // Initialize selectors
    this.loading$ = this.store.select(ScrapingSelectors.selectScrapingLoading);
    this.error$ = this.store.select(ScrapingSelectors.selectScrapingError);
    this.hasActiveScrapings$ = this.store.select(ScrapingSelectors.selectHasActiveScrapings);
    this.activeScrapingIds$ = this.store.select(ScrapingSelectors.selectActiveScrapingIds);
  }

  /**
   * Start scraping for a campaign
   * @param campaign - Campaign to start scraping for
   * @returns Observable that completes when the action is processed
   */
  startScraping(campaign: Campaign): Observable<any> {
    this.store.dispatch(ScrapingActions.startScraping({ campaign }));
    
    return this.actions$.pipe(
      ofType(ScrapingActions.startScrapingSuccess, ScrapingActions.startScrapingFailure),
      take(1)
    );
  }

  /**
   * Cancel active scraping for a campaign
   * @param campaignId - ID of the campaign to cancel scraping for
   * @returns Observable that completes when the action is processed
   */
  cancelScraping(campaignId: string): Observable<any> {
    this.store.dispatch(ScrapingActions.cancelScraping({ campaignId }));
    
    return this.actions$.pipe(
      ofType(ScrapingActions.cancelScrapingSuccess, ScrapingActions.cancelScrapingFailure),
      take(1)
    );
  }

  /**
   * Get current scraping progress for a campaign
   * @param campaignId - ID of the campaign to get progress for
   * @returns Observable of scraping progress
   */
  getScrapingProgress(campaignId: string): Observable<ScrapingProgress | null> {
    return this.store.select(ScrapingSelectors.selectScrapingProgress(campaignId));
  }

  /**
   * Check if a campaign is currently being scraped
   * @param campaignId - ID of the campaign to check
   * @returns Observable boolean indicating if scraping is active
   */
  isScrapingActive(campaignId: string): Observable<boolean> {
    return this.store.select(ScrapingSelectors.selectCampaignIsActivelyScraped(campaignId));
  }

  /**
   * Fetch the latest scraped tweets for a campaign
   * @param campaignId - ID of the campaign to fetch tweets for
   * @param limit - Optional limit for number of tweets to fetch
   */
  fetchScrapedTweets(campaignId: string, limit?: number): void {
    this.store.dispatch(ScrapingActions.fetchScrapedTweets({ campaignId, limit }));
  }

  /**
   * Get the latest scraped tweets for a campaign
   * @param campaignId - ID of the campaign to get tweets for
   * @returns Observable of scraped tweets
   */
  getScrapedTweets(campaignId: string): Observable<any[]> {
    return this.store.select(ScrapingSelectors.selectScrapedTweets(campaignId));
  }

  /**
   * Get the scraping results for a campaign
   * @param campaignId - ID of the campaign to get results for
   * @returns Observable of scraping results
   */
  getScrapingResults(campaignId: string): Observable<any> {
    return this.store.select(ScrapingSelectors.selectScrapingResults(campaignId));
  }

  /**
   * Get the status of scraping for a campaign
   * @param campaignId - ID of the campaign to get status for
   */
  getScrapingStatus(campaignId: string): void {
    this.store.dispatch(ScrapingActions.getScrapingStatus({ campaignId }));
  }

  /**
   * Select the status of scraping for a campaign
   * @param campaignId - ID of the campaign to select status for
   * @returns Observable of scraping status
   */
  selectScrapingStatus(campaignId: string): Observable<any> {
    return this.store.select(ScrapingSelectors.selectScrapingStatus(campaignId));
  }

  /**
   * Clear all scraping state
   */
  clearScrapingState(): void {
    this.store.dispatch(ScrapingActions.clearScrapingState());
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
      ...result.payload
    };
    
    this.store.dispatch(ScrapingActions.startScraping({ campaign }));
    
    return this.actions$.pipe(
      ofType(ScrapingActions.startScrapingSuccess, ScrapingActions.startScrapingFailure),
      take(1),
      map(action => {
        if (action.type === ScrapingActions.startScrapingFailure.type) {
          // Log the error for debugging
          console.error('Hashtag scraping failed:', (action as any).error);
        }
        return action;
      })
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
      ...result.payload
    };
    
    this.store.dispatch(ScrapingActions.startScraping({ campaign }));
    
    return this.actions$.pipe(
      ofType(ScrapingActions.startScrapingSuccess, ScrapingActions.startScrapingFailure),
      take(1),
      map(action => {
        if (action.type === ScrapingActions.startScrapingFailure.type) {
          console.error('Keyword scraping failed:', (action as any).error);
        }
        return action;
      })
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
      ...result.payload
    };
    
    this.store.dispatch(ScrapingActions.startScraping({ campaign }));
    
    return this.actions$.pipe(
      ofType(ScrapingActions.startScrapingSuccess, ScrapingActions.startScrapingFailure),
      take(1),
      map(action => {
        if (action.type === ScrapingActions.startScrapingFailure.type) {
          console.error('User scraping failed:', (action as any).error);
        }
        return action;
      })
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
      ...result.payload
    };
    
    this.store.dispatch(ScrapingActions.startScraping({ campaign }));
    
    return this.actions$.pipe(
      ofType(ScrapingActions.startScrapingSuccess, ScrapingActions.startScrapingFailure),
      take(1),
      map(action => {
        if (action.type === ScrapingActions.startScrapingFailure.type) {
          console.error('Mention scraping failed:', (action as any).error);
        }
        return action;
      })
    );
  }
  
  /**
   * Handle invalid result object
   * @returns Observable that emits an error action
   * @private
   */
  private handleInvalidResult(): Observable<any> {
    const error = new Error('Invalid campaign result object');
    return this.actions$.pipe(
      ofType(ScrapingActions.startScrapingFailure),
      take(1),
      map(() => ({ type: ScrapingActions.startScrapingFailure.type, error }))
    );
  }
}
