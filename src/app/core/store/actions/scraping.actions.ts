/**
 * Scraping Actions - NgRx actions for scraping operations
 */
import { createAction, props } from '@ngrx/store';
import { BulkScrapeSummary } from '../../services/backend-api.service';
import { ScrapingProgress } from '../../services/scraping.service';
import { Campaign } from '../../state/app.state';

export const startScraping = createAction(
  '[Scraping] Start Scraping',
  props<{ campaign: Campaign }>()
);

export const startScrapingSuccess = createAction(
  '[Scraping] Start Scraping Success',
  props<{ campaignId: string }>()
);

export const startScrapingFailure = createAction(
  '[Scraping] Start Scraping Failure',
  props<{ error: any }>()
);

export const updateScrapingProgress = createAction(
  '[Scraping] Update Progress',
  props<{ progress: ScrapingProgress }>()
);

export const cancelScraping = createAction(
  '[Scraping] Cancel Scraping',
  props<{ campaignId: string }>()
);

export const cancelScrapingSuccess = createAction(
  '[Scraping] Cancel Scraping Success',
  props<{ campaignId: string }>()
);

export const cancelScrapingFailure = createAction(
  '[Scraping] Cancel Scraping Failure',
  props<{ error: any }>()
);

export const scrapingCompleted = createAction(
  '[Scraping] Scraping Completed',
  props<{ campaignId: string; result: BulkScrapeSummary }>()
);

export const getScrapingStatus = createAction(
  '[Scraping] Get Status',
  props<{ campaignId: string }>()
);

export const getScrapingStatusSuccess = createAction(
  '[Scraping] Get Status Success',
  props<{ status: any }>()
);

export const getScrapingStatusFailure = createAction(
  '[Scraping] Get Status Failure',
  props<{ error: any }>()
);

export const fetchScrapedTweets = createAction(
  '[Scraping] Fetch Scraped Tweets',
  props<{ campaignId: string; limit?: number }>()
);

export const fetchScrapedTweetsSuccess = createAction(
  '[Scraping] Fetch Scraped Tweets Success',
  props<{ campaignId: string; tweets: any[] }>()
);

export const fetchScrapedTweetsFailure = createAction(
  '[Scraping] Fetch Scraped Tweets Failure',
  props<{ error: any }>()
);

export const clearScrapingState = createAction(
  '[Scraping] Clear Scraping State'
);
