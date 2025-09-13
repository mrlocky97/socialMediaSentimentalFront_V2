/**
 * Scraping Actions - NgRx actions for scraping operations
 */
import { createAction, props } from '@ngrx/store';
import { CreateJobResponse, JobFormData, JobProgress, ScrapingJob, ScrapingStats } from '../../interfaces/advanced-scraping.interface';
import { Campaign } from '../../state/app.state';

// Advanced Job Creation Actions
export const createAdvancedJob = createAction(
  '[Scraping] Create Advanced Job',
  props<{ jobData: JobFormData }>()
);

export const createAdvancedJobSuccess = createAction(
  '[Scraping] Create Advanced Job Success',
  props<{ response: CreateJobResponse; jobData: JobFormData }>()
);

export const createAdvancedJobFailure = createAction(
  '[Scraping] Create Advanced Job Failure',
  props<{ error: any }>()
);

// Job Management Actions
export const loadJobs = createAction('[Scraping] Load Jobs');

export const loadJobsSuccess = createAction(
  '[Scraping] Load Jobs Success',
  props<{ jobs: ScrapingJob[] }>()
);

export const loadJobsFailure = createAction(
  '[Scraping] Load Jobs Failure',
  props<{ error: any }>()
);

// Job Progress Actions
export const getJobProgress = createAction(
  '[Scraping] Get Job Progress',
  props<{ jobId: string }>()
);

export const getJobProgressSuccess = createAction(
  '[Scraping] Get Job Progress Success',
  props<{ jobId: string; progress: JobProgress }>()
);

export const getJobProgressFailure = createAction(
  '[Scraping] Get Job Progress Failure',
  props<{ jobId: string; error: any }>()
);

// Job Cancellation Actions
export const cancelJob = createAction(
  '[Scraping] Cancel Job',
  props<{ jobId: string }>()
);

export const cancelJobSuccess = createAction(
  '[Scraping] Cancel Job Success',
  props<{ jobId: string }>()
);

export const cancelJobFailure = createAction(
  '[Scraping] Cancel Job Failure',
  props<{ jobId: string; error: any }>()
);

// System Health Actions
export const getSystemHealth = createAction('[Scraping] Get System Health');

export const getSystemHealthSuccess = createAction(
  '[Scraping] Get System Health Success',
  props<{ health: any }>()
);

export const getSystemHealthFailure = createAction(
  '[Scraping] Get System Health Failure',
  props<{ error: any }>()
);

// Queue Statistics Actions
export const getQueueStats = createAction('[Scraping] Get Queue Stats');

export const getQueueStatsSuccess = createAction(
  '[Scraping] Get Queue Stats Success',
  props<{ stats: ScrapingStats }>()
);

export const getQueueStatsFailure = createAction(
  '[Scraping] Get Queue Stats Failure',
  props<{ error: any }>()
);

// Hashtag scraping actions
export const hashtagScraping = createAction(
  '[Scraping] Start Hashtag Scraping',
  props<{ campaign: Campaign }>()
);

export const hashtagScrapingSuccess = createAction(
  '[Scraping] Hashtag Scraping Success',
  props<{ campaignId: string }>()
);

export const hashtagScrapingFailure = createAction(
  '[Scraping] Hashtag Scraping Failure',
  props<{ error: Error }>()
);

// Keyword scraping actions
export const keywordScraping = createAction(
  '[Scraping] Start Keyword Scraping',
  props<{ campaign: Campaign }>()
);

export const keywordScrapingSuccess = createAction(
  '[Scraping] Keyword Scraping Success',
  props<{ campaignId: string }>()
);

export const keywordScrapingFailure = createAction(
  '[Scraping] Keyword Scraping Failure',
  props<{ error: Error }>()
);

// User scraping actions
export const userScraping = createAction(
  '[Scraping] Start User Scraping',
  props<{ campaign: Campaign }>()
);

export const userScrapingSuccess = createAction(
  '[Scraping] User Scraping Success',
  props<{ campaignId: string }>()
);

export const userScrapingFailure = createAction(
  '[Scraping] User Scraping Failure',
  props<{ error: Error }>()
);

// Mention scraping actions
export const mentionScraping = createAction(
  '[Scraping] Start Mention Scraping',
  props<{ campaign: Campaign }>()
);

export const mentionScrapingSuccess = createAction(
  '[Scraping] Mention Scraping Success',
  props<{ campaignId: string }>()
);

export const mentionScrapingFailure = createAction(
  '[Scraping] Mention Scraping Failure',
  props<{ error: Error }>()
);

// Generic scraping failure action
export const scrapingFailure = createAction(
  '[Scraping] Generic Scraping Failure',
  props<{ error: Error }>()
);
