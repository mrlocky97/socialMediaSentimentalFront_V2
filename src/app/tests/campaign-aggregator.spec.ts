/* =====================================
   CAMPAIGN AGGREGATOR TESTS
   Unit tests for analytics calculations
   ===================================== */

import { Tweet, TweetAuthor, TweetMetrics, TweetSentiment } from '../core/interfaces/tweet.interface';
import { computeCampaignStats, safeDivide } from '../shared/utils/campaign-aggregator';


describe('CampaignAggregator', () => {
  
  describe('safeDivide', () => {
    it('should return 0 when denominator is 0', () => {
      expect(safeDivide(10, 0)).toBe(0);
    });

    it('should return 0 when denominator is null or undefined', () => {
      expect(safeDivide(10, null as any)).toBe(0);
      expect(safeDivide(10, undefined as any)).toBe(0);
    });

    it('should calculate division correctly', () => {
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(1, 3, 2)).toBe(0.33);
      expect(safeDivide(2, 3, 4)).toBe(0.6667);
    });
  });

  describe('computeCampaignStats', () => {
    
    it('should return empty stats for empty array', () => {
      const stats = computeCampaignStats([]);
      
      expect(stats.totalTweets).toBe(0);
      expect(stats.totalEngagement).toBe(0);
      expect(stats.sentimentCounts.positive).toBe(0);
      expect(stats.topTweetsByEngagement).toEqual([]);
    });

    it('should return empty stats for null/undefined input', () => {
      const stats1 = computeCampaignStats(null as any);
      const stats2 = computeCampaignStats(undefined as any);
      
      expect(stats1.totalTweets).toBe(0);
      expect(stats2.totalTweets).toBe(0);
    });

    it('should handle tweets with all views = 0', () => {
      const tweets = createMockTweets([
        { metrics: { likes: 10, retweets: 5, replies: 2, quotes: 1, bookmarks: 0, views: 0, engagement: 18 } },
        { metrics: { likes: 5, retweets: 2, replies: 1, quotes: 0, bookmarks: 1, views: 0, engagement: 9 } }
      ]);

      const stats = computeCampaignStats(tweets);
      
      expect(stats.totalTweets).toBe(2);
      expect(stats.totalEngagement).toBe(27);
      expect(stats.globalEngagementRate).toBe(0); // No views, so rate is 0
      expect(stats.avgEngagementPerTweetRate).toBe(0); // No valid rates to average
    });

    it('should calculate engagement when not provided in metrics', () => {
      const tweets = createMockTweets([
        { 
          metrics: { 
            likes: 10, 
            retweets: 5, 
            replies: 2, 
            quotes: 1, 
            bookmarks: 3, 
            views: 100, 
            engagement: undefined as any 
          } 
        }
      ]);

      const stats = computeCampaignStats(tweets);
      
      // Should calculate: 10 + 5 + 2 + 1 + 3 = 21
      expect(stats.totalEngagement).toBe(21);
      expect(stats.avgEngagementPerTweet).toBe(21);
    });

    it('should handle mixed sentiment labels including unknown', () => {
      const tweets = createMockTweets([
        { sentiment: { label: 'positive', confidence: 0.8 } },
        { sentiment: { label: 'negative', confidence: 0.7 } },
        { sentiment: { label: 'neutral', confidence: 0.9 } },
        { sentiment: { label: 'POSITIVE', confidence: 0.6 } }, // uppercase
        { sentiment: { label: 'unknown_sentiment', confidence: 0.5 } }, // unknown
        { sentiment: { label: '', confidence: 0.3 } }, // empty
        { sentiment: null as any }, // null sentiment
      ]);

      const stats = computeCampaignStats(tweets);
      
      expect(stats.sentimentCounts.positive).toBe(2); // positive + POSITIVE
      expect(stats.sentimentCounts.negative).toBe(1);
      expect(stats.sentimentCounts.neutral).toBe(1);
      expect(stats.sentimentCounts.unknown).toBe(3); // unknown_sentiment + empty + null
      
      expect(stats.sentimentPercents.positive).toBe(28.57); // 2/7 * 100 = 28.57
      expect(stats.sentimentPercents.unknown).toBe(42.86); // 3/7 * 100 = 42.86
    });

    it('should normalize hashtags and mentions to lowercase', () => {
      const tweets = createMockTweets([
        { hashtags: ['GameDev', 'JAVASCRIPT'], mentions: ['TestUser', '@EXAMPLE'] },
        { hashtags: ['gamedev', 'typescript'], mentions: ['testuser', 'newuser'] },
        { hashtags: ['GAMEDEV'], mentions: ['TESTUSER'] }
      ]);

      const stats = computeCampaignStats(tweets);
      
      // Check hashtag normalization and counting
      const gamedevHashtag = stats.topHashtags.find(h => h.hashtag === 'gamedev');
      expect(gamedevHashtag?.count).toBe(3); // All variations of 'gamedev'
      
      const jsHashtag = stats.topHashtags.find(h => h.hashtag === 'javascript');
      expect(jsHashtag?.count).toBe(1);
      
      // Check mention normalization
      const testUserMention = stats.topMentions.find(m => m.mention === 'testuser');
      expect(testUserMention?.count).toBe(3); // All variations of 'testuser'
    });

    it('should filter empty keywords and normalize them', () => {
      const tweets = createMockTweets([
        { sentiment: { 
          score: 0, magnitude: 0, label: 'neutral', confidence: 0.7,
          emotions: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 },
          analyzedAt: '2025-01-01T00:00:00.000Z', processingTime: 100,
          keywords: ['Hello', 'WORLD', '', ' ', 'a'] 
        } }, // 'a' is too short
        { sentiment: { 
          score: 0, magnitude: 0, label: 'neutral', confidence: 0.7,
          emotions: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 },
          analyzedAt: '2025-01-01T00:00:00.000Z', processingTime: 100,
          keywords: ['hello', 'test', 'WORLD'] 
        } }
      ]);

      const stats = computeCampaignStats(tweets);
      
      const helloKeyword = stats.topKeywords.find(k => k.keyword === 'hello');
      const worldKeyword = stats.topKeywords.find(k => k.keyword === 'world');
      const testKeyword = stats.topKeywords.find(k => k.keyword === 'test');
      
      expect(helloKeyword?.count).toBe(2);
      expect(worldKeyword?.count).toBe(2);
      expect(testKeyword?.count).toBe(1);
      
      // Should not include empty strings or single characters
      expect(stats.topKeywords.find(k => k.keyword === '')).toBeUndefined();
      expect(stats.topKeywords.find(k => k.keyword === 'a')).toBeUndefined();
    });

    it('should calculate correct percentages with 2 decimal places', () => {
      const tweets = createMockTweets([
        { sentiment: { 
          score: 0, magnitude: 0, label: 'positive', confidence: 0.7,
          emotions: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 },
          analyzedAt: '2025-01-01T00:00:00.000Z', processingTime: 100,
          keywords: []
        } },
        { sentiment: { 
          score: 0, magnitude: 0, label: 'positive', confidence: 0.7,
          emotions: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 },
          analyzedAt: '2025-01-01T00:00:00.000Z', processingTime: 100,
          keywords: []
        } },
        { sentiment: { 
          score: 0, magnitude: 0, label: 'negative', confidence: 0.7,
          emotions: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 },
          analyzedAt: '2025-01-01T00:00:00.000Z', processingTime: 100,
          keywords: []
        } }
      ]);

      const stats = computeCampaignStats(tweets);
      
      expect(stats.sentimentPercents.positive).toBe(66.67); // 2/3 * 100
      expect(stats.sentimentPercents.negative).toBe(33.33); // 1/3 * 100
      expect(stats.sentimentPercents.neutral).toBe(0);
    });

    it('should group tweets by day correctly', () => {
      const tweets = createMockTweets([
        { tweetCreatedAt: '2025-01-01T10:30:00.000Z' },
        { tweetCreatedAt: '2025-01-01T15:45:00.000Z' },
        { tweetCreatedAt: '2025-01-02T08:20:00.000Z' },
        { tweetCreatedAt: 'invalid-date' } // Should fallback to 1970-01-01
      ]);

      const stats = computeCampaignStats(tweets);
      
      expect(stats.tweetsByDay['2025-01-01']).toBe(2);
      expect(stats.tweetsByDay['2025-01-02']).toBe(1);
      expect(stats.tweetsByDay['1970-01-01']).toBe(1); // Fallback for invalid date
    });

    it('should calculate type distribution correctly', () => {
      const tweets = createMockTweets([
        { isRetweet: true, isReply: false, isQuote: false },
        { isRetweet: false, isReply: true, isQuote: false },
        { isRetweet: false, isReply: false, isQuote: true },
        { isRetweet: false, isReply: false, isQuote: false }, // original
        { isRetweet: false, isReply: false, isQuote: false }  // original
      ]);

      const stats = computeCampaignStats(tweets);
      
      expect(stats.typeDistribution.retweetsPercent).toBe(20); // 1/5 * 100
      expect(stats.typeDistribution.repliesPercent).toBe(20);  // 1/5 * 100
      expect(stats.typeDistribution.quotesPercent).toBe(20);   // 1/5 * 100
      expect(stats.typeDistribution.originalPercent).toBe(40); // 2/5 * 100
    });

    it('should calculate top tweets and authors correctly', () => {
      const tweets = createMockTweets([
        { 
          metrics: { 
            retweets: 10, likes: 50, replies: 20, quotes: 5, bookmarks: 15, 
            engagement: 100, views: 1000 
          },
          author: { 
            id: 'user1', username: 'user1', displayName: 'User One',
            verified: false, followersCount: 100, followingCount: 50, tweetsCount: 1000
          }
        },
        { 
          metrics: { 
            retweets: 5, likes: 25, replies: 10, quotes: 2, bookmarks: 8, 
            engagement: 50, views: 500 
          },
          author: { 
            id: 'user1', username: 'user1', displayName: 'User One',
            verified: false, followersCount: 100, followingCount: 50, tweetsCount: 1000
          }
        },
        { 
          metrics: { 
            retweets: 20, likes: 100, replies: 40, quotes: 10, bookmarks: 30, 
            engagement: 200, views: 2000 
          },
          author: { 
            id: 'user2', username: 'user2', displayName: 'User Two',
            verified: false, followersCount: 200, followingCount: 100, tweetsCount: 2000
          }
        }
      ]);

      const stats = computeCampaignStats(tweets);
      
      // Check top tweets by engagement
      expect(stats.topTweetsByEngagement[0].metrics.engagement).toBe(200);
      expect(stats.topTweetsByEngagement[1].metrics.engagement).toBe(100);
      expect(stats.topTweetsByEngagement[2].metrics.engagement).toBe(50);
      
      // Check top authors
      expect(stats.topAuthorsByEngagement.length).toBe(2);
      expect(stats.topAuthorsByEngagement[0].totalEngagement).toBe(200); // user2
      expect(stats.topAuthorsByEngagement[0].tweets).toBe(1);
      expect(stats.topAuthorsByEngagement[1].totalEngagement).toBe(150); // user1 (100+50)
      expect(stats.topAuthorsByEngagement[1].tweets).toBe(2);
    });

    it('should calculate analysis coverage correctly', () => {
      const tweets = createMockTweets([
        { sentiment: { label: 'positive', confidence: 0.8, processingTime: 100 } },
        { sentiment: { label: 'negative', confidence: 0.7, processingTime: 150 } },
        { sentiment: { label: '', confidence: undefined, processingTime: 0 } }, // invalid
        { sentiment: null as any } // no sentiment
      ]);

      const stats = computeCampaignStats(tweets);
      
      expect(stats.analysisCoverage).toBe(50); // 2 valid out of 4 = 50%
      expect(stats.avgProcessingTimeMs).toBe(125); // (100+150)/2 = 125
    });
  });
});

// Helper function to create mock tweets
function createMockTweets(overrides: Partial<Tweet>[]): Tweet[] {
  return overrides.map((override, index) => ({
    _id: `tweet_${index}`,
    tweetId: `${1000000000000000000 + index}`,
    content: `Mock tweet content ${index}`,
    author: {
      id: `user_${index}`,
      username: `user${index}`,
      displayName: `User ${index}`,
      avatar: '',
      verified: false,
      followersCount: 100,
      followingCount: 50,
      tweetsCount: 1000,
      location: '',
      bio: '',
      website: '',
      joinedDate: '2025-01-01T00:00:00.000Z',
      influenceScore: 0,
      engagementRate: 0,
      ...override.author
    } as TweetAuthor,
    metrics: {
      retweets: 1,
      likes: 10,
      replies: 2,
      quotes: 0,
      bookmarks: 1,
      views: 100,
      engagement: 14,
      ...override.metrics
    } as TweetMetrics,
    sentiment: override.sentiment !== null ? {
      score: 0,
      magnitude: 0,
      label: 'neutral',
      confidence: 0.7,
      emotions: {
        joy: 0,
        anger: 0,
        fear: 0,
        sadness: 0,
        surprise: 0,
        disgust: 0
      },
      keywords: [],
      analyzedAt: '2025-01-01T00:00:00.000Z',
      processingTime: 100,
      ...override.sentiment
    } as TweetSentiment : null as any,
    hashtags: [],
    mentions: [],
    urls: [],
    mediaUrls: [],
    photoData: [],
    campaignId: 'test_campaign',
    isRetweet: false,
    isReply: false,
    isQuote: false,
    isEdited: false,
    isPinned: false,
    isSensitive: false,
    language: 'en',
    scrapedAt: '2025-01-01T00:00:00.000Z',
    tweetCreatedAt: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...override
  } as Tweet));
}
