/**
 * Tweet Interface - Based on API response structure
 */

export interface TweetAuthor {
  id?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  location?: string;
  bio?: string;
  website?: string;
  joinedDate?: string;
  influenceScore?: number;
  engagementRate?: number;
}

export interface TweetMetrics {
  retweets: number;
  likes: number;
  replies: number;
  quotes: number;
  bookmarks: number;
  views: number;
  engagement: number;
}

export interface TweetSentimentEmotions {
  joy: number;
  anger: number;
  fear: number;
  sadness: number;
  surprise: number;
  disgust: number;
}

export interface TweetSentiment {
  score: number;
  magnitude: number;
  label: 'positive' | 'negative' | 'neutral' | string; // Allow unknown values
  confidence: number;
  emotions: TweetSentimentEmotions;
  keywords: string[];
  analyzedAt: string;
  processingTime: number; // Asumimos que está en milisegundos
}

export interface Tweet {
  _id: string;
  tweetId: string;
  content: string;
  author: TweetAuthor;
  metrics: TweetMetrics;
  sentiment: TweetSentiment;
  hashtags: string[];
  mentions: string[];
  urls: string[];
  mediaUrls: string[];
  photoData: any[];
  campaignId: string;
  isRetweet: boolean;
  isReply: boolean;
  isQuote: boolean;
  isEdited: boolean;
  isPinned: boolean;
  isSensitive: boolean;
  language: string;
  scrapedAt: string;
  tweetCreatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TweetsResponse {
  success: boolean;
  data: Tweet[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TweetFilter {
  page?: number;
  limit?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  language?: string;
  isRetweet?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/* =====================================
   CAMPAIGN ANALYTICS INTERFACES
   For aggregated metrics and statistics
   ===================================== */

export interface SentimentCounts {
  positive: number;
  negative: number;
  neutral: number;
  unknown: number;
}

export interface SentimentPercents {
  positive: number;
  negative: number;
  neutral: number;
  unknown: number;
}

export interface TopAuthor {
  author: TweetAuthor;
  totalEngagement: number;
  tweets: number;
}

export interface TopHashtag {
  hashtag: string;
  count: number;
  percentage: number;
}

export interface TopMention {
  mention: string;
  count: number;
  percentage: number;
}

export interface TopKeyword {
  keyword: string;
  count: number;
  percentage: number;
}

export interface LanguageDistribution {
  [language: string]: {
    count: number;
    percentage: number;
  };
}

export interface TweetsByDay {
  [date: string]: number; // YYYY-MM-DD format
}

export interface TypeDistribution {
  retweetsPercent: number;
  repliesPercent: number;
  quotesPercent: number;
  originalPercent: number;
}

export interface CampaignStats {
  // Basic counts
  totalTweets: number;
  tweetsByDay: TweetsByDay;

  // Sentiment analysis
  sentimentCounts: SentimentCounts;
  sentimentPercents: SentimentPercents;

  // Engagement metrics
  totalEngagement: number;
  avgEngagementPerTweet: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalQuotes: number;
  totalBookmarks: number;
  totalViews: number;
  avgLikes: number;
  avgRetweets: number;
  avgReplies: number;
  avgQuotes: number;
  avgBookmarks: number;
  avgViews: number;

  // Engagement rates
  globalEngagementRate: number; // (total engagement / total views) * 100
  avgEngagementPerTweetRate: number; // Average of individual tweet engagement rates

  // Top content and influencers
  topTweetsByEngagement: Tweet[];
  topTweetsByViews: Tweet[];
  topAuthorsByEngagement: TopAuthor[];

  // Hashtags, mentions, keywords
  topHashtags: TopHashtag[];
  topMentions: TopMention[];
  topKeywords: TopKeyword[];

  // Performance metrics
  avgProcessingTimeMs: number;
  analysisCoverage: number; // % of tweets with valid sentiment analysis

  // Distribution by language
  languageDistribution: LanguageDistribution;

  // Type distribution
  typeDistribution: TypeDistribution;
}

export interface TweetWithCalculatedFields extends Tweet {
  calculatedEngagement?: number;
  calculatedEngagementRate?: number;
}
