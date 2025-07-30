/**
 * Core types and interfaces for the application
 * Centralized type definitions following the NextJS project pattern
 */

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Campaign related types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  type: CampaignType;
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: Date;
  endDate: Date;
  maxTweets: number;
  sentimentAnalysis: boolean;
  emotionAnalysis?: boolean;
  topicsAnalysis?: boolean;
  influencerAnalysis?: boolean;
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastDataCollection?: Date;
  stats?: CampaignStats;
}

export type CampaignStatus = 'active' | 'inactive' | 'completed' | 'paused';
export type CampaignType = 'hashtag' | 'user' | 'keyword' | 'mention';

export interface CampaignStats {
  totalTweets: number;
  totalEngagement: number;
  avgSentiment: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topHashtags: Array<{ tag: string; count: number }>;
  topMentions: Array<{ mention: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  influencers: Array<{ username: string; followers: number; engagement: number }>;
}

// Tweet related types
export interface Tweet {
  id: string;
  tweetId: string;
  content: string;
  author: TwitterUser;
  metrics: TweetMetrics;
  sentiment?: SentimentAnalysis;
  hashtags: string[];
  mentions: string[];
  urls: string[];
  mediaUrls: string[];
  isRetweet: boolean;
  isReply: boolean;
  isQuote: boolean;
  language: string;
  createdAt: Date;
  scrapedAt: Date;
  campaignId?: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  location?: string;
  bio?: string;
  website?: string;
  joinedDate?: Date;
  influenceScore?: number;
  engagementRate?: number;
}

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views?: number;
  engagement: number;
}

// Sentiment Analysis types
export interface SentimentAnalysis {
  score: number;
  magnitude: number;
  label: SentimentLabel;
  confidence: number;
  emotions?: EmotionAnalysis;
  keywords?: string[];
  entities?: EntityAnalysis[];
  analyzedAt: Date;
  processingTime?: number;
}

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface EmotionAnalysis {
  joy: number;
  anger: number;
  fear: number;
  sadness: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface EntityAnalysis {
  name: string;
  type: EntityType;
  salience: number;
  sentiment: {
    score: number;
    label: SentimentLabel;
  };
}

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'WORK_OF_ART' | 'CONSUMER_GOOD' | 'OTHER';

// User and Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  organizationId?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export type UserRole = 'admin' | 'manager' | 'analyst' | 'onlyView' | 'client';

export interface UserPermissions {
  campaigns: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
    start: boolean;
    stop: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
    advanced: boolean;
  };
  users: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
  };
  admin: {
    systemSettings: boolean;
    userManagement: boolean;
    organizationSettings: boolean;
  };
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  settings: OrganizationSettings;
  createdAt: Date;
  isActive: boolean;
}

export interface OrganizationSettings {
  maxCampaigns: number;
  maxUsersPerCampaign: number;
  dataRetentionDays: number;
  allowedDomains?: string[];
  features: {
    advancedAnalytics: boolean;
    realTimeMonitoring: boolean;
    apiAccess: boolean;
    customReports: boolean;
  };
}

// Analytics and Reporting types
export interface AnalyticsData {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalTweets: number;
    totalEngagement: number;
    avgSentiment: number;
    sentimentTrend: Array<{ date: Date; sentiment: number }>;
    engagementTrend: Array<{ date: Date; engagement: number }>;
    volumeTrend: Array<{ date: Date; volume: number }>;
  };
  sentiment: {
    distribution: SentimentDistribution;
    topPositive: Tweet[];
    topNegative: Tweet[];
  };
  hashtags: Array<{ tag: string; count: number; sentiment: number }>;
  mentions: Array<{ mention: string; count: number; sentiment: number }>;
  influencers: Array<TwitterUser & { influence: number; sentiment: number }>;
  demographics: {
    locations: Array<{ location: string; count: number }>;
    languages: Array<{ language: string; count: number }>;
  };
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

// Chart and Visualization types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Common utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}
