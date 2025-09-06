/**
 * Tweet Reducer - NgRx state management for tweets
 */
import { createReducer, on } from '@ngrx/store';
import { TweetState } from '../../state/app.state';
import * as TweetActions from '../actions/tweet.actions';

export type { TweetState };

export const initialTweetState: TweetState = {
  tweets: {},
  loading: false,
  error: null,
  selectedTweet: null,
  filter: {},
  pagination: {}
};

export const tweetReducer = createReducer(
  initialTweetState,

  // Load Tweets
  on(TweetActions.loadTweets, (state, { campaignId }) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TweetActions.loadTweetsSuccess, (state, { tweets, campaignId, pagination }) => ({
    ...state,
    loading: false,
    error: null,
    tweets: {
      ...state.tweets,
      [campaignId]: tweets
    },
    pagination: pagination ? {
      ...state.pagination,
      [campaignId]: pagination
    } : state.pagination
  })),

  on(TweetActions.loadTweetsFailure, (state, { error, campaignId }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Tweets
  on(TweetActions.clearTweets, (state) => ({
    ...state,
    tweets: {},
    pagination: {},
    selectedTweet: null,
    error: null
  })),

  on(TweetActions.clearTweetsForCampaign, (state, { campaignId }) => {
    const newTweets = { ...state.tweets };
    const newPagination = { ...state.pagination };
    
    delete newTweets[campaignId];
    delete newPagination[campaignId];
    
    return {
      ...state,
      tweets: newTweets,
      pagination: newPagination,
      selectedTweet: state.selectedTweet?.campaignId === campaignId ? null : state.selectedTweet
    };
  }),

  // Filter Management
  on(TweetActions.setTweetFilter, (state, { filter }) => ({
    ...state,
    filter: { ...state.filter, ...filter }
  })),

  on(TweetActions.clearTweetFilter, (state) => ({
    ...state,
    filter: {}
  })),

  // Tweet Selection
  on(TweetActions.selectTweet, (state, { tweetId }) => {
    // Find tweet across all campaigns
    let selectedTweet = null;
    for (const campaignId in state.tweets) {
      const tweet = state.tweets[campaignId].find(t => t._id === tweetId || t.tweetId === tweetId);
      if (tweet) {
        selectedTweet = tweet;
        break;
      }
    }
    
    return {
      ...state,
      selectedTweet
    };
  }),

  on(TweetActions.clearSelectedTweet, (state) => ({
    ...state,
    selectedTweet: null
  }))
);
