/**
 * Advanced Scraping Interfaces
 * Defines the structure for the new advanced scraping system
 */

export interface JobProgress {
  jobId: string;
  current: number; // Tweets actuales
  total: number; // Tweets objetivo
  percentage: number; // Porcentaje completado
  currentBatch: number; // Batch actual
  totalBatches: number; // Total de batches
  status: 'pending' | 'running' | 'completed' | 'failed';
  tweetsCollected: number;
  estimatedTimeRemaining?: number; // En segundos
  errors: string[];
  throughput?: number; // Tweets por segundo
}

export interface CreateJobRequest {
  type: 'hashtag' | 'user' | 'search';
  query: string;
  targetCount: number;
  campaignId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  options: {
    includeReplies: boolean;
    includeRetweets: boolean;
  };
}

export interface CreateJobResponse {
  jobId: string;
  estimatedTime: number;
  websocketUrl: string;
}

export interface ScrapingJob {
  id: string;
  type: 'hashtag' | 'user' | 'search';
  query: string;
  targetCount: number;
  campaignId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: JobProgress;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  options: {
    includeReplies: boolean;
    includeRetweets: boolean;
  };
}

export interface ScrapingStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalTweetsCollected: number;
  averageProcessingTime: number;
  systemLoad: number;
}

export interface JobListResponse {
  jobs: ScrapingJob[];
  totalCount: number;
  hasMore: boolean;
}

// WebSocket Event Types
export interface WebSocketEvents {
  'job-progress': (data: JobProgress) => void;
  'job-completed': (data: { jobId: string; finalStats: JobProgress }) => void;
  'job-failed': (data: { jobId: string; error: string; progress: JobProgress }) => void;
  'job-cancelled': (data: { jobId: string }) => void;
  'system-stats': (data: ScrapingStats) => void;
}

// Job Creation Form Data
export interface JobFormData {
  type: 'hashtag' | 'user' | 'search';
  query: string;
  targetCount: number;
  campaignId?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  includeReplies: boolean;
  includeRetweets: boolean;
  analyzeSentiment: boolean;
}

// UI State Interfaces
export interface ScrapingUIState {
  isCreatingJob: boolean;
  selectedJobs: Set<string>;
  sortBy: 'createdAt' | 'priority' | 'status' | 'progress';
  sortDirection: 'asc' | 'desc';
  filterStatus: 'all' | 'pending' | 'running' | 'completed' | 'failed';
  viewMode: 'grid' | 'list';
}

export interface JobMetrics {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProgress: number;
  totalTweetsCollected: number;
  estimatedTimeRemaining: number;
}
