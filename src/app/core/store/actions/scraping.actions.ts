/**
 * Scraping Actions - NgRx actions for scraping operations
 */
import { createAction, props } from '@ngrx/store';
import { Campaign } from '../../state/app.state';

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
