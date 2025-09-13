/**
 * Scraping Reducers - NgRx reducers for scraping operations
 */
import { createReducer, on } from '@ngrx/store';
import { JobProgress, ScrapingJob, ScrapingStats } from '../../interfaces/advanced-scraping.interface';
import { ScrapingProgress } from '../../services/scraping.service';
import * as ScrapingActions from '../actions/scraping.actions';

export interface ScrapingState {
  // Advanced Job Management
  jobs: ScrapingJob[];
  currentJob: ScrapingJob | null;
  isCreatingJob: boolean;
  isLoadingJobs: boolean;
  
  // Job Progress Tracking
  jobProgress: Record<string, JobProgress>; // Map of jobId -> progress
  isGettingJobProgress: Record<string, boolean>; // Map of jobId -> loading state
  
  // System Status
  systemHealth: any | null;
  queueStats: ScrapingStats | null;
  isLoadingHealth: boolean;
  isLoadingStats: boolean;
  
  // Legacy Campaign Scraping
  activeScraping: Record<string, boolean>; // Map of campaignId -> isActive
  progress: Record<string, ScrapingProgress>; // Map of campaignId -> progress
  lastResults: Record<string, any>; // Map of campaignId -> result
  scrapedTweets: Record<string, any[]>; // Map of campaignId -> tweets
  loading: boolean;
  error: string | null;
  statuses: Record<string, any>; // Map of campaignId -> status
}

export const initialState: ScrapingState = {
  // Advanced Job Management
  jobs: [],
  currentJob: null,
  isCreatingJob: false,
  isLoadingJobs: false,
  
  // Job Progress Tracking
  jobProgress: {},
  isGettingJobProgress: {},
  
  // System Status
  systemHealth: null,
  queueStats: null,
  isLoadingHealth: false,
  isLoadingStats: false,
  
  // Legacy Campaign Scraping
  activeScraping: {},
  progress: {},
  lastResults: {},
  scrapedTweets: {},
  loading: false,
  error: null,
  statuses: {},
};

export const scrapingReducer = createReducer(
  initialState,

  // Advanced Job Actions
  on(ScrapingActions.createAdvancedJob, (state) => ({
    ...state,
    isCreatingJob: true,
    error: null,
  })),

  on(ScrapingActions.createAdvancedJobSuccess, (state, { response, jobData }) => ({
    ...state,
    isCreatingJob: false,
    error: null,
    // Optionally add the new job to the jobs array if you have the full job data
  })),

  on(ScrapingActions.createAdvancedJobFailure, (state, { error }) => ({
    ...state,
    isCreatingJob: false,
    error: error?.message || 'Failed to create job',
  })),

  on(ScrapingActions.loadJobs, (state) => ({
    ...state,
    isLoadingJobs: true,
    error: null,
  })),

  on(ScrapingActions.loadJobsSuccess, (state, { jobs }) => ({
    ...state,
    isLoadingJobs: false,
    jobs,
    error: null,
  })),

  on(ScrapingActions.loadJobsFailure, (state, { error }) => ({
    ...state,
    isLoadingJobs: false,
    error: error?.message || 'Failed to load jobs',
  })),

  // Job Progress Actions
  on(ScrapingActions.getJobProgress, (state, { jobId }) => ({
    ...state,
    isGettingJobProgress: { ...state.isGettingJobProgress, [jobId]: true },
    error: null,
  })),

  on(ScrapingActions.getJobProgressSuccess, (state, { jobId, progress }) => ({
    ...state,
    isGettingJobProgress: { ...state.isGettingJobProgress, [jobId]: false },
    jobProgress: { ...state.jobProgress, [jobId]: progress },
    error: null,
  })),

  on(ScrapingActions.getJobProgressFailure, (state, { jobId, error }) => ({
    ...state,
    isGettingJobProgress: { ...state.isGettingJobProgress, [jobId]: false },
    error: error?.message || 'Failed to get job progress',
  })),

  // Job Cancellation Actions
  on(ScrapingActions.cancelJob, (state, { jobId }) => ({
    ...state,
    // Mark job as being cancelled (we'll use a temporary loading state)
    error: null,
  })),

  on(ScrapingActions.cancelJobSuccess, (state, { jobId }) => ({
    ...state,
    jobs: state.jobs.map(job => 
      job.id === jobId ? { ...job, status: 'cancelled' } : job
    ),
    error: null,
  })),

  on(ScrapingActions.cancelJobFailure, (state, { jobId, error }) => ({
    ...state,
    error: error?.message || 'Failed to cancel job',
  })),

  // System Health Actions
  on(ScrapingActions.getSystemHealth, (state) => ({
    ...state,
    isLoadingHealth: true,
    error: null,
  })),

  on(ScrapingActions.getSystemHealthSuccess, (state, { health }) => ({
    ...state,
    isLoadingHealth: false,
    systemHealth: health,
    error: null,
  })),

  on(ScrapingActions.getSystemHealthFailure, (state, { error }) => ({
    ...state,
    isLoadingHealth: false,
    error: error?.message || 'Failed to get system health',
  })),

  // Queue Stats Actions
  on(ScrapingActions.getQueueStats, (state) => ({
    ...state,
    isLoadingStats: true,
    error: null,
  })),

  on(ScrapingActions.getQueueStatsSuccess, (state, { stats }) => ({
    ...state,
    isLoadingStats: false,
    queueStats: stats,
    error: null,
  })),

  on(ScrapingActions.getQueueStatsFailure, (state, { error }) => ({
    ...state,
    isLoadingStats: false,
    error: error?.message || 'Failed to get queue stats',
  })),

  // Legacy Campaign Scraping Actions
  on(ScrapingActions.hashtagScraping, (state, { campaign }) => ({
    ...state,
    loading: true,
    error: null,
    activeScraping: { ...state.activeScraping, [campaign.id]: true },
  })),

  on(ScrapingActions.hashtagScrapingSuccess, (state, { campaignId }) => ({
    ...state,
    loading: false,
    activeScraping: { ...state.activeScraping, [campaignId]: false },
    error: null,
  })),

  on(ScrapingActions.hashtagScrapingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Unknown error',
  }))
);
