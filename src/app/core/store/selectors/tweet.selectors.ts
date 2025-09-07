/**
 * Tweet Selectors - NgRx selectors for tweet state
 */
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TweetState } from '../../state/app.state';

// Feature selector
export const selectTweetState = createFeatureSelector<TweetState>('tweets');

// Basic selectors
export const selectTweetsLoading = createSelector(
  selectTweetState,
  (state: TweetState) => state.loading
);

export const selectTweetsError = createSelector(
  selectTweetState,
  (state: TweetState) => state.error
);

export const selectSelectedTweet = createSelector(
  selectTweetState,
  (state: TweetState) => state.selectedTweet
);

export const selectTweetFilter = createSelector(
  selectTweetState,
  (state: TweetState) => state.filter
);

export const selectAllTweetsEntities = createSelector(
  selectTweetState,
  (state: TweetState) => state.tweets
);

export const selectAllPagination = createSelector(
  selectTweetState,
  (state: TweetState) => state.pagination
);

// Campaign-specific selectors
export const selectTweetsByCampaign = (campaignId: string) => createSelector(
  selectTweetState,
  (state: TweetState) => state.tweets[campaignId] || []
);

export const selectTweetsPaginationByCampaign = (campaignId: string) => createSelector(
  selectTweetState,
  (state: TweetState) => state.pagination[campaignId] || { page: 1, limit: 20, total: 0, totalPages: 0 }
);

// Computed selectors
export const selectTweetCount = (campaignId: string) => createSelector(
  selectTweetsByCampaign(campaignId),
  (tweets) => tweets.length
);

export const selectTweetsBySentiment = (campaignId: string, sentiment: 'positive' | 'negative' | 'neutral') => createSelector(
  selectTweetsByCampaign(campaignId),
  (tweets) => tweets.filter(tweet => tweet.sentiment.label === sentiment)
);

export const selectTweetsByLanguage = (campaignId: string, language: string) => createSelector(
  selectTweetsByCampaign(campaignId),
  (tweets) => tweets.filter(tweet => tweet.language === language)
);

export const selectRetweetsOnly = (campaignId: string) => createSelector(
  selectTweetsByCampaign(campaignId),
  (tweets) => tweets.filter(tweet => tweet.isRetweet)
);

export const selectOriginalTweetsOnly = (campaignId: string) => createSelector(
  selectTweetsByCampaign(campaignId),
  (tweets) => tweets.filter(tweet => !tweet.isRetweet)
);

// Analytics selectors
export const selectTweetAnalytics = (campaignId: string) => createSelector(
  selectTweetsByCampaign(campaignId),
  (tweets) => {
    if (tweets.length === 0) {
      return {
        totalTweets: 0,
        averageSentiment: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        averageEngagement: 0,
        totalViews: 0,
        totalLikes: 0,
        totalRetweets: 0,
        languageDistribution: {},
        retweetPercentage: 0
      };
    }

    const totalTweets = tweets.length;
    const sentimentScores = tweets.map(t => t.sentiment.score);
    const averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / totalTweets;
    
    const sentimentDistribution = tweets.reduce((acc, tweet) => {
      const label = tweet.sentiment.label as keyof typeof acc;
      acc[label]++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const totalEngagement = tweets.reduce((sum, tweet) => sum + tweet.metrics.engagement, 0);
    const averageEngagement = totalEngagement / totalTweets;

    const totalViews = tweets.reduce((sum, tweet) => sum + tweet.metrics.views, 0);
    const totalLikes = tweets.reduce((sum, tweet) => sum + tweet.metrics.likes, 0);
    const totalRetweets = tweets.reduce((sum, tweet) => sum + tweet.metrics.retweets, 0);

    const languageDistribution = tweets.reduce((acc: {[key: string]: number}, tweet) => {
      acc[tweet.language] = (acc[tweet.language] || 0) + 1;
      return acc;
    }, {});

    const retweetCount = tweets.filter(t => t.isRetweet).length;
    const retweetPercentage = (retweetCount / totalTweets) * 100;

    return {
      totalTweets,
      averageSentiment,
      sentimentDistribution,
      averageEngagement,
      totalViews,
      totalLikes,
      totalRetweets,
      languageDistribution,
      retweetPercentage
    };
  }
);

// Tweet by ID selector
export const selectTweetById = (tweetId: string) => createSelector(
  selectAllTweetsEntities,
  (tweetsEntities) => {
    for (const campaignId in tweetsEntities) {
      const tweet = tweetsEntities[campaignId].find(t => t._id === tweetId || t.tweetId === tweetId);
      if (tweet) return tweet;
    }
    return null;
  }
);
