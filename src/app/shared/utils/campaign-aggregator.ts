/* =====================================
   CAMPAIGN AGGREGATOR - ANALYTICS UTILS
   Pure functions for computing campaign statistics
   ===================================== */

import {
  CampaignStats,
  LanguageDistribution,
  SentimentCounts,
  SentimentPercents,
  TopAuthor,
  TopHashtag,
  TopKeyword,
  TopMention,
  Tweet,
  TweetAuthor,
  TweetsByDay,
  TypeDistribution
} from '../../core/interfaces/tweet.interface';

/**
 * Safe division helper to avoid division by zero
 */
export function safeDivide(numerator: number, denominator: number, decimals: number = 2): number {
  if (!denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate engagement for a tweet if not present in metrics
 */
function calculateEngagement(tweet: Tweet): number {
  const { metrics } = tweet;
  
  // If engagement is already provided, use it
  if (metrics.engagement !== undefined && metrics.engagement !== null) {
    return metrics.engagement;
  }
  
  // Calculate from individual metrics
  return (metrics.likes || 0) + 
         (metrics.retweets || 0) + 
         (metrics.replies || 0) + 
         (metrics.quotes || 0) + 
         (metrics.bookmarks || 0);
}

/**
 * Normalize sentiment label to known categories
 */
function normalizeSentimentLabel(label: string | undefined): 'positive' | 'negative' | 'neutral' | 'unknown' {
  if (!label) return 'unknown';
  
  const normalizedLabel = label.toLowerCase().trim();
  
  switch (normalizedLabel) {
    case 'positive':
      return 'positive';
    case 'negative':
      return 'negative';
    case 'neutral':
      return 'neutral';
    default:
      return 'unknown';
  }
}

/**
 * Format date to YYYY-MM-DD from ISO string
 */
function formatDateToDay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  } catch {
    return '1970-01-01'; // Fallback for invalid dates
  }
}

/**
 * Count occurrences and calculate percentages for arrays
 */
function countAndPercentage<T>(
  items: T[], 
  total: number,
  keyExtractor: (item: T) => string = (item) => String(item)
): { [key: string]: { count: number; percentage: number } } {
  const counts: { [key: string]: number } = {};
  
  items.forEach(item => {
    const key = keyExtractor(item);
    counts[key] = (counts[key] || 0) + 1;
  });
  
  const result: { [key: string]: { count: number; percentage: number } } = {};
  Object.entries(counts).forEach(([key, count]) => {
    result[key] = {
      count,
      percentage: safeDivide(count * 100, total, 2)
    };
  });
  
  return result;
}

/**
 * Main function to compute comprehensive campaign statistics
 */
export function computeCampaignStats(tweets: Tweet[]): CampaignStats {
  // Basic validation
  if (!tweets || tweets.length === 0) {
    return createEmptyStats();
  }

  const totalTweets = tweets.length;
  
  // Initialize accumulators
  let totalEngagement = 0;
  let totalLikes = 0;
  let totalRetweets = 0;
  let totalReplies = 0;
  let totalQuotes = 0;
  let totalBookmarks = 0;
  let totalViews = 0;
  let totalProcessingTime = 0;
  let validSentimentCount = 0;
  let validEngagementRateCount = 0;
  let totalEngagementRates = 0;

  const sentimentCounts: SentimentCounts = { positive: 0, negative: 0, neutral: 0, unknown: 0 };
  const tweetsByDay: TweetsByDay = {};
  const authorEngagementMap: { [authorId: string]: { author: TweetAuthor; engagement: number; tweets: number } } = {};
  const hashtagCounts: { [hashtag: string]: number } = {};
  const mentionCounts: { [mention: string]: number } = {};
  const keywordCounts: { [keyword: string]: number } = {};
  const languageCounts: { [language: string]: number } = {};
  
  let retweetCount = 0;
  let replyCount = 0;
  let quoteCount = 0;

  // Single pass through tweets for efficiency
  tweets.forEach(tweet => {
    // Calculate engagement
    const engagement = calculateEngagement(tweet);
    totalEngagement += engagement;

    // Accumulate metrics
    totalLikes += tweet.metrics.likes || 0;
    totalRetweets += tweet.metrics.retweets || 0;
    totalReplies += tweet.metrics.replies || 0;
    totalQuotes += tweet.metrics.quotes || 0;
    totalBookmarks += tweet.metrics.bookmarks || 0;
    totalViews += tweet.metrics.views || 0;

    // Calculate individual engagement rate
    const views = tweet.metrics.views || 0;
    if (views > 0) {
      const engagementRate = (engagement / views) * 100;
      totalEngagementRates += engagementRate;
      validEngagementRateCount++;
    }

    // Process sentiment
    const sentimentLabel = normalizeSentimentLabel(tweet.sentiment?.label);
    sentimentCounts[sentimentLabel]++;

    // Check sentiment validity for coverage calculation
    if (tweet.sentiment && tweet.sentiment.label && tweet.sentiment.confidence !== undefined) {
      validSentimentCount++;
      totalProcessingTime += tweet.sentiment.processingTime || 0;
    }

    // Group by day
    const day = formatDateToDay(tweet.tweetCreatedAt);
    tweetsByDay[day] = (tweetsByDay[day] || 0) + 1;

    // Process author engagement
    const authorId = tweet.author.id || tweet.author.username || 'unknown';
    if (!authorEngagementMap[authorId]) {
      authorEngagementMap[authorId] = {
        author: tweet.author,
        engagement: 0,
        tweets: 0
      };
    }
    authorEngagementMap[authorId].engagement += engagement;
    authorEngagementMap[authorId].tweets++;

    // Process hashtags (normalize to lowercase)
    tweet.hashtags?.forEach(hashtag => {
      const normalizedHashtag = hashtag.toLowerCase().trim();
      if (normalizedHashtag) {
        hashtagCounts[normalizedHashtag] = (hashtagCounts[normalizedHashtag] || 0) + 1;
      }
    });

    // Process mentions (normalize to lowercase)
    tweet.mentions?.forEach(mention => {
      const normalizedMention = mention.toLowerCase().trim();
      if (normalizedMention) {
        mentionCounts[normalizedMention] = (mentionCounts[normalizedMention] || 0) + 1;
      }
    });

    // Process keywords (normalize to lowercase, filter empty)
    tweet.sentiment?.keywords?.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase().trim();
      if (normalizedKeyword && normalizedKeyword.length > 1) {
        keywordCounts[normalizedKeyword] = (keywordCounts[normalizedKeyword] || 0) + 1;
      }
    });

    // Language distribution
    const language = tweet.language || 'unknown';
    languageCounts[language] = (languageCounts[language] || 0) + 1;

    // Type counts
    if (tweet.isRetweet) retweetCount++;
    if (tweet.isReply) replyCount++;
    if (tweet.isQuote) quoteCount++;
  });

  // Calculate averages and percentages
  const avgEngagementPerTweet = safeDivide(totalEngagement, totalTweets, 2);
  const globalEngagementRate = safeDivide(totalEngagement * 100, Math.max(1, totalViews), 2);
  const avgEngagementPerTweetRate = safeDivide(totalEngagementRates, Math.max(1, validEngagementRateCount), 2);

  const sentimentPercents: SentimentPercents = {
    positive: safeDivide(sentimentCounts.positive * 100, totalTweets, 2),
    negative: safeDivide(sentimentCounts.negative * 100, totalTweets, 2),
    neutral: safeDivide(sentimentCounts.neutral * 100, totalTweets, 2),
    unknown: safeDivide(sentimentCounts.unknown * 100, totalTweets, 2)
  };

  // Create top lists
  const topTweetsByEngagement = [...tweets]
    .sort((a, b) => calculateEngagement(b) - calculateEngagement(a))
    .slice(0, 5);

  const topTweetsByViews = [...tweets]
    .sort((a, b) => (b.metrics.views || 0) - (a.metrics.views || 0))
    .slice(0, 5);

  const topAuthorsByEngagement: TopAuthor[] = Object.values(authorEngagementMap)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5)
    .map(item => ({
      author: item.author,
      totalEngagement: item.engagement,
      tweets: item.tweets
    }));

  const topHashtags: TopHashtag[] = Object.entries(hashtagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([hashtag, count]) => ({
      hashtag,
      count,
      percentage: safeDivide(count * 100, totalTweets, 2)
    }));

  const topMentions: TopMention[] = Object.entries(mentionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([mention, count]) => ({
      mention,
      count,
      percentage: safeDivide(count * 100, totalTweets, 2)
    }));

  const topKeywords: TopKeyword[] = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: safeDivide(count * 100, totalTweets, 2)
    }));

  // Language distribution
  const languageDistribution: LanguageDistribution = {};
  Object.entries(languageCounts).forEach(([language, count]) => {
    languageDistribution[language] = {
      count,
      percentage: safeDivide(count * 100, totalTweets, 2)
    };
  });

  // Type distribution
  const originalCount = totalTweets - retweetCount - replyCount - quoteCount;
  const typeDistribution: TypeDistribution = {
    retweetsPercent: safeDivide(retweetCount * 100, totalTweets, 2),
    repliesPercent: safeDivide(replyCount * 100, totalTweets, 2),
    quotesPercent: safeDivide(quoteCount * 100, totalTweets, 2),
    originalPercent: safeDivide(originalCount * 100, totalTweets, 2)
  };

  return {
    // Basic counts
    totalTweets,
    tweetsByDay,

    // Sentiment analysis
    sentimentCounts,
    sentimentPercents,

    // Engagement metrics
    totalEngagement,
    avgEngagementPerTweet,
    totalLikes,
    totalRetweets,
    totalReplies,
    totalQuotes,
    totalBookmarks,
    totalViews,
    avgLikes: safeDivide(totalLikes, totalTweets, 2),
    avgRetweets: safeDivide(totalRetweets, totalTweets, 2),
    avgReplies: safeDivide(totalReplies, totalTweets, 2),
    avgQuotes: safeDivide(totalQuotes, totalTweets, 2),
    avgBookmarks: safeDivide(totalBookmarks, totalTweets, 2),
    avgViews: safeDivide(totalViews, totalTweets, 2),

    // Engagement rates
    globalEngagementRate,
    avgEngagementPerTweetRate,

    // Top content and influencers
    topTweetsByEngagement,
    topTweetsByViews,
    topAuthorsByEngagement,

    // Hashtags, mentions, keywords
    topHashtags,
    topMentions,
    topKeywords,

    // Performance metrics
    avgProcessingTimeMs: safeDivide(totalProcessingTime, Math.max(1, validSentimentCount), 2),
    analysisCoverage: safeDivide(validSentimentCount * 100, totalTweets, 2),

    // Distribution by language
    languageDistribution,

    // Type distribution
    typeDistribution
  };
}

/**
 * Create empty stats object for when no tweets are available
 */
function createEmptyStats(): CampaignStats {
  return {
    totalTweets: 0,
    tweetsByDay: {},
    sentimentCounts: { positive: 0, negative: 0, neutral: 0, unknown: 0 },
    sentimentPercents: { positive: 0, negative: 0, neutral: 0, unknown: 0 },
    totalEngagement: 0,
    avgEngagementPerTweet: 0,
    totalLikes: 0,
    totalRetweets: 0,
    totalReplies: 0,
    totalQuotes: 0,
    totalBookmarks: 0,
    totalViews: 0,
    avgLikes: 0,
    avgRetweets: 0,
    avgReplies: 0,
    avgQuotes: 0,
    avgBookmarks: 0,
    avgViews: 0,
    globalEngagementRate: 0,
    avgEngagementPerTweetRate: 0,
    topTweetsByEngagement: [],
    topTweetsByViews: [],
    topAuthorsByEngagement: [],
    topHashtags: [],
    topMentions: [],
    topKeywords: [],
    avgProcessingTimeMs: 0,
    analysisCoverage: 0,
    languageDistribution: {},
    typeDistribution: {
      retweetsPercent: 0,
      repliesPercent: 0,
      quotesPercent: 0,
      originalPercent: 0
    }
  };
}
