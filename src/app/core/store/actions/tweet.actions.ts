/**
 * Tweet Actions - NgRx
 */
import { createAction, props } from '@ngrx/store';
import { Tweet, TweetFilter } from '../../interfaces/tweet.interface';

// Load Tweets Actions
export const loadTweets = createAction(
  '[Tweet] Load Tweets',
  props<{ campaignId: string; filter?: TweetFilter }>()
);

export const loadTweetsSuccess = createAction(
  '[Tweet] Load Tweets Success',
  props<{ 
    tweets: Tweet[]; 
    campaignId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>()
);

export const loadTweetsFailure = createAction(
  '[Tweet] Load Tweets Failure',
  props<{ error: string; campaignId: string }>()
);

// Clear Tweets Actions
export const clearTweets = createAction(
  '[Tweet] Clear Tweets'
);

export const clearTweetsForCampaign = createAction(
  '[Tweet] Clear Tweets For Campaign',
  props<{ campaignId: string }>()
);

// Set Filter Actions
export const setTweetFilter = createAction(
  '[Tweet] Set Filter',
  props<{ filter: TweetFilter }>()
);

export const clearTweetFilter = createAction(
  '[Tweet] Clear Filter'
);

// Select Tweet Actions
export const selectTweet = createAction(
  '[Tweet] Select Tweet',
  props<{ tweetId: string }>()
);

export const clearSelectedTweet = createAction(
  '[Tweet] Clear Selected Tweet'
);
