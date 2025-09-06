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
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: TweetSentimentEmotions;
  keywords: string[];
  analyzedAt: string;
  processingTime: number;
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
