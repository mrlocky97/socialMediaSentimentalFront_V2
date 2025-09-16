export interface ChunkProgress {
  current: number;
  total: number;
  isChunked: boolean;
}

export interface AsyncScrapingRequest {
  campaignId: string;
  hashtag?: string;
  keywords?: string[];
  mentions?: string[];
  maxTweets: number;
  language?: string;
  includeReplies?: boolean;
  analyzeSentiment?: boolean;
}

export interface AsyncScrapingResponse {
  sessionId: string;
  campaignId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  estimatedDuration?: number;
  message: string;
}

export interface ScrapingProgressUpdate {
  sessionId: string;
  campaignId: string;
  status: 'starting' | 'processing' | 'paused' | 'completed' | 'error' | 'cancelled';
  totalTweets: number;
  scrapedTweets: number;
  percentage: number;
  message: string;
  startTime: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number;
}

export interface ScrapingCompletedResult {
  sessionId: string;
  campaignId: string;
  tweetsCount: number;
  completedAt: Date;
  summary: {
    totalScraped: number;
    saved: number;
    errors: number;
    sentimentBreakdown?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

export interface ScrapingProgress {
  hashtags: {
    completed: number;
    total: number;
    inProgress: boolean;
    chunkProgress?: ChunkProgress;
  };
  search: {
    completed: number;
    total: number;
    inProgress: boolean;
    chunkProgress?: ChunkProgress;
  };
  users: {
    completed: number;
    total: number;
    inProgress: boolean;
    chunkProgress?: ChunkProgress;
  };
  metrics: {
    totalScraped: number;
    saved: number;
    errors: number;
    retryAttempts: number;
  };
  status: 'idle' | 'running' | 'completed' | 'error' | 'retrying';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // en segundos
  currentMessage?: string;
  isLargeRequest?: boolean;
  backgroundMode?: boolean;
}
