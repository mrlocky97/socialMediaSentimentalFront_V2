/**
 * Tweet Facade - NgRx implementation
 * Provides a simplified interface to the NgRx store for tweet operations
 */
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Tweet, TweetFilter } from '../../interfaces/tweet.interface';
import * as TweetActions from '../actions/tweet.actions';
import * as TweetSelectors from '../selectors/tweet.selectors';

@Injectable({
  providedIn: 'root',
})
export class TweetFacade {
  private store = inject(Store);

  // Selectors
  readonly loading$ = this.store.select(TweetSelectors.selectTweetsLoading);
  readonly error$ = this.store.select(TweetSelectors.selectTweetsError);
  readonly selectedTweet$ = this.store.select(TweetSelectors.selectSelectedTweet);
  readonly filter$ = this.store.select(TweetSelectors.selectTweetFilter);

  /**
   * Get tweets for a specific campaign
   */
  getTweetsByCampaign(campaignId: string): Observable<Tweet[]> {
    return this.store.select(TweetSelectors.selectTweetsByCampaign(campaignId));
  }

  /**
   * Get pagination info for a specific campaign
   */
  getPaginationByCampaign(campaignId: string): Observable<any> {
    return this.store.select(TweetSelectors.selectTweetsPaginationByCampaign(campaignId));
  }

  /**
   * Get tweet analytics for a specific campaign
   */
  getTweetAnalytics(campaignId: string): Observable<any> {
    return this.store.select(TweetSelectors.selectTweetAnalytics(campaignId));
  }

  /**
   * Get tweets by sentiment for a specific campaign
   */
  getTweetsBySentiment(campaignId: string, sentiment: 'positive' | 'negative' | 'neutral'): Observable<Tweet[]> {
    return this.store.select(TweetSelectors.selectTweetsBySentiment(campaignId, sentiment));
  }

  /**
   * Get tweets by language for a specific campaign
   */
  getTweetsByLanguage(campaignId: string, language: string): Observable<Tweet[]> {
    return this.store.select(TweetSelectors.selectTweetsByLanguage(campaignId, language));
  }

  /**
   * Get only retweets for a specific campaign
   */
  getRetweetsOnly(campaignId: string): Observable<Tweet[]> {
    return this.store.select(TweetSelectors.selectRetweetsOnly(campaignId));
  }

  /**
   * Get only original tweets for a specific campaign
   */
  getOriginalTweetsOnly(campaignId: string): Observable<Tweet[]> {
    return this.store.select(TweetSelectors.selectOriginalTweetsOnly(campaignId));
  }

  /**
   * Get a specific tweet by ID
   */
  getTweetById(tweetId: string): Observable<Tweet | null> {
    return this.store.select(TweetSelectors.selectTweetById(tweetId));
  }

  // Actions

  /**
   * Load tweets for a campaign
   */
  loadTweets(campaignId: string, filter?: TweetFilter): void {
    this.store.dispatch(TweetActions.loadTweets({ campaignId, filter }));
  }

  /**
   * Clear all tweets
   */
  clearTweets(): void {
    this.store.dispatch(TweetActions.clearTweets());
  }

  /**
   * Clear tweets for a specific campaign
   */
  clearTweetsForCampaign(campaignId: string): void {
    this.store.dispatch(TweetActions.clearTweetsForCampaign({ campaignId }));
  }

  /**
   * Set tweet filter
   */
  setFilter(filter: TweetFilter): void {
    this.store.dispatch(TweetActions.setTweetFilter({ filter }));
  }

  /**
   * Clear tweet filter
   */
  clearFilter(): void {
    this.store.dispatch(TweetActions.clearTweetFilter());
  }

  /**
   * Select a tweet
   */
  selectTweet(tweetId: string): void {
    this.store.dispatch(TweetActions.selectTweet({ tweetId }));
  }

  /**
   * Clear selected tweet
   */
  clearSelectedTweet(): void {
    this.store.dispatch(TweetActions.clearSelectedTweet());
  }
}
